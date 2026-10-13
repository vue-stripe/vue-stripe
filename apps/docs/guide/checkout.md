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
// Node.js / Express
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.post('/api/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: 'price_xxx', quantity: 1 }], // decide the price on the server
    mode: 'payment', // or 'subscription' with a recurring price
    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://example.com/cancel'
  })

  res.json({ url: session.url })
})
```

Session options such as `customer_email`, `shipping_address_collection`, `allow_promotion_codes` and `automatic_tax` are set here too; see [Stripe's Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create).

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
import { useStripeCheckout } from '@vue-stripe/vue-stripe'

const { redirectToUrl, loading, error } = useStripeCheckout()

const handleCheckout = async () => {
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  const { url } = await response.json()
  redirectToUrl(url)
}
</script>

<template>
  <button :disabled="loading" @click="handleCheckout">
    {{ loading ? 'Redirecting...' : 'Checkout' }}
  </button>
  <p v-if="error" class="error">{{ error }}</p>
</template>
```

## 3. Confirm the payment on your server

Stripe sends the customer to `success_url` after paying. The customer can also open that URL directly, so check the session on your server before showing a confirmation:

```js
app.get('/success', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id)
  if (session.payment_status === 'paid') {
    res.render('success')
  }
})
```

Fulfil the order from the `checkout.session.completed` webhook, which arrives even if the customer closes the tab before the redirect. See [Fulfil orders with webhooks](/guide/webhooks).

Test data: see [Test your integration](/guide/testing#cards).

## See also

- [VueStripeCheckout API](/api/components/stripe-checkout): props, events and slots
- [useStripeCheckout API](/api/composables/use-stripe-checkout)
- [Embed Stripe Checkout](/guide/embedded-checkout)
- [Live demo](/live-demo/checkout-redirect)
- [Stripe docs: Checkout](https://docs.stripe.com/payments/checkout)
