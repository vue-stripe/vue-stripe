---
description: "VueStripeAddressElement reference: collect a shipping or billing address with autocomplete in Vue, inside VueStripeElements or a Checkout Session."
---

# VueStripeAddressElement

Collects a shipping or billing address, with optional name, phone and address autocomplete. It needs no Intent: use it inside [VueStripeElements](/api/components/stripe-elements) with a `clientSecret` or a deferred Intent (`mode` / `currency` / `amount`), or inside [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (see [With Checkout Sessions](#with-checkout-sessions)). Read the address from `@change` or the exposed `getValue()`. For recipes (pre-fill, phone, allowed countries, P.O. boxes, address before payment), see [Collect a shipping or billing address](/guide/address-element).

::: warning Pass `mode` when there is no `clientSecret`
With neither `clientSecret` nor `mode` on `VueStripeElements`, Stripe.js Endive throws "Unable to select session" from the Address Element's iframe on every load. Use `<VueStripeElements mode="payment" currency="usd" :amount="1099">` (or `mode="setup"`) until you have an Intent.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements mode="payment" currency="usd" :amount="1099">
      <VueStripeAddressElement
        ref="addressRef"
        :options="{ mode: 'shipping', autocomplete: { mode: 'automatic' } }"
        @change="onChange"
      />
      <button @click="next">Continue</button>
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeAddressElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const addressRef = ref(null)

const onChange = (event) => {
  if (event.complete) console.log('Address:', event.value.address)
}

const next = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) console.log('Ship to:', result.value)
}
</script>
```

### With Checkout Sessions

Inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider), the component is created with the Checkout SDK: `options.mode` picks `createBillingAddressElement()` (`'billing'`) or `createShippingAddressElement()` (`'shipping'`, the default). The Checkout SDK accepts only `contacts`, `display` and `fields`; other options are dropped. The address flows into the Checkout Session automatically.

```vue
<VueStripeCheckoutElementsProvider :client-secret="clientSecret">
  <VueStripeAddressElement :options="{ mode: 'shipping', display: { name: 'split' } }" />
  <VueStripeAddressElement :options="{ mode: 'billing' }" />
  <VueStripePaymentElement />
</VueStripeCheckoutElementsProvider>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeAddressElementOptions` | No | Address element configuration (defaults to `{ mode: 'shipping' }`) |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.

`mode` is the exception: Stripe cannot change it after creation, so it is never passed to `update()`. To switch between `'shipping'` and `'billing'`, re-mount the component (e.g. `:key="mode"`).
:::

### Options Object

```ts
interface StripeAddressElementOptions {
  mode: 'shipping' | 'billing'
  autocomplete?: {
    mode: 'automatic' | 'disabled'
  }
  allowedCountries?: string[]
  blockPoBox?: boolean
  contacts?: Array<{
    name: string
    address: AddressValue
  }>
  defaultValues?: {
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
  display?: {
    name?: 'full' | 'split' | 'organization'
  }
  fields?: {
    phone?: 'always' | 'never' | 'auto'
  }
  validation?: {
    phone?: {
      required?: 'always' | 'never' | 'auto'
    }
  }
}
```

For example, `allowedCountries: ['US', 'CA']` limits the country list, `blockPoBox: true` rejects P.O. boxes, and `fields: { phone: 'always' }` adds a phone field.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeAddressElement` | Emitted when the element is fully rendered |
| `@change` | `StripeAddressElementChangeEvent` | Emitted when the address value changes |
| `@focus` | `{ elementType: 'address' }` | Emitted when any field gains focus |
| `@blur` | `{ elementType: 'address' }` | Emitted when any field loses focus |
| `@escape` | `{ elementType: 'address' }` | Emitted when the escape key is pressed |
| `@loaderstart` | `{ elementType: 'address' }` | Emitted when the element starts loading (Stripe shows its loader) |
| `@loaderror` | `{ elementType: 'address'; error: StripeError }` | Emitted if the element fails to load. Renamed from `@loadError` in v6: update `@loadError` listeners to `@loaderror` |

`@loaderror` also fires when creating the element fails (for example when the surrounding provider does not support it), with the payload `{ elementType: 'address', error: { message } }`; the message is also shown through the `#error` slot.

### Change Event

```ts
interface StripeAddressElementChangeEvent {
  elementType: 'address'
  complete: boolean
  isNewAddress: boolean
  value: {
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
    address: {
      line1: string
      line2: string | null
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading address form...") |
| `#error` | `{ error: string }` | Rendered when the element fails to load (`@loaderror`) or cannot be created. Not rendered for validation errors: the Address Element shows them inside its iframe, and its `@change` payload has no `error` |

```vue
<VueStripeAddressElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeAddressElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeAddressElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current load or creation error message; validation messages never reach it |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |
| `getValue(options?)` | `(options?: { format?: 'localized' \| 'latin' }) => Promise<...>` | Validate the form and read the address (forwards to Stripe's `getValue()`) |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `addressRef.value.element` is a `StripeAddressElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeAddressElement } from '@vue-stripe/vue-stripe'
import type { StripeAddressElement } from '@stripe/stripe-js'

const addressRef = ref<InstanceType<typeof VueStripeAddressElement> | null>(null)

const focus = () => addressRef.value?.focus()
const clear = () => addressRef.value?.clear()
const stripeElement = (): StripeAddressElement | null => addressRef.value?.element ?? null
const readAddress = () => addressRef.value?.getValue({ format: 'localized' })
</script>

<template>
  <VueStripeAddressElement ref="addressRef" />
</template>
```

### getValue() and the `state` format

`getValue(options?)` forwards its options to Stripe's `addressElement.getValue()`. Since Stripe.js Dahlia, `value.address.state` is returned in **Latin** characters by default (e.g. a Japanese prefecture is romanized). Pass `{ format: 'localized' }` for the previous, localized behaviour:

```ts
const { complete, value } = await addressRef.value!.getValue({ format: 'localized' })
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-address-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-address-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-address-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-address-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-address-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-address-element*` for this one.

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeAddressElement } from '@vue-stripe/vue-stripe'
import type {
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeAddressElementOptions = {
  mode: 'shipping',
  autocomplete: { mode: 'automatic' },
  fields: { phone: 'always' }
}

// Event handlers
const handleReady = (element: StripeAddressElement) => {
  console.log('Address element ready', element)
}

const handleChange = (event: StripeAddressElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Address:', event.value.address)
}

// Template ref with getValue()
const addressRef = ref<InstanceType<typeof VueStripeAddressElement> | null>(null)

const validateAddress = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) {
    // Type-safe address access
    const { line1, city, state, postal_code, country } = result.value.address
    console.log(`${line1}, ${city}, ${state} ${postal_code}, ${country}`)
  }
}
```

## See Also

- [VueStripeElements](/api/components/stripe-elements) - Parent container component
- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for Checkout Sessions
- [VueStripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI
- [Collect a shipping or billing address](/guide/address-element) - Step-by-step guide and recipes
- [Live demo](/live-demo/address-element)
