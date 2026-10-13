---
description: "VueStripePricingTable reference: embed a Stripe pricing table configured in the Dashboard in a Vue app. Props, events, slots and Content Security Policy."
---

# VueStripePricingTable

Embeds a Stripe pricing table that you configure in the Stripe Dashboard. The component loads Stripe's pricing-table script (`https://js.stripe.com/v3/pricing-table.js`, once per page) and renders Stripe's `<stripe-pricing-table>` web component. A click on a price takes the customer to Stripe Checkout. Use it inside [VueStripeProvider](/api/components/stripe-provider) or an app that installs [`createVueStripe()`](/api/plugin); it needs only the publishable key, not `VueStripeElements`. To add one to a page, see [Embed a pricing table](/guide/pricing-table).

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripePricingTable
      :pricing-table-id="pricingTableId"
      :customer-email="userEmail"
      @load="onLoad"
      @error="onError"
    />
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { VueStripeProvider, VueStripePricingTable } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const pricingTableId = 'prctbl_1234567890'
const userEmail = 'customer@example.com'

const onLoad = () => console.log('Pricing table loaded')
const onError = (error) => console.error('Pricing table failed to load', error)
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `pricingTableId` | `string` | Yes | Pricing table ID from Stripe Dashboard (starts with `prctbl_`) |
| `customerEmail` | `string` | No | Pre-fill customer email in checkout |
| `customerSessionClientSecret` | `string` | No | Client secret of a Customer Session, for existing customers |
| `clientReferenceId` | `string` | No | Reference ID for reconciling with your internal systems |

The props are passed to the web component as the `pricing-table-id`, `customer-email`, `customer-session-client-secret` and `client-reference-id` attributes; the publishable key comes from the provider or plugin. Outside both, the component throws a `VueStripeProviderError`.

### Props Interface

```ts
interface VueStripePricingTableProps {
  pricingTableId: string
  customerEmail?: string
  customerSessionClientSecret?: string
  clientReferenceId?: string
}
```

### Limitations

Stripe sets these limits on pricing tables; see [Stripe's pricing table docs](https://docs.stripe.com/payments/checkout/pricing-table) for the current list.

| Limitation | Details |
|------------|---------|
| Products | At most 4 products per pricing interval (monthly, yearly) |
| Usage-based pricing | Not supported |
| Rate limit | 50 read operations per second |
| Hosting | Does not render on the `file://` protocol; serve the page from a domain |

### Content Security Policy

With a Content Security Policy, allow Stripe's script and frames:

```
script-src https://js.stripe.com;
frame-src https://js.stripe.com;
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | - | Emitted when the pricing table script loads successfully |
| `@error` | `Error` | Emitted when the script fails to load (network error, CSP blocking). The message is also shown through the `#error` slot |

`@error` reports only script load failures. An invalid or deleted pricing table ID is handled by Stripe's web component, not by `@error`. A failed script tag is removed, and every table waiting on it gets `@error`. To retry after a load error, remount the component by changing its `key`: the remount adds a new script tag and emits `@load` once it loads. [Handle errors and declines](/guide/error-handling#_5-handle-checkout-errors) shows how.

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the pricing table script loads (default: "Loading pricing table...") |
| `#error` | `{ error: string }` | Rendered when the script fails to load |

```vue
<VueStripePricingTable pricing-table-id="prctbl_...">
  <template #loading>
    <div class="loading-spinner">Loading pricing...</div>
  </template>

  <template #error="{ error }">
    <p class="error-message">Failed to load pricing: {{ error }}</p>
  </template>
</VueStripePricingTable>
```

## Exposed Properties

Access these via a template ref:

| Property | Type | Description |
|----------|------|-------------|
| `loading` | `Ref<boolean>` | `true` while script is loading |
| `error` | `Ref<string \| null>` | Error message if script failed to load |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePricingTable } from '@vue-stripe/vue-stripe'

const pricingTableRef = ref<InstanceType<typeof VueStripePricingTable> | null>(null)
const isLoading = () => pricingTableRef.value?.loading ?? true
</script>

<template>
  <VueStripePricingTable ref="pricingTableRef" pricing-table-id="prctbl_..." />
  <p v-if="isLoading()">Loading pricing table...</p>
</template>
```

## The `<stripe-pricing-table>` custom element

The component renders Stripe's `<stripe-pricing-table>` web component from a render function, so Vue never tries to resolve it as a Vue component: **no `isCustomElement` / `compilerOptions` setup is needed** in Vue 3, and there is no "Failed to resolve component" warning.

- **Vue 2.7:** Vue 2 still checks unknown elements at runtime. Add this once in `main.js` (see [Use Vue Stripe on Vue 2.7](/guide/vue-2#_3-import-the-stylesheet)):

  ```js
  Vue.config.ignoredElements = ['stripe-pricing-table']
  ```

- **Nuxt and other SSR apps:** server rendering emits only the loading markup, and the pricing table script loads in the browser on mount, so the component needs no client-only wrapper. `<ClientOnly>` or a `.client.vue` component is optional, for example to skip the loading markup on the server (see [Use Vue Stripe with Nuxt and SSR](/guide/ssr#nuxt)).

## Styling

The component renders this markup:

```html
<div class="vue-stripe-pricing-table">
  <!-- while loading, unless the #loading slot replaces it -->
  <div class="vue-stripe-pricing-table-loading">Loading pricing table...</div>
  <!-- on failure, unless the #error slot replaces it -->
  <div class="vue-stripe-pricing-table-error">...</div>
  <!-- Stripe's web component; hidden while loading or on error -->
  <stripe-pricing-table pricing-table-id="..." publishable-key="..."></stripe-pricing-table>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

The pricing table itself is styled in the Stripe Dashboard.

## TypeScript

The component's props, event payloads and slot props are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events), and a slot prop against [Slots](#slots).

`InstanceType<typeof VueStripePricingTable>` also includes the exposed members. A template ref unwraps their refs, so `pricingTableRef.value?.loading` is a `boolean`.

```vue
<script setup lang="ts">
import { VueStripePricingTable } from '@vue-stripe/vue-stripe'
import type { VueStripePricingTableProps } from '@vue-stripe/vue-stripe'

const config: VueStripePricingTableProps = {
  pricingTableId: 'prctbl_1234567890',
  customerEmail: 'user@example.com',
  clientReferenceId: 'user_123'
}

const handleError = (error: Error): void => {
  console.error(error.message)
}
</script>

<template>
  <VueStripePricingTable v-bind="config" @error="handleError" />
</template>
```

## See Also

- [Embed a pricing table](/guide/pricing-table) - Add a pricing table to a page
- [Start a subscription](/guide/subscriptions) - The other ways to subscribe a customer
- [Keep access in sync with webhooks](/guide/subscriptions#keep-access-in-sync-with-webhooks) - React to subscription events
- [VueStripeProvider](/api/components/stripe-provider) - Provides the publishable key
- [VueStripeCheckout](/api/components/stripe-checkout) - Redirect to Checkout for one-time payments
- [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) - Pricing tables and the other Checkout options compared
- [Stripe pricing tables](https://docs.stripe.com/payments/checkout/pricing-table) - Stripe's documentation
