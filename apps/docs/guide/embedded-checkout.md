# Embed Stripe Checkout

Put Stripe's prebuilt Checkout page inside your own page with `VueStripeEmbeddedCheckout`. Stripe renders the full form (line items, totals, payment methods, addresses, tax IDs, promotion codes) in an iframe, and the customer never leaves your site. To compare it with hosted Checkout and your own Elements form, see [Choosing an integration](/guide/approaches).

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- A Stripe secret key on your server and a Price (`price_...`) in your Stripe account.

## How the steps fit together

```mermaid
sequenceDiagram
    participant Browser
    participant Server
    participant Stripe
    Browser->>Server: POST /checkout-session
    Server->>Stripe: checkout.sessions.create({ ui_mode: 'embedded_page' })
    Stripe-->>Server: session.client_secret
    Server-->>Browser: clientSecret
    Browser->>Stripe: createEmbeddedCheckoutPage({ clientSecret })
    Note over Browser: Customer pays inside the iframe
    Stripe-->>Browser: redirect to return_url (or onComplete)
```

## 1. Create the session on your server

Create the session with `ui_mode: 'embedded_page'` and a `return_url`, and send `client_secret` to the browser:

```js
// Node.js (Express-style handler)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    line_items: [{ price: 'price_123', quantity: 1 }],
    return_url: 'https://example.com/checkout/complete?session_id={CHECKOUT_SESSION_ID}'
  })

  res.json({ clientSecret: session.client_secret })
})
```

Stripe replaces `{CHECKOUT_SESSION_ID}` with the session ID when it redirects.

## 2. Render the component

Put `VueStripeEmbeddedCheckout` inside `VueStripeProvider`. Pass either a `client-secret` you already have, or a `fetch-client-secret` function that Stripe calls when it creates the page:

```vue
<!-- CheckoutPage.vue -->
<script setup lang="ts">
import { VueStripeProvider, VueStripeEmbeddedCheckout } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const fetchClientSecret = () =>
  fetch('/api/checkout-session', { method: 'POST' })
    .then((response) => response.json())
    .then((data) => data.clientSecret)
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeEmbeddedCheckout :fetch-client-secret="fetchClientSecret">
      <template #loading>Loading checkout...</template>
      <template #error="{ error }">Checkout could not load: {{ error }}</template>
    </VueStripeEmbeddedCheckout>
  </VueStripeProvider>
</template>
```

That is the whole integration. Stripe handles the payment form, validation, 3D Secure and wallets.

## 3. Handle completion

After a successful payment Stripe redirects the customer to your `return_url`. Read the session ID from the URL and check the session on your server:

```js
// GET /checkout/complete?session_id=cs_test_...
app.get('/api/checkout-session/:id', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.params.id)
  res.json({ status: session.status, paymentStatus: session.payment_status })
})
```

`status: 'complete'` and `payment_status: 'paid'` mean the payment went through. Fulfil orders from the `checkout.session.completed` webhook, not from the return page, so a closed browser tab does not lose an order.

### Stay on the page

To show your own success message instead of redirecting, create the session with `redirect_on_completion: 'if_required'` (only redirect-based payment methods use `return_url`) or `'never'`, and listen for `@complete`:

```vue
<script setup>
import { ref } from 'vue'

const done = ref(false)
</script>

<template>
  <p v-if="done">Thank you for your order.</p>
  <VueStripeEmbeddedCheckout
    v-else
    :client-secret="clientSecret"
    @complete="done = true"
  />
</template>
```

The component destroys the embedded page when `v-if` removes it.

## Switch to another session

Stripe allows a single Embedded Checkout on a page at a time. If a second `VueStripeEmbeddedCheckout` mounts while another one is on the page, it renders its `#error` slot and emits `@error` instead of loading. To switch to a different Checkout Session, re-mount the component, for example with `:key`:

```vue
<VueStripeEmbeddedCheckout :key="clientSecret" :client-secret="clientSecret" />
```

## Approve line item changes

When the session lets customers change line items and sets `permissions.update.line_items: 'server_only'`, Stripe asks you to approve each change. Pass an `on-line-items-change` function that updates the session on your server and resolves `{ type: 'accept' }` or `{ type: 'reject', errorMessage }`. See [onLineItemsChange](/api/components/stripe-embedded-checkout#onlineitemschange) in the API reference.

## Track the checkout funnel

`@analytics` forwards Stripe's analytics events (`rendered`, `deviceData`, `promotionCodeApplied`, `lineItemChange`, `checkoutSubmitted`, `checkoutSubmitFailed`), so you can track the funnel without reaching into the iframe:

```vue
<VueStripeEmbeddedCheckout
  :client-secret="clientSecret"
  @analytics="(event) => track(event.eventType, event.details)"
/>
```

Test data: see [Test your integration](/guide/testing#cards).

## See also

- [VueStripeEmbeddedCheckout API](/api/components/stripe-embedded-checkout): props, events and slots
- [Build your own checkout page on a Checkout Session](/guide/custom-checkout)
- [Redirect to Stripe Checkout](/guide/checkout)
- [Live demo](/live-demo/embedded-checkout)
