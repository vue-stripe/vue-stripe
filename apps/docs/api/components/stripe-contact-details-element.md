---
description: "VueStripeContactDetailsElement reference: collect and validate the customer's email in Vue, on a Checkout Session or inside VueStripeElements."
---

# VueStripeContactDetailsElement

Collects the customer's email address. Use it inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (created with `checkout.createContactDetailsElement()`), where the email lands on the Checkout Session, or inside [VueStripeElements](/api/components/stripe-elements) (`elements.create('contactDetails')`). No beta flag is needed. Stripe validates the address and, inside the Checkout provider, keeps `session.email` up to date, so you don't need your own input plus `updateEmail()`.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
      <VueStripeContactDetailsElement @ready="onReady" @change="onChange" />
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>

<script setup lang="ts">
import {
  VueStripeProvider,
  VueStripeCheckoutElementsProvider,
  VueStripeContactDetailsElement
} from '@vue-stripe/vue-stripe'
import type {
  StripeContactDetailsElement,
  StripeContactDetailsElementChangeEvent
} from '@stripe/stripe-js'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = '<checkout-session-client-secret>'

const onReady = (element: StripeContactDetailsElement) =>
  console.log('Contact details ready', element)
const onChange = (event: StripeContactDetailsElementChangeEvent) =>
  console.log(event.value.email, 'complete:', event.complete)
</script>
```

Inside [VueStripeElements](/api/components/stripe-elements) the same component calls `elements.create('contactDetails', options)` instead.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeContactDetailsElementOptions` | No | Element options; used with `elements.create()` only |


### Options Object

```ts
interface StripeContactDetailsElementOptions {
  // Pre-fill the email field.
  defaultValues?: { email: string }
}
```

::: info Inside the Checkout provider
`checkout.createContactDetailsElement()` takes no options in Stripe.js 10 (`StripeCheckoutContactDetailsElementOptions` is an empty object), so `options` is not passed there. Pre-fill the email on the Checkout Session instead (`customer_email` on your server).
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeContactDetailsElement` | Emitted when the element is fully rendered |
| `@change` | `StripeContactDetailsElementChangeEvent` | Emitted when the email changes |
| `@focus` | `{ elementType: 'contactDetails' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'contactDetails' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'contactDetails' }` | Emitted when the user presses the Escape key |
| `@loaderstart` | `{ elementType: 'contactDetails' }` | Emitted when the element begins loading |
| `@loaderror` | `{ elementType: 'contactDetails'; error: StripeError }` | Emitted when the element fails to load |

`@loaderror` also fires when creating the element fails (for example when Stripe.js refuses to create it without a beta flag), with the payload `{ elementType: 'contactDetails', error: { message } }`; the message is also shown through the `#error` slot.

### Change Event

```ts
interface StripeContactDetailsElementChangeEvent {
  elementType: 'contactDetails'
  empty: boolean
  complete: boolean
  value: { email: string }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading contact details...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a load error or a creation error |

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeContactDetailsElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeContactDetailsElement } from '@vue-stripe/vue-stripe'
import type { StripeContactDetailsElement } from '@stripe/stripe-js'

const contactRef = ref<InstanceType<typeof VueStripeContactDetailsElement> | null>(null)
const stripeElement = (): StripeContactDetailsElement | null => contactRef.value?.element ?? null
</script>

<template>
  <VueStripeContactDetailsElement ref="contactRef" />
  <p v-if="stripeElement()">The Stripe element exists</p>
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-contact-details-element vue-stripe-element">
  <!-- only when there is an error; an #error slot replaces the inner div -->
  <div class="vue-stripe-contact-details-element-error vue-stripe-element-error">
    <div class="vue-stripe-error-message">The error message</div>
  </div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-contact-details-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-contact-details-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading; a #loading slot replaces the inner div -->
  <div class="vue-stripe-contact-details-element-loader vue-stripe-element-loader">
    <div class="vue-stripe-loading-message">Loading contact details...</div>
  </div>
</div>
```

The default styles ship in the package stylesheet (`import '@vue-stripe/vue-stripe/style.css'`). Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-contact-details-element*` for this one.

## TypeScript

```vue
<script setup lang="ts">
import { VueStripeContactDetailsElement } from '@vue-stripe/vue-stripe'
import type {
  StripeContactDetailsElementOptions,
  StripeContactDetailsElementChangeEvent
} from '@stripe/stripe-js'

const options: StripeContactDetailsElementOptions = {
  defaultValues: { email: 'jenny@example.com' }
}

const handleChange = (event: StripeContactDetailsElementChangeEvent) => {
  if (event.complete) console.log('Email:', event.value.email)
}
</script>

<template>
  <VueStripeContactDetailsElement
    :options="options"
    @change="handleChange"
  />
</template>
```

## See Also

- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for elements with Checkout Sessions
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive the Checkout Session
- [VueStripeLinkSignupElement](/api/components/stripe-link-signup-element) - Offer Link signup (beta)
- [VueStripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element) - Email input with Link authentication
