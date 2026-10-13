---
description: "VueStripeCheckout reference: a Vue button that redirects to a hosted Stripe Checkout page from the session URL your server returns. Props, events, v5 changes."
---

# VueStripeCheckout

A button that sends the customer to a hosted Stripe Checkout page. Your server creates the Checkout Session and returns `session.url`; the component redirects to that URL with `window.location.replace()`. It needs no `VueStripeProvider`, `VueStripeElements` or client secret. For the server code and the full flow, see [Redirect to Stripe Checkout](/guide/checkout). [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) compares hosted Checkout with the other options.

::: warning URL-only since v6
Stripe.js removed `stripe.redirectToCheckout()` in Stripe.js Clover, so the client can no longer start Checkout from a session ID or a price ID. The v5 `sessionId`, `priceId`, `mode`, `successUrl`, `cancelUrl`, `customerEmail`, `clientReferenceId` and `submitType` props are gone: set those parameters when you create the session on your server. See [Migrating from v5](#migrating-from-v5).
:::

## Usage

```vue
<template>
  <VueStripeCheckout
    :session-url="sessionUrl"
    :disabled="!sessionUrl"
    button-text="Pay $49.99"
    @error="onCheckoutError"
  />
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { ref, onMounted } from 'vue'
import { VueStripeCheckout } from '@vue-stripe/vue-stripe'

const sessionUrl = ref('')

onMounted(async () => {
  // Your server creates the Checkout Session and returns session.url
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  sessionUrl.value = (await response.json()).url
})

const onCheckoutError = (error) => console.error(error.message)
</script>
```

To create the session only when the customer clicks, use [useStripeCheckout](/api/composables/use-stripe-checkout) instead.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sessionUrl` | `string` | Yes* | - | Hosted Checkout Session URL (`session.url`) created on your server |
| `buttonText` | `string` | No | `'Checkout'` | Text displayed on the button |
| `loadingText` | `string` | No | `'Redirecting...'` | Text shown during the redirect |
| `disabled` | `boolean` | No | `false` | Disable the checkout button |
| `buttonClass` | `string` | No | `'vue-stripe-checkout-button'` | CSS class of the default button |

\* The prop is optional so the component can render before the URL arrives, but clicking without it emits `@error` with a `VueStripeCheckoutError`.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@checkout` | - | Emitted when checkout is initiated (button clicked or `checkout()` called) |
| `@before-redirect` | `{ url: string }` | Emitted right before the browser navigates to `sessionUrl` |
| `@success` | - | Emitted once the redirect has been started |
| `@error` | `VueStripeCheckoutError` | Emitted when `sessionUrl` is missing |

```ts
import { VueStripeCheckoutError } from '@vue-stripe/vue-stripe'

const onError = (error: VueStripeCheckoutError) => {
  // "VueStripeCheckout: `sessionUrl` is required (create the Checkout Session on your server)"
  console.error(error.message)
}
```

Errors from Stripe itself (an expired or invalid session) are shown on Stripe's hosted page, not emitted by the component.

## Slots

### Default Slot

Replace the button with your own markup. The component wraps the slot in a `<span class="vue-stripe-checkout-wrapper">` that triggers checkout on click, so a plain slot works without any wiring:

```vue
<VueStripeCheckout :session-url="sessionUrl">
  <button class="my-custom-button">Pay Now</button>
</VueStripeCheckout>
```

Use the scoped slot props to reflect the state:

```vue
<VueStripeCheckout :session-url="sessionUrl">
  <template #default="{ loading, disabled }">
    <MyCustomButton :loading="loading" :disabled="disabled">
      {{ loading ? 'Redirecting...' : 'Pay Now' }}
    </MyCustomButton>
  </template>
</VueStripeCheckout>
```

| Slot Prop | Type | Description |
|-----------|------|-------------|
| `checkout` | `() => void` | Function to trigger checkout (useful for non-click triggers) |
| `loading` | `boolean` | Whether the redirect has started |
| `disabled` | `boolean` | Value of the `disabled` prop |

Clicking anywhere inside the slot content triggers checkout, because the wrapper handles the click. The wrapper uses `display: contents` (from the package stylesheet), so it does not affect your layout.

## Exposed Methods

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `checkout()` | `() => void` | Trigger the checkout redirect (ignored while `loading` or `disabled`) |
| `loading` | `Ref<boolean>` | `true` once the redirect has started |

```vue
<template>
  <VueStripeCheckout ref="checkoutRef" :session-url="sessionUrl" />
  <button @click="triggerCheckout">Custom Trigger</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCheckout } from '@vue-stripe/vue-stripe'

const sessionUrl = ref('https://checkout.stripe.com/c/pay/cs_test_...')
const checkoutRef = ref<InstanceType<typeof VueStripeCheckout> | null>(null)

const triggerCheckout = () => {
  checkoutRef.value?.checkout()
}
</script>
```

## Styling

The default button uses the `vue-stripe-checkout-button` class and shows a `vue-stripe-loading-spinner` while redirecting; slot content is wrapped in `vue-stripe-checkout-wrapper` (`display: contents`). These styles ship in the package stylesheet:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Pass `button-class` to use your own class instead:

```vue
<VueStripeCheckout :session-url="sessionUrl" button-class="my-checkout-button" />
```

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeCheckout, VueStripeCheckoutError } from '@vue-stripe/vue-stripe'

const sessionUrl = ref<string>('')
const checkoutRef = ref<InstanceType<typeof VueStripeCheckout> | null>(null)

const handleBeforeRedirect = ({ url }: { url: string }) => {
  console.log('Navigating to', url)
}

const handleError = (error: VueStripeCheckoutError) => {
  console.error('Checkout failed:', error.message)
}
```

## Migrating from v5

The v5 session-ID and price-ID props are gone; the server creates the session and the component takes its URL. [Upgrade from v5 to v6](/guide/migration-v6#hosted-checkout) lists every change, with before and after code.

## See Also

- [Redirect to Stripe Checkout](/guide/checkout) - Server code and the full redirect flow
- [useStripeCheckout](/api/composables/use-stripe-checkout) - Redirect from your own code, e.g. after creating the session on click
- [VueStripeEmbeddedCheckout](/api/components/stripe-embedded-checkout) - Checkout inside your page
- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Checkout Sessions with your own Elements UI
- [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) - The Checkout options compared
- [Fulfil orders with webhooks](/guide/webhooks) - Fulfil on `checkout.session.completed`, not on the redirect
- [Handle errors and declines](/guide/error-handling#_5-handle-checkout-errors) - Checkout errors
- [Test your integration](/guide/testing#cards) - Test cards
- [Stripe Checkout](https://docs.stripe.com/payments/checkout) - Stripe's documentation
