---
description: "VueStripeCardElement reference: a single Stripe card field (number, expiry, CVC, postal code) for Vue. Props, events, slots and exposed methods."
---

# VueStripeCardElement

A single card field that collects the card number, expiry date, CVC and (optionally) postal code. It needs no Intent on its parent: use it inside [VueStripeElements](/api/components/stripe-elements) without a `clientSecret`, and confirm with [`useConfirmCardPayment()`](/api/composables/confirm/cards) or create a PaymentMethod with [`useCreatePaymentMethod()`](/api/composables/use-create-payment-method). For the steps, see [Accept card payments with the Card Element](/guide/card-element); [Choosing an integration](/guide/approaches#payment-element-or-card-element) compares it with the Payment Element.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <CardForm :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import CardForm from './CardForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
</script>
```

```vue
<!-- CardForm.vue -->
<script setup>
import { ref } from 'vue'
import { VueStripeCardElement, useConfirmCardPayment } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: String })
const cardRef = ref(null)
const complete = ref(false)
const { confirmCardPayment, loading, error } = useConfirmCardPayment()

const pay = async () => {
  const card = cardRef.value?.element
  if (!card) return
  await confirmCardPayment(props.clientSecret, { payment_method: { card } })
}
</script>

<template>
  <form @submit.prevent="pay">
    <VueStripeCardElement
      ref="cardRef"
      :options="{ hidePostalCode: true }"
      @change="(event) => (complete = event.complete)"
    />
    <button :disabled="!complete || loading">Pay</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeCardElementOptions` | No | Card element configuration |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.

`disableLink` and `preferredNetwork` are read when the element is created and never passed to `update()`, because Stripe.js doesn't accept them there. To change one, re-mount the component (e.g. with a `:key`).
:::

### Options Object

```ts
interface StripeCardElementOptions {
  style?: {
    base?: StripeElementStyle
    complete?: StripeElementStyle
    empty?: StripeElementStyle
    invalid?: StripeElementStyle
  }
  hidePostalCode?: boolean
  iconStyle?: 'default' | 'solid'
  disabled?: boolean
}
```

#### Style Properties

```ts
interface StripeElementStyle {
  color?: string
  fontFamily?: string
  fontSize?: string
  fontSmoothing?: string
  fontStyle?: string
  fontVariant?: string
  fontWeight?: string
  iconColor?: string
  lineHeight?: string
  letterSpacing?: string
  textAlign?: string
  textDecoration?: string
  textShadow?: string
  textTransform?: string
  '::placeholder'?: { color?: string }
  ':-webkit-autofill'?: { color?: string }
  ':focus'?: StripeElementStyle
  ':hover'?: StripeElementStyle
  '::selection'?: { color?: string; backgroundColor?: string }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCardElement` | Emitted when the element is fully rendered |
| `@change` | `StripeCardElementChangeEvent` | Emitted when the element value changes |
| `@focus` | `{ elementType: 'card' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'card' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'card' }` | Emitted when the escape key is pressed |
| `@networkschange` | `{ elementType: 'card'; networks: string[] \| null; loading: boolean }` | Emitted when the card networks available for the entered number change (co-badged cards). `networks` lists them, for example `['cartes_bancaires', 'visa']`; it is `null` while `loading` is `true` |
| `@loaderror` | `{ elementType: 'card'; error: StripeError }` | Emitted when the element fails to load |

`@loaderror` also fires when creating the element fails (for example when the surrounding provider does not support it), with the payload `{ elementType: 'card', error: { message } }`; the message is also shown through the `#error` slot.

### Change Event

```ts
interface StripeCardElementChangeEvent {
  elementType: 'card'
  empty: boolean
  complete: boolean
  error?: {
    type: string
    code: string
    message: string
  }
  value: {
    postalCode: string
  }
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown'
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading card form...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change`, a load error or a creation error |

```vue
<VueStripeCardElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeCardElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeCardElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `cardRef.value.element` is a `StripeCardElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCardElement } from '@vue-stripe/vue-stripe'
import type { StripeCardElement } from '@stripe/stripe-js'

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)

const focus = () => cardRef.value?.focus()
const clear = () => cardRef.value?.clear()
const stripeElement = (): StripeCardElement | null => cardRef.value?.element ?? null
</script>

<template>
  <VueStripeCardElement ref="cardRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-card-element vue-stripe-element">
  <!-- only when there is an error; an #error slot replaces the inner div -->
  <div class="vue-stripe-card-element-error vue-stripe-element-error">
    <div class="vue-stripe-error-message">The error message</div>
  </div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-card-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-card-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading; a #loading slot replaces the inner div -->
  <div class="vue-stripe-card-element-loader vue-stripe-element-loader">
    <div class="vue-stripe-loading-message">Loading card form...</div>
  </div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-card-element*` for this one.

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeCardElement } from '@vue-stripe/vue-stripe'
import type {
  StripeCardElement,
  StripeCardElementChangeEvent,
  StripeCardElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px'
    }
  },
  hidePostalCode: true
}

// Event handlers
const handleReady = (element: StripeCardElement) => {
  console.log('Ready:', element)
}

const handleChange = (event: StripeCardElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Brand:', event.brand)
}

// Template ref
const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
```

## See Also

- [VueStripeElements](/api/components/stripe-elements) - Parent container component
- [Split Card Elements](/api/components/stripe-split-card-elements) - Number, expiry and CVC as separate fields
- [Card confirmers](/api/composables/confirm/cards) - `useConfirmCardPayment` and `useConfirmCardSetup`
- [useCreatePaymentMethod](/api/composables/use-create-payment-method) - Create a PaymentMethod from the card
- [Accept card payments with the Card Element](/guide/card-element) - Step-by-step guide
- [Style elements](/guide/styling#_3-style-the-card-iban-and-becs-elements) - The `style` option and wrapper CSS
- [Test your integration](/guide/testing#cards) - Test cards
