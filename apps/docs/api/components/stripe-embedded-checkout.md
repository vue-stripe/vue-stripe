---
description: "VueStripeEmbeddedCheckout reference: embed Stripe's prebuilt Checkout page in a Vue app with createEmbeddedCheckoutPage. Props, events and slots."
---

# VueStripeEmbeddedCheckout

Embeds Stripe's prebuilt Checkout page in your site with `stripe.createEmbeddedCheckoutPage()`. Stripe renders the whole payment form (line items, totals, payment methods, address and tax fields) in an iframe on your page, driven by a Checkout Session. [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) compares it with the other Checkout options, and [Embed Stripe Checkout](/guide/embedded-checkout) shows the server and client code.

- Use it inside [`VueStripeProvider`](/api/components/stripe-provider). It does not need `VueStripeElements`.
- Pass the `client_secret` of a Checkout Session created on your server with `ui_mode: 'embedded_page'` and a `return_url`.
- Stripe allows one Embedded Checkout per page. A second `VueStripeEmbeddedCheckout` mounted at the same time reports an error instead of loading.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeEmbeddedCheckout
      :fetch-client-secret="fetchClientSecret"
      @ready="onReady"
      @complete="onComplete"
      @error="onError"
    />
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeEmbeddedCheckout } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const fetchClientSecret = () =>
  fetch('/api/checkout-session', { method: 'POST' })
    .then((response) => response.json())
    .then((data) => data.clientSecret)

