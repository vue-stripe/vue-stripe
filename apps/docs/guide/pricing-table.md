# Embed a pricing table

Embed a pricing table you configured in the Stripe Dashboard with `VueStripePricingTable`. Customers pick a plan and go to Stripe Checkout to subscribe; the products, prices and look of the table live in the Dashboard, so changes there need no code change.

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- Your page is served over `http(s)://`; the table does not render from `file://`.

## 1. Create the pricing table in the Dashboard

1. Go to **Product catalog > Pricing tables** in the [Stripe Dashboard](https://dashboard.stripe.com/pricing-tables).
2. Click **Create pricing table** and add your products and prices.
3. Copy the pricing table ID (`prctbl_...`) from the embed code.

## 2. Embed the table

`VueStripePricingTable` needs `VueStripeProvider` for the publishable key, but no `VueStripeElements`: it is not a Stripe Element.

```vue
<script setup lang="ts">
import { VueStripeProvider, VueStripePricingTable } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripePricingTable pricing-table-id="prctbl_1234567890">
      <template #loading>Loading pricing options...</template>
      <template #error="{ error }">Unable to load pricing: {{ error }}</template>
    </VueStripePricingTable>
  </VueStripeProvider>
</template>
```

The component also emits `@load` when the table is ready and `@error` when Stripe's pricing table script fails to load.

## Pre-fill the email and link the subscription to your user

Pass `customer-email` to pre-fill Checkout, and `client-reference-id` to find your user again in the `checkout.session.completed` webhook:

```vue
<VueStripePricingTable
  pricing-table-id="prctbl_1234567890"
  :customer-email="user.email"
  :client-reference-id="user.id"
/>
```

## Show an existing customer's details

For a signed-in customer with a Stripe Customer, create a Customer Session on your server and pass its client secret. Checkout then shows the customer's saved payment methods and details.

```js
// POST /api/customer-session (Node, stripe-node)
const customerSession = await stripe.customerSessions.create({
  customer: 'cus_...',
  components: { pricing_table: { enabled: true } }
})
res.json({ clientSecret: customerSession.client_secret })
```

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripePricingTable } from '@vue-stripe/vue-stripe'

const customerSessionClientSecret = ref('')

onMounted(async () => {
  const response = await fetch('/api/customer-session', { method: 'POST' })
  customerSessionClientSecret.value = (await response.json()).clientSecret
})
</script>

<template>
  <!-- Rendered inside VueStripeProvider -->
  <VueStripePricingTable
    v-if="customerSessionClientSecret"
    pricing-table-id="prctbl_1234567890"
    :customer-session-client-secret="customerSessionClientSecret"
  />
</template>
```

If your site sets a Content Security Policy, allow `https://js.stripe.com` in `script-src` and `frame-src`.

## See also

- [VueStripePricingTable API](/api/components/stripe-pricing-table): props, events, slots and limits
- [Redirect to Stripe Checkout](/guide/checkout): build the Checkout Session yourself
- [Stripe docs: Pricing tables](https://docs.stripe.com/payments/checkout/pricing-table)
