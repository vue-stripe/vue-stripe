---
description: "VueStripeLinkSignupElement reference (beta): offer customers to save their details with Stripe Link, on a Checkout Session or inside VueStripeElements."
---

# VueStripeLinkSignupElement

Offers customers to save their details with [Link](https://stripe.com/payments/link) for faster checkout next time. Use it inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (created with `checkout.createLinkSignupElement(options)`), or inside [VueStripeElements](/api/components/stripe-elements) (`elements.create('linkSignup', options)`).

::: danger Stripe beta
The Link Signup Element requires beta access: contact [Stripe support](https://support.stripe.com/). Stripe.js also needs the `elements_link_signup_beta_1` flag on the Stripe instance. Without it, creating the element throws, reported through `@loaderror` and the `#error` slot. The error does not name the flag; Stripe.js 10 reports an unknown element type: "A valid Element name must be provided. Valid Elements are: card, cardNumber, ... ; you passed: linkSignup." That message means the flag is missing. Pass it with the [`betas`](/api/components/stripe-provider#props) prop:

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  :betas="['elements_link_signup_beta_1']"
>
  <!-- ... -->
</VueStripeProvider>
```

With the flag set, a sandbox account without Link Signup access gets a mounted element that emits `@ready` and renders no visible content.
:::

::: info No live demo
The docs' live demos run on a Stripe account without this beta, so the Link Signup Element has no live demo.
:::

## Usage

```vue
<template>
  <VueStripeProvider
    :publishable-key="publishableKey"
    :betas="['elements_link_signup_beta_1']"
  >
    <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
      <VueStripeLinkSignupElement :options="linkSignupOptions" @ready="onReady" />
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeCheckoutElementsProvider,
  VueStripeLinkSignupElement
} from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = '<checkout-session-client-secret>'

const linkSignupOptions = {
  defaultValues: { email: 'jenny@example.com', name: 'Jenny Rosen' }
}

const onReady = (element) => console.log('Link signup ready', element)
</script>
```

Inside [VueStripeElements](/api/components/stripe-elements) the same component calls `elements.create('linkSignup', options)` instead.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeLinkSignupElementOptions` | No | Link Signup configuration (same shape for `elements.create()` and the Checkout SDK) |


### Options Object

```ts
interface StripeLinkSignupElementOptions {
  // Pre-fill the signup fields.
  defaultValues?: {
    email?: string
    name?: string
    phone?: string
  }
}
```

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change.
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeLinkSignupElement` | Emitted when the element is fully rendered |
| `@focus` | `{ elementType: 'linkSignup' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'linkSignup' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'linkSignup' }` | Emitted when the user presses the Escape key |
| `@loaderstart` | `{ elementType: 'linkSignup' }` | Emitted when the element begins loading |
| `@loaderror` | `{ elementType: 'linkSignup'; error: StripeError }` | Emitted when the element fails to load |

`@loaderror` also fires when creating the element fails (for example when Stripe.js refuses to create it without a beta flag), with the payload `{ elementType: 'linkSignup', error: { message } }`; the message is also shown through the `#error` slot.

::: tip
The Link Signup Element has **no `@change` event** in Stripe.js 10.
:::

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading Link signup...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a load error or a creation error |

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeLinkSignupElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeLinkSignupElement } from '@vue-stripe/vue-stripe'
import type { StripeLinkSignupElement } from '@stripe/stripe-js'

const linkSignupRef = ref<InstanceType<typeof VueStripeLinkSignupElement> | null>(null)
const stripeElement = (): StripeLinkSignupElement | null => linkSignupRef.value?.element ?? null
</script>

<template>
  <VueStripeLinkSignupElement ref="linkSignupRef" />
  <p v-if="stripeElement()">The Stripe element exists</p>
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-link-signup-element vue-stripe-element">
  <!-- only when there is an error; an #error slot replaces the inner div -->
  <div class="vue-stripe-link-signup-element-error vue-stripe-element-error">
    <div class="vue-stripe-error-message">The error message</div>
  </div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-link-signup-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-link-signup-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading; a #loading slot replaces the inner div -->
  <div class="vue-stripe-link-signup-element-loader vue-stripe-element-loader">
    <div class="vue-stripe-loading-message">Loading Link signup...</div>
  </div>
</div>
```

The default styles ship in the package stylesheet (`import '@vue-stripe/vue-stripe/style.css'`). Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-link-signup-element*` for this one.

## TypeScript

```vue
<script setup lang="ts">
import { VueStripeLinkSignupElement } from '@vue-stripe/vue-stripe'
import type { StripeLinkSignupElement, StripeLinkSignupElementOptions } from '@stripe/stripe-js'

const options: StripeLinkSignupElementOptions = {
  defaultValues: { email: 'jenny@example.com', phone: '+15555550100' }
}

const handleReady = (element: StripeLinkSignupElement) => console.log('ready', element)
</script>

<template>
  <VueStripeLinkSignupElement
    :options="options"
    @ready="handleReady"
  />
</template>
```

## See Also

- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for elements with Checkout Sessions
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive the Checkout Session
- [VueStripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element) - Email input with Link authentication
