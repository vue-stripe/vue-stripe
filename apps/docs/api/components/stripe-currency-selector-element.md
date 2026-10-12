# VueStripeCurrencySelectorElement

Lets customers choose the currency they pay in. Use it inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (created with `checkout.createCurrencySelectorElement()`, no beta needed), or inside [VueStripeElements](/api/components/stripe-elements) with Stripe beta access (`elements.create('currencySelector')`).

::: tip When to Use
Use VueStripeCurrencySelectorElement when your Checkout Session enables [Adaptive Pricing](https://docs.stripe.com/payments/checkout/adaptive-pricing) and you want to surface a currency picker in your checkout UI.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
      <VueStripeCurrencySelectorElement
        @ready="onReady"
        @loaderror="onLoadError"
      />
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeCheckoutElementsProvider,
  VueStripeCurrencySelectorElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = '<checkout-session-client-secret>'

const onReady = (element) => console.log('Currency selector ready', element)
const onLoadError = (event) => console.error('Failed to load', event.error)
</script>
```

## Props

The Currency Selector element takes no configuration options — it derives its choices from the Checkout Session.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCurrencySelectorElement` | Emitted when the element is fully rendered |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the user presses the Escape key |
| `@loaderror` | `{ elementType: 'currencySelector'; error: StripeError }` | Emitted when the element fails to load |

::: tip
The Currency Selector does **not** emit a `@change` event — the selected currency is reflected on the reactive session exposed by [useCheckoutSession](/api/composables/use-checkout-session).
:::

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is initializing |
| `#error` | `{ error: string }` | Rendered when an error occurs; receives the error message string |

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `Ref<StripeCurrencySelectorElement \| null>` | The underlying Stripe element instance |
| `loading` | `Ref<boolean>` | Whether the element is loading |
| `error` | `Ref<string \| null>` | Current error message |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element |

## TypeScript

```ts
import { VueStripeCurrencySelectorElement } from '@vue-stripe/vue-stripe'
import type { StripeCurrencySelectorElement, StripeError } from '@stripe/stripe-js'

const handleReady = (element: StripeCurrencySelectorElement) => {
  console.log('ready', element)
}

const handleLoadError = (event: { elementType: 'currencySelector'; error: StripeError }) => {
  console.error(event.error.message)
}
```

## See Also

- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for elements with Checkout Sessions
- [VueStripeTaxIdElement](/api/components/stripe-tax-id-element) - Collect a tax ID with Checkout Sessions
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive the Checkout Session