const onReady = () => console.log('Embedded Checkout is on the page')
const onComplete = () => console.log('Checkout Session completed')
const onError = (message) => console.error(message)
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientSecret` | `string` | One of the two | Client secret of a Checkout Session created with `ui_mode: 'embedded_page'` |
| `fetchClientSecret` | `() => Promise<string>` | One of the two | Function resolving to the client secret. The component calls it once on mount and passes the secret to Stripe |
| `onLineItemsChange` | `(event: StripeEmbeddedCheckoutLineItemsChangeEvent) => Promise<ResultAction>` | No | Called when the customer adds, removes or changes a line item. Resolve `{ type: 'accept' }` or `{ type: 'reject', errorMessage }`. Passed to Stripe.js as is; Stripe does not call it on sessions the API creates today (see below) |

The options are read once, when the page is created. To show another Checkout Session, re-mount the component, for example by changing its `key`:

```vue
<VueStripeEmbeddedCheckout :key="clientSecret" :client-secret="clientSecret" />
```

### onLineItemsChange

`onLineItemsChange` is a function prop, not an event, because Stripe waits for its result before it applies the change. The component passes it to `stripe.createEmbeddedCheckoutPage()` unchanged.

::: warning No session can enable it
Stripe.js 10.0.0 declares `onLineItemsChange` and says it is required when the session sets `permissions.update.line_items: 'server_only'`. The Checkout Sessions API has no such parameter: `permissions[update][line_items]` and `permissions[update_line_items]` are rejected with "Received unknown parameter" on every API version from `2025-03-31.basil` to `2026-09-30.endive`, and stripe-node 23 types `permissions` with `update_shipping_details` only. Stripe's [Dynamically update line items](https://docs.stripe.com/payments/checkout/dynamically-update-line-items?payment-ui=embedded-page) guide says the full embedded page doesn't support dynamically updating line items.

To let customers change quantities on the embedded page, set `adjustable_quantity` on the session's line items; Stripe applies the change itself. To approve or change line items from your server, use the [Checkout Form](/guide/checkout-form) or [your own checkout page](/guide/custom-checkout), and call `runServerUpdate()` from [`useCheckoutForm`](/api/composables/use-checkout-form) or [`useCheckoutSession`](/api/composables/use-checkout-session).
:::

::: info `onShippingDetailsChange` is not supported
Stripe deprecated dynamic shipping updates in Embedded Checkout (`onShippingDetailsChange`, deprecated since Stripe.js 9.14), so the component does not expose it.
:::

### Props Interface

```ts
interface VueStripeEmbeddedCheckoutProps {
  clientSecret?: string
  fetchClientSecret?: () => Promise<string>
  onLineItemsChange?: (
    event: StripeEmbeddedCheckoutLineItemsChangeEvent
  ) => Promise<{ type: 'accept' } | { type: 'reject'; errorMessage?: string }>
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeEmbeddedCheckout` | Emitted after the page is created and mounted |
| `@complete` | none | Stripe's `onComplete`: the Checkout Session completed. Fires when Stripe does not redirect, see below |
| `@analytics` | `StripeEmbeddedCheckoutAnalyticsEventUnion` | Stripe's `onAnalyticsEvent`: `checkoutRendered`, `deviceData`, `promotionCodeApplied`, `lineItemChange`, `checkoutSubmitted`, `checkoutSubmitFailed` |
| `@error` | `string` | No client secret was given, `fetchClientSecret` rejected or resolved no client secret, another Embedded Checkout is already mounted, or `createEmbeddedCheckoutPage` failed (for example a session that is not `ui_mode: 'embedded_page'`). `@ready` is not emitted then |

::: tip Redirect or `@complete`
By default (`redirect_on_completion: 'always'`) Stripe sends the customer to your `return_url` after payment. To stay on the page and react to `@complete`, create the session with `redirect_on_completion: 'if_required'` (redirect-based payment methods still use `return_url`) or `'never'` (omit `return_url`).
:::

### Tracking analytics events

```vue
<script setup>
const onAnalytics = (event) => {
  if (event.eventType === 'checkoutSubmitted') {
    analytics.track('checkout_submitted', { amount: event.details.amount })
  }
}
</script>

<template>
  <VueStripeEmbeddedCheckout :client-secret="clientSecret" @analytics="onAnalytics" />
</template>
```

### Errors

| Error | Cause | Fix |
|-------|-------|----------|
| `VueStripeProviderError` (thrown) | Not inside `VueStripeProvider` | Wrap the component in `VueStripeProvider` |
| `requires a clientSecret or fetchClientSecret prop` | Neither prop given | Pass one of them |
| The rejection's message | `fetchClientSecret` rejected (for example the server route failed) | Fix the route, then re-mount the component |
| `fetchClientSecret did not resolve to a client secret` | `fetchClientSecret` resolved an empty or non-string value | Resolve the session's `client_secret` |
| `Only one VueStripeEmbeddedCheckout can be mounted at a time` | A second instance mounted while the first is on the page | Unmount the first one (`v-if`) before mounting another |
| Stripe error message | Invalid or expired client secret, session not `ui_mode: 'embedded_page'` | Create a new session on your server |

## Slots

### Loading Slot

Rendered while `stripe.createEmbeddedCheckoutPage()` is pending. Stripe then shows its own loader inside the iframe.

```vue
<VueStripeEmbeddedCheckout :client-secret="clientSecret">
  <template #loading>
    <p>Preparing checkout...</p>
  </template>
</VueStripeEmbeddedCheckout>
```

### Error Slot

Rendered when the page could not be created, including when `fetchClientSecret` rejects or resolves a session Stripe refuses:

```vue
<VueStripeEmbeddedCheckout :client-secret="clientSecret">
  <template #error="{ error }">
    <p class="error">Checkout could not load: {{ error }}</p>
  </template>
</VueStripeEmbeddedCheckout>
```

## Exposed Properties

| Property | Type | Description |
|----------|------|-------------|
| `checkout` | `Ref<StripeEmbeddedCheckout \| null>` | The Embedded Checkout instance once created |
| `loading` | `Ref<boolean>` | `true` until the page is mounted |
| `error` | `Ref<string \| null>` | Error message, if creating the page failed |

The component calls `checkout.destroy()` when it unmounts, so you rarely need the instance yourself. Removing the component (for example with `v-if`) destroys the page, which takes the place of Stripe's `checkout.unmount()`; mount a new component to show Checkout again.

## Styling

The component renders the same parts as the element components, so the shared `vue-stripe-element-*` styles apply:

```html
<div class="vue-stripe-embedded-checkout vue-stripe-element">
  <div class="vue-stripe-embedded-checkout-error vue-stripe-element-error">...</div>
  <div class="vue-stripe-embedded-checkout-mount vue-stripe-element-mount"><!-- Stripe iframe --></div>
  <div class="vue-stripe-embedded-checkout-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Style the Checkout page itself in the [Stripe Dashboard branding settings](https://dashboard.stripe.com/settings/branding) or with the session's `branding_settings`.

## TypeScript

The component's props and event payloads are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events).

`InstanceType<typeof VueStripeEmbeddedCheckout>` also includes the exposed members. A template ref unwraps their refs, so `checkoutRef.value?.checkout` is a `StripeEmbeddedCheckout | null`.

```ts
import { VueStripeEmbeddedCheckout } from '@vue-stripe/vue-stripe'
import type {
  VueStripeEmbeddedCheckoutProps,
  StripeEmbeddedCheckout,
  StripeEmbeddedCheckoutOptions,
  StripeEmbeddedCheckoutAnalyticsEventUnion,
  StripeEmbeddedCheckoutLineItemsChangeEvent
} from '@vue-stripe/vue-stripe'

const onReady = (checkout: StripeEmbeddedCheckout): void => {
  console.log('mounted', checkout)
}
const onAnalytics = (event: StripeEmbeddedCheckoutAnalyticsEventUnion): void => {
  console.log(event.eventType)
}
```

## See Also

- [Embed Stripe Checkout](/guide/embedded-checkout) - How-to guide with the server code
- [Embedded Checkout Live Demo](/live-demo/embedded-checkout) - Pay with a [test card](/guide/testing#cards)
- [Fulfil orders with webhooks](/guide/webhooks) - Fulfil when the session completes
- [VueStripeCheckout](/api/components/stripe-checkout) - Redirect to hosted Checkout instead
- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Your own layout on a Checkout Session
- [Stripe Embedded Checkout docs](https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=embedded-form)
