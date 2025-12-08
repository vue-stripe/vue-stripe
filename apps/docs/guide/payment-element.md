# Payment Element

The Payment Element is Stripe's recommended way to collect payments. It dynamically displays 40+ payment methods based on your customer's location, currency, and device.

## Basic Setup

```vue
<script setup>
import { ref, onMounted } from 'vue'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

// Capture instances from component events
const stripeInstance = ref<Stripe | null>(null)
const elementsInstance = ref<StripeElements | null>(null)

const onStripeLoad = (stripe: Stripe) => {
  stripeInstance.value = stripe
}

const onElementsReady = (elements: StripeElements) => {
  elementsInstance.value = elements
}

onMounted(async () => {
  // Fetch from your backend
  const response = await fetch('/api/create-payment-intent')
  const data = await response.json()
  clientSecret.value = data.clientSecret
})

const handleSubmit = async () => {
  if (!stripeInstance.value || !elementsInstance.value) return

  const { error } = await stripeInstance.value.confirmPayment({
    elements: elementsInstance.value,
    confirmParams: {
      return_url: `${window.location.origin}/complete`
    }
  })

  if (error) {
    console.error(error.message)
  }
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
    <VueStripeElements
      v-if="clientSecret"
      :client-secret="clientSecret"
      @ready="onElementsReady"
    >
      <form @submit.prevent="handleSubmit">
        <VueStripePaymentElement />
        <button type="submit">Pay</button>
      </form>
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## Customizing Appearance

Use Stripe's Appearance API via `VueStripeElements`:

```vue
<VueStripeElements
  :client-secret="clientSecret"
  :options="{
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px'
      },
      rules: {
        '.Input': {
          border: '1px solid #e6e6e6'
        },
        '.Input:focus': {
          border: '1px solid #0570de',
          boxShadow: '0 0 0 1px #0570de'
        }
      }
    }
  }"
>
  <VueStripePaymentElement />
</VueStripeElements>
```

## Pre-filling Customer Data

```vue
<VueStripePaymentElement
  :options="{
    defaultValues: {
      billingDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: {
          line1: customer.address,
          city: customer.city,
          state: customer.state,
          postal_code: customer.zip,
          country: customer.country
        }
      }
    }
  }"
/>
```

## Handling Payment Confirmation

### Standard Flow (with redirect)

```js
const { error } = await stripe.value.confirmPayment({
  elements: elements.value,
  confirmParams: {
    return_url: 'https://yoursite.com/payment-complete'
  }
})

// If error, show it (user stays on page)
// If success, user is redirected to return_url
```

### Without Redirect

For SPA flows where you don't want to redirect:

```js
const { error, paymentIntent } = await stripe.value.confirmPayment({
  elements: elements.value,
  confirmParams: {
    return_url: 'https://yoursite.com/payment-complete'
  },
  redirect: 'if_required'
})

if (error) {
  // Show error
} else if (paymentIntent.status === 'succeeded') {
  // Payment succeeded, show success UI
}
```

::: warning
Some payment methods (like bank redirects) always require a redirect. Use `redirect: 'if_required'` to handle both cases.
:::

## Payment Methods

Enable payment methods in your [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). The Payment Element automatically shows enabled methods.

Common payment methods:
- **Cards** - Visa, Mastercard, Amex, etc.
- **Wallets** - Apple Pay, Google Pay, Link
- **Bank debits** - ACH, SEPA, BACS
- **Bank redirects** - iDEAL, Bancontact, Sofort
- **Buy now, pay later** - Klarna, Afterpay, Affirm

## Complete Example with Error Handling

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(true)
const processing = ref(false)
const errorMessage = ref('')
const isComplete = ref(false)

// Capture instances from component events
const stripeInstance = ref<Stripe | null>(null)
const elementsInstance = ref<StripeElements | null>(null)

const onStripeLoad = (stripe: Stripe) => {
  stripeInstance.value = stripe
}

const onElementsReady = (elements: StripeElements) => {
  elementsInstance.value = elements
}

onMounted(async () => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2000 })
    })
    const data = await response.json()
    clientSecret.value = data.clientSecret
  } catch (err) {
    errorMessage.value = 'Failed to initialize payment'
  } finally {
    loading.value = false
  }
})

const handleChange = (event: { complete: boolean }) => {
  isComplete.value = event.complete
  errorMessage.value = ''
}

const handleSubmit = async () => {
  if (!stripeInstance.value || !elementsInstance.value) return

  processing.value = true
  errorMessage.value = ''

  const { error } = await stripeInstance.value.confirmPayment({
    elements: elementsInstance.value,
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    }
  })

  if (error) {
    if (error.type === 'card_error' || error.type === 'validation_error') {
      errorMessage.value = error.message || 'Payment failed'
    } else {
      errorMessage.value = 'An unexpected error occurred'
    }
    processing.value = false
  }
}
</script>

<template>
  <div class="payment-form">
    <div v-if="loading">Loading payment form...</div>

    <VueStripeProvider v-else :publishable-key="publishableKey" @load="onStripeLoad">
      <VueStripeElements
        v-if="clientSecret"
        :client-secret="clientSecret"
        :options="{ appearance: { theme: 'stripe' } }"
        @ready="onElementsReady"
      >
        <form @submit.prevent="handleSubmit">
          <VueStripePaymentElement @change="handleChange" />

          <div v-if="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            :disabled="processing || !isComplete"
          >
            {{ processing ? 'Processing...' : 'Pay $20.00' }}
          </button>
        </form>
      </VueStripeElements>

      <div v-else-if="errorMessage" class="error">
        {{ errorMessage }}
      </div>
    </VueStripeProvider>
  </div>
</template>

<style scoped>
.payment-form {
  max-width: 400px;
  margin: 0 auto;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

button {
  background: #5469d4;
  color: #fff;
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #df1b41;
  font-size: 14px;
}
</style>
```

## Next Steps

- [Express Checkout](/guide/express-checkout) — Add Apple Pay and Google Pay
- [Customization](/guide/customization) — Theme and style your payment form
- [Error Handling](/guide/error-handling) — Handle all error cases
- [API Reference](/api/components/stripe-payment-element) — Full props, events, and options
