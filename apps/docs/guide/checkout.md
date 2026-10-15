---
description: "Redirect customers to a Stripe-hosted Checkout page from Vue with VueStripeCheckout or useStripeCheckout, using the session URL from your server."
---

# Redirect to Stripe Checkout

Send the customer to a Stripe-hosted payment page with `VueStripeCheckout` or [`useStripeCheckout()`](/api/composables/use-stripe-checkout). Your server creates the Checkout Session and returns its `url`; Vue Stripe redirects to it with `window.location.replace()`. To compare hosted Checkout with the embedded and Elements options, see [Choosing an integration](/guide/approaches).

The redirect does not use Stripe.js, so this needs no provider: no `VueStripeProvider` and no `VueStripeElements`.

::: info Session URL only
Stripe.js no longer offers a client-side `redirectToCheckout()`. If you passed `sessionId` or `priceId` in v5, see [Upgrade from v5 to v6](/guide/migration-v6).
:::

## Before you begin

- A Stripe secret key on your server and a Price (`price_...`) in your Stripe account.
- Your app can reach your server's `/api` routes during development ([Send API requests to your server](/guide/installation#_5-send-api-requests-to-your-server)).

## 1. Create a Checkout Session on your server

```js
// Node.js (Express-style handler)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: 'price_xxx', quantity: 1 }], // decide the price on the server
    mode: 'payment', // or 'subscription' with a recurring price
    client_reference_id: 'order_123', // your own order ID, read back by the webhook
    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}', // a page in your app
    cancel_url: 'https://example.com/cancel'
  })

  res.json({ url: session.url })
})
```

The webhook that fulfils the order finds it from `client_reference_id` ([Fulfil orders with webhooks](/guide/webhooks#_2-handle-the-events-for-your-integration)). Session options such as `customer_email`, `shipping_address_collection`, `allow_promotion_codes` and `automatic_tax` are set here too; see [Stripe's Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create).

## 2. Add the checkout button

Fetch the session URL, then render `VueStripeCheckout`. If your endpoint fails, show your own message instead of the button; problems with the session itself (expired, already paid) are shown by Stripe on the hosted page.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripeCheckout } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const sessionUrl = ref('')
const failed = ref(false)

onMounted(async () => {
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  if (!response.ok) {
    failed.value = true
    return
  }
  sessionUrl.value = (await response.json()).url
})
</script>

<template>
  <p v-if="failed">Could not start checkout. Please try again.</p>
  <VueStripeCheckout
    v-else
    :session-url="sessionUrl"
    :disabled="!sessionUrl"
    button-text="Pay $49.99"
  />
</template>
```

`VueStripeCheckout` emits `@error` with a `VueStripeCheckoutError` when it is clicked without a `sessionUrl`.

### Use your own button

Style the default button with `button-class`, or put your own content in the default slot; clicking it starts the redirect:

```vue
<VueStripeCheckout :session-url="sessionUrl">
  <button class="my-checkout-button">Complete purchase</button>
</VueStripeCheckout>
```

### Redirect from your own code

To create the session on click, use the composable:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useStripeCheckout } from '@vue-stripe/vue-stripe'

const { redirectToUrl, loading } = useStripeCheckout()
const failed = ref(false)

const handleCheckout = async () => {
  failed.value = false
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  if (!response.ok) {
    failed.value = true
    return
  }
  redirectToUrl((await response.json()).url)
}
</script>

<template>
  <button :disabled="loading" @click="handleCheckout">
    {{ loading ? 'Redirecting...' : 'Checkout' }}
  </button>
  <p v-if="failed" class="error">Could not start checkout. Please try again.</p>
</template>
```

## 3. Show the outcome on the success page

Stripe sends the customer to `success_url` after paying. The customer can also open that URL directly, so ask your server for the session's status before showing a confirmation. Add a route that reads the session and always answers, paid or not:

```js
// GET /api/checkout-status?session_id=cs_test_...
app.get('/api/checkout-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id)
    res.json({ status: session.status, paymentStatus: session.payment_status })
  } catch {
    res.status(404).json({ error: 'No such Checkout Session' })
  }
})
```

Then render the page at `success_url` (`/success` here) in your app. It reads `session_id` from the URL and calls the route through your `/api` proxy:

```vue
<!-- SuccessPage.vue: the page at success_url -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const message = ref('Checking your payment...')

onMounted(async () => {
  const sessionId = new URLSearchParams(window.location.search).get('session_id') ?? ''
  try {
    const response = await fetch(`/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const { status, paymentStatus }: { status: string; paymentStatus: string } =
      await response.json()

    if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') {
      message.value = 'Thank you! Your payment was received.'
    } else if (status === 'complete') {
      message.value = 'Your payment is processing. We will email you when it completes.'
    } else {
      message.value = 'The payment was not completed.'
    }
  } catch {
    message.value = 'We could not check your payment. Please contact us.'
  }
})
</script>

<template>
  <p>{{ message }}</p>
</template>
```

`payment_status` is `paid` once the payment went through, and `no_payment_required` for a free order or a subscription that starts with a trial. A `complete` session that is still `unpaid` used a payment method that settles later, such as a bank debit.

Fulfil the order from the `checkout.session.completed` webhook, which arrives even if the customer closes the tab before the redirect. See [Fulfil orders with webhooks](/guide/webhooks).

Test data: see [Test your integration](/guide/testing#cards).

## See also

- [VueStripeCheckout API](/api/components/stripe-checkout): props, events and slots
- [useStripeCheckout API](/api/composables/use-stripe-checkout)
- [Embed Stripe Checkout](/guide/embedded-checkout)
- [Live demo](/live-demo/checkout-redirect)
- [Stripe docs: Checkout](https://docs.stripe.com/payments/checkout)
