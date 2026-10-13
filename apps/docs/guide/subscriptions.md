# Start a subscription

Sign a customer up for a recurring price and collect the first payment. There are three ways to do it with Vue Stripe; pick one:

| Way | You build | Guide |
|-----|-----------|-------|
| Stripe Checkout in subscription mode | A button; Stripe hosts the page | Option A below |
| A pricing table | Nothing but the embed; Stripe hosts the plans and the checkout | [Embed a pricing table](/guide/pricing-table) |
| The Payment Element on your page | Your own page; your server creates the subscription | Option B below |

For the trade-offs, see [Choosing an integration](/guide/approaches).

Before you start, create a product with a **recurring** price in the Stripe Dashboard (or with the API) and note its price ID (`price_...`).

## Option A: Stripe Checkout

### 1. Create a Checkout Session in subscription mode

```js
// POST /api/subscription-checkout (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/subscription-checkout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: 'price_...', quantity: 1 }],
    customer_email: req.user.email, // or customer: 'cus_...' for an existing customer
    success_url: 'https://example.com/welcome?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://example.com/pricing'
  })
  res.json({ url: session.url })
})
```

### 2. Redirect to Checkout

`useStripeCheckout` needs no provider, because hosted Checkout is a plain redirect to the session URL:

```vue
<script setup lang="ts">
import { useStripeCheckout } from '@vue-stripe/vue-stripe'

const { redirectToUrl, loading } = useStripeCheckout()

const subscribe = async () => {
  const response = await fetch('/api/subscription-checkout', { method: 'POST' })
  const { url } = await response.json()
  redirectToUrl(url)
}
</script>

<template>
  <button :disabled="loading" @click="subscribe">Subscribe</button>
</template>
```

`VueStripeCheckout` does the same as a component: `<VueStripeCheckout :session-url="url" button-text="Subscribe" />`. To keep the customer on your site, embed the same session with [`VueStripeEmbeddedCheckout`](/guide/embedded-checkout) instead. Try it in the [subscription Checkout demo](/live-demo/subscription-checkout).

## Option B: the Payment Element

### 1. Create the subscription on the server

Create the subscription in an incomplete state, and return the client secret of its first invoice's payment:

```js
// POST /api/subscription (Node, stripe-node)
app.post('/api/subscription', async (req, res) => {
  const customer = await stripe.customers.create({ email: req.body.email })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: 'price_...' }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.confirmation_secret']
  })

  res.json({
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.confirmation_secret.client_secret
  })
})
```

`payment_behavior: 'default_incomplete'` keeps the subscription `incomplete` until the first payment succeeds, and `save_default_payment_method` stores the payment method for renewals. Since Stripe API version 2025-03-31 (Basil), the first payment's client secret is on `latest_invoice.confirmation_secret`; older API versions used `latest_invoice.payment_intent`.

In a real app, look up the signed-in customer instead of creating one per request.

### 2. Collect payment details and confirm

Render the Payment Element with the client secret and confirm with `usePaymentIntent`, as for a one-time payment:

```vue
<!-- SubscribePage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import ConfirmSubscription from './ConfirmSubscription.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const email = ref('')
const clientSecret = ref('')

const start = async () => {
  const response = await fetch('/api/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value })
  })
  clientSecret.value = (await response.json()).clientSecret
}
</script>

<template>
  <form v-if="!clientSecret" @submit.prevent="start">
    <input v-model="email" type="email" placeholder="Email" required />
    <button>Continue</button>
  </form>

  <VueStripeProvider v-else :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
      <ConfirmSubscription :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

```vue
<!-- ConfirmSubscription.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmPayment, loading, error } = usePaymentIntent()
const active = ref(false)

const subscribe = async () => {
  const { paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/welcome` },
    redirect: 'if_required'
  })
  active.value = paymentIntent?.status === 'succeeded'
}
</script>

<template>
  <p v-if="active">Subscription started.</p>
  <template v-else>
    <button :disabled="loading" @click="subscribe">Start subscription</button>
    <p v-if="error">{{ error }}</p>
  </template>
</template>
```

When the first payment succeeds, Stripe activates the subscription. Try this flow in the [embedded subscription demo](/live-demo/subscription-embedded).

To show the Payment Element before the subscription exists, render `VueStripeElements` with `mode="subscription"`, `amount` and `currency`, and create the subscription when the customer clicks; see [Collect payment details before creating an Intent](/guide/deferred-intent).

### Subscriptions with a free trial

With a trial, the first invoice is for $0 and has no payment to confirm. Add `'pending_setup_intent'` to `expand`, return `subscription.pending_setup_intent.client_secret`, and confirm it with `confirmSetup()` from [`useSetupIntent`](/api/composables/use-setup-intent) instead.

## Keep access in sync with webhooks

The subscription renews, fails and ends on Stripe's side, so drive access from [webhooks](/guide/webhooks), not from the browser:

| Event | Do |
|-------|----|
| `invoice.paid` | Grant or extend access for the period paid. |
| `invoice.payment_failed` | Tell the customer to update their payment method. |
| `customer.subscription.updated` | Apply plan changes, cancellations at period end and status changes. |
| `customer.subscription.deleted` | Remove access. |

Let customers manage their plan and payment method in the [customer portal](https://docs.stripe.com/customer-management) rather than building those screens yourself.

## Test it

Pay with `4242 4242 4242 4242`. To see renewals and failed renewals without waiting a month, use test clocks and the card `4000 0000 0000 0341`; see [Test your integration](/guide/testing#subscriptions-and-renewals).

## Result

The customer has an active subscription with a saved payment method, and your webhook handler grants access on every paid invoice.
