# VueStripeCurrencySelectorElement

Lets customers choose the currency they pay in. Use it inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (created with `checkout.createCurrencySelectorElement()`, no beta needed), inside a [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider) (created with the Checkout Form SDK's `createCurrencySelectorElement()`; the form then leaves out its built-in currency picker), or inside [VueStripeElements](/api/components/stripe-elements) with Stripe beta access (`elements.create('currencySelector')`).

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

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `Record<string, never>` | No | Accepted like on every element, but this element has no options |

The Currency Selector element takes no configuration: Stripe's `StripeCurrencySelectorElementOptions` is empty and the Checkout SDK's `createCurrencySelectorElement()` takes no arguments. It derives its choices from the Checkout Session.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCurrencySelectorElement` | Emitted when the element is fully rendered |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the user presses the Escape key |
| `@loaderror` | `{ elementType: 'currencySelector'; error: StripeError }` | Emitted when the element fails to load |

`@loaderror` also fires when creating the element fails (for example when the surrounding provider does not support it), with the payload `{ elementType: 'currencySelector', error: { message } }`; the message is also shown through the `#error` slot.

::: tip
The Currency Selector does **not** emit a `@change` event — the selected currency is reflected on the reactive session exposed by [useCheckoutSession](/api/composables/use-checkout-session).
:::

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading currency selector...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a load error or a creation error |

```vue
<VueStripeCurrencySelectorElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeCurrencySelectorElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeCurrencySelectorElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `currencyRef.value.element` is a `StripeCurrencySelectorElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCurrencySelectorElement } from '@vue-stripe/vue-stripe'
import type { StripeCurrencySelectorElement } from '@stripe/stripe-js'

const currencyRef = ref<InstanceType<typeof VueStripeCurrencySelectorElement> | null>(null)

const focus = () => currencyRef.value?.focus()
const clear = () => currencyRef.value?.clear()
const stripeElement = (): StripeCurrencySelectorElement | null => currencyRef.value?.element ?? null
</script>

<template>
  <VueStripeCurrencySelectorElement ref="currencyRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-currency-selector-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-currency-selector-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-currency-selector-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-currency-selector-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-currency-selector-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-currency-selector-element*` for this one.

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
- [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider) - Parent for the Checkout Form (beta)
- [VueStripeTaxIdElement](/api/components/stripe-tax-id-element) - Collect a tax ID with Checkout Sessions
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive the Checkout Session
