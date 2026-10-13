# Payment Element

The Payment Element is Stripe's recommended way to collect payments. It dynamically displays 40+ payment methods based on your customer's location, currency, and device.

## Basic Setup

The page loads Stripe and creates the Elements group; a child component rendered inside them shows the Payment Element and confirms with [`usePaymentIntent()`](/api/composables/use-payment-intent):

```vue
<!-- PaymentPage.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from './PaymentForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

onMounted(async () => {
  // Fetch from your backend
  const response = await fetch('/api/create-payment-intent')
  const data = await response.json()
  clientSecret.value = data.clientSecret
})
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
      <PaymentForm :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

```vue
<!-- PaymentForm.vue: rendered inside VueStripeElements -->
<script setup>
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({
  clientSecret: { type: String, required: true }
})

const { confirmPayment } = usePaymentIntent()

const handleSubmit = async () => {
  // Runs elements.submit() for you, then confirms
  const { error } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/complete`
    },
    redirect: 'always'
  })

  if (error) {
    console.error(error.message)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VueStripePaymentElement />
    <button type="submit">Pay</button>
  </form>
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

Confirm with [`usePaymentIntent()`](/api/composables/use-payment-intent), called in a component inside `VueStripeElements`. It validates the form with `elements.submit()` first, then confirms with the injected Elements group.

```js
const { confirmPayment } = usePaymentIntent()
```

### Standard Flow (with redirect)

```js
const { error } = await confirmPayment({
  clientSecret,
  confirmParams: {
    return_url: 'https://yoursite.com/payment-complete'
  },
  redirect: 'always'
})

// If error, show it (user stays on page)
// If success, user is redirected to return_url
```

### Without Redirect

For SPA flows where you don't want to redirect, use `redirect: 'if_required'` (the composable's default):

```js
const { error, paymentIntent } = await confirmPayment({
  clientSecret,
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
<!-- PaymentPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import PaymentForm from './PaymentForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(true)
const errorMessage = ref('')

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
</script>

<template>
  <div class="payment-form">
    <div v-if="loading">Loading payment form...</div>

    <VueStripeProvider v-else :publishable-key="publishableKey">
      <VueStripeElements
        v-if="clientSecret"
        :client-secret="clientSecret"
        :options="{ appearance: { theme: 'stripe' } }"
      >
        <PaymentForm :client-secret="clientSecret" />
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

.error {
  color: #df1b41;
  font-size: 14px;
}
</style>
```

```vue
<!-- PaymentForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { confirmPayment, loading: processing } = usePaymentIntent()
const errorMessage = ref('')
const isComplete = ref(false)

const handleChange = (event: { complete: boolean }) => {
  isComplete.value = event.complete
  errorMessage.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''

  const { error } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    },
    redirect: 'always'
  })

  if (error) {
    const type = 'type' in error ? error.type : undefined
    if (type === 'card_error' || type === 'validation_error') {
      errorMessage.value = error.message || 'Payment failed'
    } else {
      errorMessage.value = 'An unexpected error occurred'
    }
  }
}
</script>

<template>
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
</template>

<style scoped>
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
- [Appearance API](/api/components/stripe-elements#appearance-api) — Theme and style your payment form
- [Error Handling](/api/composables/use-payment-intent#error-handling) — Handle all error cases
- [API Reference](/api/components/stripe-payment-element) — Full props, events, and options
