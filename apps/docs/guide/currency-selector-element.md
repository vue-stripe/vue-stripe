# Currency Selector Element

The Currency Selector Element lets customers choose the currency they pay in during a Custom Checkout session. Use it when your Checkout Session enables [Adaptive Pricing](https://docs.stripe.com/payments/checkout/adaptive-pricing) and you want to surface a currency picker in your own checkout UI.

::: warning Requires stripe-js 8.x
The Currency Selector Element is created from the Custom Checkout `checkout` instance, which only exists in `@stripe/stripe-js` 8.0.0+. Vue Stripe 6+ requires `@stripe/stripe-js@^8.5.3`.
:::

## Required Components

| Component | Role |
|-----------|------|
| `VueStripeProvider` | Loads Stripe.js and provides the stripe instance |
| `VueStripeCheckoutProvider` | Initializes the Custom Checkout session from a `client_secret` |
| `VueStripeCurrencySelectorElement` | Renders the currency picker |

::: tip Custom Checkout only
This is a Custom Checkout element. It must be rendered inside a [VueStripeCheckoutProvider](/api/components/stripe-checkout-provider), which itself lives inside a `VueStripeProvider`. It does not work inside `VueStripeElements`.
:::

## Basic Implementation

### Step 1: Set Up the Provider Hierarchy

Create a Checkout Session on your server with `ui_mode: 'custom'` and pass its `client_secret` to `VueStripeCheckoutProvider`.

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeCheckoutProvider,
  VueStripeCurrencySelectorElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// A Custom Checkout session client secret (cs_..._secret_...) created on
// your server with `ui_mode: 'custom'`.
const clientSecret = '<checkout-session-client-secret>'
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutProvider :client-secret="clientSecret">
      <VueStripeCurrencySelectorElement
        @ready="onReady"
        @focus="onFocus"
        @blur="onBlur"
        @escape="onEscape"
        @loaderror="onLoadError"
      />
    </VueStripeCheckoutProvider>
  </VueStripeProvider>
</template>
```

**What's happening:**
- `VueStripeProvider` loads Stripe.js with your publishable key
- `VueStripeCheckoutProvider` initializes the Custom Checkout session
- `VueStripeCurrencySelectorElement` renders the currency picker, deriving its choices from the session

### Step 2: Handle Events

The Currency Selector takes **no options** and does **not** emit a `@change` event. The selected currency is reflected on the reactive session exposed by [useCheckoutSession](/api/composables/use-checkout-session).

```vue
<script setup>
const onReady = (element) => {
  console.log('Currency selector ready', element)
}

const onFocus = () => console.log('Currency selector focused')
const onBlur = () => console.log('Currency selector blurred')
const onEscape = () => console.log('Escape pressed in currency selector')

const onLoadError = (event) => {
  console.error('Failed to load currency selector:', event.error)
}
</script>
```

## Events

`VueStripeCurrencySelectorElement` emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCurrencySelectorElement` | Fired when the element finishes mounting |
| `@focus` | — | Fired when the element gains focus |
| `@blur` | — | Fired when the element loses focus |
| `@escape` | — | Fired when the user presses the Escape key |
| `@loaderror` | `{ elementType: 'currencySelector'; error: StripeError }` | Fired when the element fails to load |

::: tip No change event
To react to currency changes, read the reactive `session` from [useCheckoutSession](/api/composables/use-checkout-session) rather than listening for `@change`.
:::

## Next Steps

- [Tax ID Element](/guide/tax-id-element) — Collect a business tax ID in Custom Checkout
- [API Reference](/api/components/stripe-currency-selector-element) — Full props, events, and exposed members
- [useCheckoutSession](/api/composables/use-checkout-session) — Drive the Checkout Session
