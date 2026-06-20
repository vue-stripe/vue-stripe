# VueStripeCheckoutProvider

Initializes a **Custom Checkout** session (`ui_mode: 'custom'`) via `stripe.initCheckout()` and provides it to descendants. Pair it with the [`useCheckoutSession`](/api/composables/use-checkout-session) composable to drive a fully custom checkout UI built from Stripe Elements.

::: tip Custom Checkout vs. the other checkout options
- **`VueStripeCheckoutProvider`** (this) — full UI control with your own Elements, backed by a Checkout Session (`ui_mode: 'custom'`).
- **`VueStripeCheckout`** — redirect / hosted Checkout.
- **`VueStripePricingTable`** — embed a Dashboard-configured pricing table.
:::

## Requirements

- Must be used **inside** [`VueStripeProvider`](/api/components/stripe-provider).
- Needs a Checkout Session created on your server with `ui_mode: 'custom'`; pass its `client_secret` to the provider.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutProvider :client-secret="clientSecret">
      <CheckoutForm />
    </VueStripeCheckoutProvider>
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeCheckoutProvider } from '@vue-stripe/vue-stripe'
import CheckoutForm from './CheckoutForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
// From your backend: stripe.checkout.sessions.create({ ui_mode: 'custom', ... })
const clientSecret = 'cs_test_xxx_secret_xxx'
</script>
```

`CheckoutForm` (a descendant) then calls [`useCheckoutSession()`](/api/composables/use-checkout-session) to read the reactive session and mutate/confirm it.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientSecret` | `string` | No\* | Client secret of a `ui_mode: 'custom'` Checkout Session. Wrapped automatically into a `fetchClientSecret` for Stripe |
| `fetchClientSecret` | `() => Promise<string>` | No\* | Async function returning the client secret. Use for refreshable sessions; **takes precedence** over `clientSecret` |
| `elementsOptions` | `object` | No | Appearance / fonts options forwarded to the Checkout Elements (`initCheckout({ elementsOptions })`) |

\* Provide **either** `clientSecret` **or** `fetchClientSecret`. If neither is set, the error slot renders.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCheckout` | Emitted once the Checkout session is initialized. Payload is the `StripeCheckout` instance |
| `@error` | `string` | Emitted if `initCheckout()` fails. Payload is the error message |

## Slots

| Slot | Props | Rendered when |
|------|-------|---------------|
| `default` | `{ checkout, session }` | Session is ready |
| `loading` | — | While `initCheckout()` is in flight |
| `error` | `{ error }` | Initialization failed |

```vue
<VueStripeCheckoutProvider :client-secret="clientSecret">
  <template #loading><div>Preparing checkout…</div></template>
  <template #error="{ error }"><div class="error">{{ error }}</div></template>

  <CheckoutForm />
</VueStripeCheckoutProvider>
```

## Provides

| Key | Type | Description |
|-----|------|-------------|
| `checkout` | `Ref<StripeCheckout \| null>` | The Checkout instance |
| `session` | `Ref<StripeCheckoutSession \| null>` | Reactive session snapshot (updates on every Stripe `change`) |
| `loading` | `Ref<boolean>` | Whether the session is initializing |
| `error` | `Ref<string \| null>` | Initialization error, if any |

Access these via [`useCheckoutSession()`](/api/composables/use-checkout-session).

## See Also

- [useCheckoutSession](/api/composables/use-checkout-session) — drive the session from descendants
- [VueStripeProvider](/api/components/stripe-provider) — required parent
