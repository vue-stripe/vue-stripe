---
description: "VueStripeLinkAuthenticationElement reference: collect the customer's email and sign them in to Stripe Link so the Payment Element fills saved details."
---

# VueStripeLinkAuthenticationElement

Collects the customer's email and signs them in to [Stripe Link](https://docs.stripe.com/payments/link) when the email has a Link account, so the Payment Element can fill in their saved details. It collects no payment details itself: pair it with [VueStripePaymentElement](/api/components/stripe-payment-element) inside [VueStripeElements](/api/components/stripe-elements). To add it to a checkout, see [Add Link to checkout](/guide/link-authentication).

::: warning Requires an Intent context
VueStripeLinkAuthenticationElement needs `VueStripeElements` with a `clientSecret` (PaymentIntent or SetupIntent) or a deferred Intent (`mode` / `currency` / `amount`). It is not available inside `VueStripeCheckoutElementsProvider` (Checkout Sessions collect the email themselves). Link must be enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/link).
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripeLinkAuthenticationElement
        :options="{ defaultValues: { email: userEmail } }"
        @change="onEmailChange"
      />
      <VueStripePaymentElement />
      <!-- A child component confirms with usePaymentIntent() -->
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeLinkAuthenticationElement,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // from your server
const userEmail = 'jenny@example.com' // optional pre-fill

const email = ref('')
const onEmailChange = (event) => {
  if (event.complete) email.value = event.value.email
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeLinkAuthenticationElementOptions` | No | Element configuration options |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.
:::

### Options Object

```ts
interface StripeLinkAuthenticationElementOptions {
  defaultValues?: {
    email: string // Pre-fill the email, e.g. for signed-in users
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeLinkAuthenticationElement` | Emitted when the element is mounted and ready |
| `@change` | `StripeLinkAuthenticationElementChangeEvent` | Emitted when the email value changes |
| `@focus` | `void` | Emitted when the element gains focus |
| `@blur` | `void` | Emitted when the element loses focus |
| `@escape` | `void` | Emitted when the user presses the Escape key |
| `@loaderstart` | `{ elementType: 'linkAuthentication' }` | Emitted when the element starts loading |
| `@loaderror` | `{ elementType: 'linkAuthentication'; error: StripeError }` | Emitted when the element fails to load |

`@loaderror` also fires when creating the element fails (for example when the surrounding provider does not support it), with the payload `{ elementType: 'linkAuthentication', error: { message } }`; the message is also shown through the `#error` slot.

### Change Event

```ts
interface StripeLinkAuthenticationElementChangeEvent {
  elementType: 'linkAuthentication'
  empty: boolean // true when the email field is empty
  complete: boolean // true when the email is valid
  value: {
    email: string // the entered email address
  }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change`, a load error or a creation error |

```vue
<VueStripeLinkAuthenticationElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeLinkAuthenticationElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeLinkAuthenticationElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `linkAuthRef.value.element` is a `StripeLinkAuthenticationElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeLinkAuthenticationElement } from '@vue-stripe/vue-stripe'
import type { StripeLinkAuthenticationElement } from '@stripe/stripe-js'

const linkAuthRef = ref<InstanceType<typeof VueStripeLinkAuthenticationElement> | null>(null)

const focus = () => linkAuthRef.value?.focus()
const clear = () => linkAuthRef.value?.clear()
const stripeElement = (): StripeLinkAuthenticationElement | null => linkAuthRef.value?.element ?? null
</script>

<template>
  <VueStripeLinkAuthenticationElement ref="linkAuthRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-link-auth vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-link-auth-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-link-auth-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-link-auth-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-link-auth-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-link-auth*` for this one. [Style elements](/guide/styling#_4-style-the-wrapper-markup) covers the markup and the Appearance API.

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeLinkAuthenticationElement } from '@vue-stripe/vue-stripe'
import type {
  StripeLinkAuthenticationElement,
  StripeLinkAuthenticationElementChangeEvent,
  StripeLinkAuthenticationElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeLinkAuthenticationElementOptions = {
  defaultValues: {
    email: 'user@example.com'
  }
}

// Event handlers
const handleReady = (element: StripeLinkAuthenticationElement) => {
  console.log('Element ready:', element)
}

const handleChange = (event: StripeLinkAuthenticationElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Email:', event.value.email)
}

// Template ref
const linkAuthRef = ref<InstanceType<typeof VueStripeLinkAuthenticationElement> | null>(null)

const focusEmail = () => {
  linkAuthRef.value?.focus()
}
```

## See Also

- [Add Link to checkout](/guide/link-authentication) - Pair the element with the Payment Element and confirm
- [VueStripeElements](/api/components/stripe-elements) - Required parent
- [VueStripePaymentElement](/api/components/stripe-payment-element) - Collects the payment details Link fills in
- [VueStripeAddressElement](/api/components/stripe-address-element) - Optional shipping or billing address
- [Live demo](/live-demo/link-authentication)
- [Stripe Link](https://docs.stripe.com/payments/link) - Stripe's documentation
