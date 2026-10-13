# Collect payment details before creating an Intent

Render the Payment Element before any PaymentIntent exists, and create the Intent only when the customer clicks Pay. Use this when the amount is not final until checkout, when you don't want an Intent for every visitor who opens the page, or when your server must check the order before charging.

You need a page that already uses the Payment Element (see [Accept a payment with the Payment Element](/guide/payment-element)) and a server endpoint that can create PaymentIntents.

## 1. Render the Payment Element with `mode`, `amount` and `currency`

Instead of `client-secret`, give `VueStripeElements` what the Intent will be:

```vue
<!-- CheckoutPage.vue -->
<script setup lang="ts">
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import PayButton from './PayButton.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const cartTotal = 1099 // in cents, from your cart
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements mode="payment" :amount="cartTotal" currency="usd">
      <VueStripePaymentElement />
      <PayButton />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

The Payment Element shows the payment methods enabled in your Dashboard that support this amount and currency. To limit them, pass `:options="{ allowedPaymentMethodTypes: ['card', 'sepa_debit'] }"` to `VueStripeElements`.

Set `amount` before the customer starts typing. A change to `mode`, `amount`, `currency` or `setup-future-usage` creates a new Elements group, and the Payment Element remounts empty.

## 2. Validate, create the Intent, then confirm

When the customer clicks Pay, run the steps in this order:

1. `submit()` from `useStripeElements` validates the form and collects wallet details. Stripe requires it before any other asynchronous work, so call it first.
2. Ask your server for a PaymentIntent.
3. Confirm with `usePaymentIntent`, passing `skipSubmit: true` because the form was already submitted.

```vue
<!-- PayButton.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { useStripeElements, usePaymentIntent } from '@vue-stripe/vue-stripe'

const { submit } = useStripeElements()
const { confirmPayment, loading } = usePaymentIntent()
const message = ref('')

const pay = async () => {
  message.value = ''

  // 1. Validate the form and collect wallet details
  const { error: submitError } = await submit()
  if (submitError) {
    message.value = submitError.message ?? 'Check your payment details.'
    return
  }

  // 2. Create the PaymentIntent on your server
  const response = await fetch('/api/create-payment-intent', { method: 'POST' })
  if (!response.ok) {
    message.value = 'Could not start the payment. Please try again.'
    return
  }
  const { clientSecret } = await response.json()

  // 3. Confirm without submitting again
  const { error } = await confirmPayment({
    clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` },
    redirect: 'if_required',
    skipSubmit: true
  })
  message.value = error ? (error.message ?? 'Payment failed.') : 'Payment received.'
}
</script>

<template>
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="message">{{ message }}</p>
</template>
```

## 3. Create a matching PaymentIntent on the server

The PaymentIntent must match what the Elements group was created with: the same amount, currency and payment method settings. Compute the amount from the order on the server; never take it from the browser.

```js
// POST /api/create-payment-intent (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/create-payment-intent', async (req, res) => {
  const order = await loadOrderForSession(req) // your code
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total, // 1099
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id }
  })
  res.json({ clientSecret: paymentIntent.client_secret })
})
```

If you passed `allowedPaymentMethodTypes` in step 1, create the Intent with the same list as `payment_method_types` instead of `automatic_payment_methods`. Fulfil the order from the `payment_intent.succeeded` [webhook](/guide/webhooks).

## Variations

### Save a payment method without charging

Use `mode="setup"` with `currency` and no `amount`, create a SetupIntent on the server, and confirm with `confirmSetup()` from `useSetupIntent`, again with `skipSubmit: true`. See [Save a payment method for later](/guide/setup-intent).

### Start a subscription

Use `mode="subscription"` with the first invoice's `amount` and `currency`, create the subscription on the server, and confirm its first payment as in step 2. See [Start a subscription](/guide/subscriptions).

### Confirm on your server

To create and confirm the PaymentIntent in one server call, create a ConfirmationToken in the browser with `useCreateConfirmationToken` instead of confirming there. [Confirm payments on your server](/guide/tokens#confirmationtoken-confirm-on-your-server) walks through it.

### Create a PaymentMethod first

To get a PaymentMethod (`pm_...`) from the Payment Element, for example to attach it to a customer before you decide what to charge, create the Elements group with `:options="{ paymentMethodCreation: 'manual' }"` and call `createPaymentMethod()` from [`useCreatePaymentMethod`](/api/composables/use-create-payment-method). It submits the form first.

## Result

The payment form loads without a PaymentIntent. Your server creates the Intent only when the customer pays, with an amount it computed itself, and the payment is confirmed in the browser.
