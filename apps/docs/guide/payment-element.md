# Payment Element

The Payment Element is Stripe's recommended way to collect payments. It dynamically displays 40+ payment methods based on your customer's location, currency, and device.

## Basic Setup

```vue
<script setup>
import { ref, onMounted } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

onMounted(async () => {
  // Fetch from your backend
  const response = await fetch('/api/create-payment-intent')
  const data = await response.json()
  clientSecret.value = data.clientSecret
})

const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
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
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements v-if="clientSecret" :client-secret="clientSecret">
      <form @submit.prevent="handleSubmit">
        <StripePaymentElement />
        <button type="submit">Pay</button>
      </form>
    </StripeElements>
  </StripeProvider>
</template>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `object` | Payment Element options |

### Options

```vue
<StripePaymentElement
  :options="{
    layout: 'tabs',
    defaultValues: {
      billingDetails: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    business: {
      name: 'My Store'
    }
  }"
/>
```

#### Layout Options

```js
// Tabs layout (default) - payment methods as tabs
{ layout: 'tabs' }

// Accordion layout - payment methods as collapsible sections
{ layout: 'accordion' }

// Detailed configuration
{
  layout: {
    type: 'tabs',
    defaultCollapsed: false,
    radios: false,
    spacedAccordionItems: true
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `PaymentElement` | Element mounted and ready |
| `@change` | `{ complete, empty, value }` | Input state changed |
| `@focus` | `{ elementType }` | Element received focus |
| `@blur` | `{ elementType }` | Element lost focus |

```vue
<StripePaymentElement
  @ready="onReady"
  @change="onChange"
/>

<script setup>
const onReady = (element) => {
  console.log('Payment Element ready')
}

const onChange = (event) => {
  if (event.complete) {
    // All required fields are filled
  }
}
</script>
```

## Customizing Appearance

Use Stripe's Appearance API via `StripeElements`:

```vue
<StripeElements
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
  <StripePaymentElement />
</StripeElements>
```

### Theme Options

```js
// Built-in themes
appearance: { theme: 'stripe' }      // Default light theme
appearance: { theme: 'night' }       // Dark theme
appearance: { theme: 'flat' }        // Minimal borders
appearance: { theme: 'none' }        // No styling (BYO CSS)
```

## Pre-filling Customer Data

```vue
<StripePaymentElement
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
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(true)
const processing = ref(false)
const errorMessage = ref('')
const isComplete = ref(false)

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
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  if (!stripe.value || !elements.value) return

  processing.value = true
  errorMessage.value = ''

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
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

    <StripeProvider v-else :publishable-key="publishableKey">
      <StripeElements
        v-if="clientSecret"
        :client-secret="clientSecret"
        :options="{ appearance: { theme: 'stripe' } }"
      >
        <form @submit.prevent="handleSubmit">
          <StripePaymentElement @change="handleChange" />

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
      </StripeElements>

      <div v-else-if="errorMessage" class="error">
        {{ errorMessage }}
      </div>
    </StripeProvider>
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

- [Express Checkout](/guide/express-checkout) - Add Apple Pay and Google Pay
- [Customization](/guide/customization) - Theme and style your payment form
- [Error Handling](/guide/error-handling) - Handle all error cases
