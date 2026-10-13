---
description: "VueStripeTermsElement reference (beta): show the terms a customer agrees to by paying, on a Checkout Session or inside VueStripeElements in Vue."
---

# VueStripeTermsElement

Shows the terms the customer agrees to by paying. Use it inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (created with `checkout.createTermsElement()`), or inside [VueStripeElements](/api/components/stripe-elements) (`elements.create('terms')`).

::: danger Stripe beta
The Terms Element requires beta access: contact [Stripe support](https://support.stripe.com/). Access is granted to the Stripe account, not through a `betas` flag. Without it, the two contexts fail differently (observed in a sandbox account):

- **Inside `VueStripeCheckoutElementsProvider`**, Stripe.js mounts the element and then emits `@loaderror` with the message "You cannot use the Terms Element without being gated into this functionality. Please contact Stripe to request access."; the message is shown through the `#error` slot.
- **Inside `VueStripeElements`** (client secret or deferred), the failure is silent: the element emits `@loaderstart` and `@ready`, renders nothing, and reports no error. Confirm that your account has access before you rely on it there.
:::

::: info No live demo
The docs' live demos run on a Stripe account without this beta, so the Terms Element has no live demo.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
      <!-- ... payment form ... -->
      <VueStripeTermsElement @ready="onReady" @loaderror="onLoadError" />
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeCheckoutElementsProvider,
  VueStripeTermsElement
} from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = '<checkout-session-client-secret>'

const onReady = (element) => console.log('Terms ready', element)
const onLoadError = (event) => console.error('Terms failed to load', event.error.message)
</script>
```

Inside [VueStripeElements](/api/components/stripe-elements) the same component calls `elements.create('terms', options)` instead.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeTermsElementOptions` | No | Element options. Empty in Stripe.js 10 (`StripeTermsElementOptions` has no keys); `checkout.createTermsElement()` takes none either |


## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeTermsElement` | Emitted when the element is fully rendered |
| `@focus` | `{ elementType: 'terms' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'terms' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'terms' }` | Emitted when the user presses the Escape key |
| `@loaderstart` | `{ elementType: 'terms' }` | Emitted when the element begins loading |
| `@loaderror` | `{ elementType: 'terms'; error: StripeError }` | Emitted when the element fails to load (for example without beta access) |

`@loaderror` also fires when creating the element fails (for example when Stripe.js refuses to create it without a beta flag), with the payload `{ elementType: 'terms', error: { message } }`; the message is also shown through the `#error` slot.

::: tip
The Terms Element has **no `@change` event** in Stripe.js 10. Stripe.js may emit `@ready` after `@loaderror`; the error stays visible until the element is recreated.
:::

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading terms...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a load error or a creation error |

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeTermsElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeTermsElement } from '@vue-stripe/vue-stripe'
import type { StripeTermsElement } from '@stripe/stripe-js'

const termsRef = ref<InstanceType<typeof VueStripeTermsElement> | null>(null)
const stripeElement = (): StripeTermsElement | null => termsRef.value?.element ?? null
</script>

<template>
  <VueStripeTermsElement ref="termsRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-terms-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-terms-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-terms-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-terms-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-terms-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles ship in the package stylesheet (`import '@vue-stripe/vue-stripe/style.css'`). Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-terms-element*` for this one.

## TypeScript

```ts
import { VueStripeTermsElement } from '@vue-stripe/vue-stripe'
import type { StripeTermsElement, StripeError } from '@stripe/stripe-js'

const handleReady = (element: StripeTermsElement) => console.log('ready', element)
const handleLoadError = (event: { elementType: 'terms'; error: StripeError }) => {
  console.error(event.error.message)
}
```

## See Also

- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for elements with Checkout Sessions
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive the Checkout Session
- [VueStripeContactDetailsElement](/api/components/stripe-contact-details-element) - Collect the customer's email
