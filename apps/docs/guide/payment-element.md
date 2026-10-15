---
description: "Accept a payment in Vue with VueStripePaymentElement and usePaymentIntent: create a PaymentIntent on your server, render the form and confirm it."
---

# Accept a payment with the Payment Element

Collect a payment with `VueStripePaymentElement` and confirm it with [`usePaymentIntent()`](/api/composables/use-payment-intent). The Payment Element shows every payment method you enable in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods) that fits the customer's location, currency and device.

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- Your server has an endpoint that creates a PaymentIntent and returns its `client_secret`.
- Your app can reach your server's `/api` routes during development ([Send API requests to your server](/guide/installation#_5-send-api-requests-to-your-server)).

## 1. Create a PaymentIntent on your server

```ts
// POST /api/create-payment-intent (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createPaymentIntent() {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: 'order_123' } // your own order ID, read back by the webhook
  })
  return { clientSecret: paymentIntent.client_secret }
}
```

The webhook that fulfils the order finds it from `metadata.orderId`, and skips PaymentIntents without one, such as those that Checkout creates ([Fulfil orders with webhooks](/guide/webhooks#_2-handle-the-events-for-your-integration)).

## 2. Load Stripe and create the Elements group

The page fetches the client secret, then renders `VueStripeProvider` and `VueStripeElements`. The form goes in a child component, because composables find the Elements group through the providers above them.

```vue
<!-- PaymentPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import PaymentForm from './PaymentForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const errorMessage = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/create-payment-intent', { method: 'POST' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    clientSecret.value = (await response.json()).clientSecret
  } catch {
    errorMessage.value = 'Could not start the payment. Please reload the page.'
  }
})
</script>

<template>
  <p v-if="errorMessage">{{ errorMessage }}</p>
  <VueStripeProvider v-else :publishable-key="publishableKey">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
      <PaymentForm :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## 3. Render the Payment Element and confirm

`confirmPayment()` runs `elements.submit()` for you, then confirms with the injected Elements group.

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

  // With redirect: 'always', success leaves the page; only errors return here
  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VueStripePaymentElement @change="handleChange" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <button type="submit" :disabled="processing || !isComplete">
      {{ processing ? 'Processing...' : 'Pay $20.00' }}
    </button>
  </form>
</template>
```

The error message stays until the customer clicks Pay again; `handleChange` only tracks whether the form is complete, because Stripe sends a `change` event right after a decline. The customer is sent to `return_url` after a successful payment. Read the result there from the `payment_intent_client_secret` query parameter with `retrievePaymentIntent()` from the same composable.

When the element loads, Stripe.js logs "Your Elements integration is using an older API" in the browser console. That is expected for a Payment Element on a PaymentIntent, and needs no change; [Troubleshoot common problems](/guide/troubleshooting#the-console-says-your-elements-integration-is-using-an-older-api) explains it.

## Stay on the page when no redirect is needed

Pass `redirect: 'if_required'` (the composable's default) to get the result back without leaving the page. Payment methods that need a redirect, such as bank redirects, still go to `return_url`, so keep it set.

```ts
const { error, paymentIntent } = await confirmPayment({
  clientSecret: props.clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/payment-complete`
  },
  redirect: 'if_required'
})

if (error) {
  errorMessage.value = error.message || 'Payment failed'
} else if (paymentIntent?.status === 'succeeded') {
  // Show your success state
}
```

## Pre-fill customer details

Pass known billing details through `defaultValues`:

```vue
<VueStripePaymentElement
  :options="{
    defaultValues: {
      billingDetails: {
        name: customer.name,
        email: customer.email,
        address: { postal_code: customer.zip, country: customer.country }
      }
    }
  }"
/>
```

To change colors and fonts, pass an `appearance` object to `VueStripeElements`; see [Style elements](/guide/styling#_2-theme-the-fields-with-the-appearance-api) and the [Appearance API](/api/components/stripe-elements#appearance-api) reference.

Test data: see [Test your integration](/guide/testing#cards).

## See also

- [Add Apple Pay, Google Pay and Link buttons](/guide/express-checkout)
- [Payment Element API](/api/components/stripe-payment-element): props, events and options
- [usePaymentIntent API](/api/composables/use-payment-intent): confirm options and result
- [Handle errors and declines](/guide/error-handling)
- [Collect payment details before creating an Intent](/guide/deferred-intent)
- [Live demo](/live-demo/payment-element)
- [Stripe docs: payment methods](https://docs.stripe.com/payments/payment-methods/overview)
