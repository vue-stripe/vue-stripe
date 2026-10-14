---
description: "Split Card Elements reference: VueStripeCardNumberElement, VueStripeCardExpiryElement and VueStripeCardCvcElement for card forms with separate fields."
---

# Split Card Elements

Three components that render the card number, expiry date and CVC as separate fields, for layouts the single [VueStripeCardElement](/api/components/stripe-card-element) can't give. Use them together inside the same [VueStripeElements](/api/components/stripe-elements), without a `clientSecret`. To confirm or create a PaymentMethod, pass only the card number element: Stripe reads the expiry and CVC from the sibling fields of the same Elements group. [Choosing an integration](/guide/approaches#payment-element-or-card-element) compares the card elements with the Payment Element.

| Component | Stripe element type | Field |
|-----------|---------------------|-------|
| `VueStripeCardNumberElement` | `cardNumber` | Card number, with brand detection |
| `VueStripeCardExpiryElement` | `cardExpiry` | MM / YY expiry date |
| `VueStripeCardCvcElement` | `cardCvc` | 3 or 4 digit security code |

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <SplitCardForm :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup lang="ts">
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import SplitCardForm from './SplitCardForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
</script>
```

```vue
<!-- SplitCardForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeCardNumberElement,
  VueStripeCardExpiryElement,
  VueStripeCardCvcElement,
  useConfirmCardPayment
} from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const numberRef = ref<InstanceType<typeof VueStripeCardNumberElement> | null>(null)
const paid = ref(false)
const { confirmCardPayment, loading, error } = useConfirmCardPayment()

const pay = async () => {
  // Only the number element: Stripe reads expiry and CVC from its siblings
  const card = numberRef.value?.element
  if (!card) return
  const { paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: { card }
  })
  // A succeeded PaymentIntent cannot be confirmed again
  if (paymentIntent?.status === 'succeeded') paid.value = true
}
</script>

<template>
  <p v-if="paid">Payment received.</p>
  <form v-else @submit.prevent="pay">
    <label>Card number</label>
    <VueStripeCardNumberElement ref="numberRef" :options="{ showIcon: true }" />
    <label>Expiry</label>
    <VueStripeCardExpiryElement />
    <label>CVC</label>
    <VueStripeCardCvcElement />
    <button :disabled="loading">Pay</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
```

Each field emits its own `@change`; track `event.complete` from all three to enable the submit button, and `event.error?.message` for per-field errors.

## Props

All three components share the same props interface:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | No | Element configuration options |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.

On `VueStripeCardNumberElement`, `disableLink` and `preferredNetwork` are read when the element is created and never passed to `update()`, because Stripe.js doesn't accept them there. To change one, re-mount the component (e.g. with a `:key`).
:::

### Options Object

```ts
interface SplitCardElementOptions {
  style?: {
    base?: StripeElementStyle
    complete?: StripeElementStyle
    empty?: StripeElementStyle
    invalid?: StripeElementStyle
  }
  disabled?: boolean
  // CardNumber specific:
  showIcon?: boolean        // Show card brand icon
  iconStyle?: 'default' | 'solid'
}
```

## Events

All three components emit the same events:

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCardNumberElement` / `StripeCardExpiryElement` / `StripeCardCvcElement` | Emitted when the element is fully rendered (payload: that component's Stripe element) |
| `@change` | `StripeCardNumberElementChangeEvent` / `StripeCardExpiryElementChangeEvent` / `StripeCardCvcElementChangeEvent` | Emitted when the element value changes |
| `@focus` | `{ elementType: 'cardNumber' }` / `{ elementType: 'cardExpiry' }` / `{ elementType: 'cardCvc' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'cardNumber' }` / `{ elementType: 'cardExpiry' }` / `{ elementType: 'cardCvc' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'cardNumber' }` / `{ elementType: 'cardExpiry' }` / `{ elementType: 'cardCvc' }` | Emitted when the escape key is pressed |

`VueStripeCardNumberElement` also emits:

| Event | Payload | Description |
|-------|---------|-------------|
| `@networkschange` | `{ elementType: 'cardNumber'; networks: string[] \| null; loading: boolean }` | Emitted when the card networks available for the entered number change (co-badged cards). `networks` lists them, for example `['cartes_bancaires', 'visa']`; it is `null` while `loading` is `true` |
| `@loaderror` | `{ elementType: 'cardNumber'; error: StripeError }` | Emitted when the element fails to load. Also fires when creating the element fails, with `{ elementType: 'cardNumber', error: { message } }`; the message is also shown through the `#error` slot |

### Change Event Differences

**StripeCardNumberElement**
```ts
interface CardNumberChangeEvent {
  elementType: 'cardNumber'
  empty: boolean
  complete: boolean
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown'
  error?: { message: string }
}
```

**StripeCardExpiryElement**
```ts
interface CardExpiryChangeEvent {
  elementType: 'cardExpiry'
  empty: boolean
  complete: boolean
  error?: { message: string }
}
```

**StripeCardCvcElement**
```ts
interface CardCvcChangeEvent {
  elementType: 'cardCvc'
  empty: boolean
  complete: boolean
  error?: { message: string }
}
```

## Slots

Each component has the same slots:

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading card number...", "Loading card expiry...", "Loading card CVC...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change` or a creation error |

```vue
<VueStripeCardNumberElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="field-error">{{ error }}</p>
  </template>
</VueStripeCardNumberElement>
```

## Exposed Methods & Properties

Access via template ref on each component. Every component exposes the same members:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeCardNumberElement \| null>` (`StripeCardExpiryElement` / `StripeCardCvcElement` for the others) | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation or creation error) |
| `focus()` | `() => void` | Focus the input |
| `blur()` | `() => void` | Blur the input |
| `clear()` | `() => void` | Clear the input value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `numberRef.value.element` is a `StripeCardNumberElement | null`. Type the template refs with the component types and the elements with the Stripe types:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeCardNumberElement,
  VueStripeCardExpiryElement,
  VueStripeCardCvcElement
} from '@vue-stripe/vue-stripe'
import type { StripeCardNumberElement } from '@stripe/stripe-js'

const numberRef = ref<InstanceType<typeof VueStripeCardNumberElement> | null>(null)
const expiryRef = ref<InstanceType<typeof VueStripeCardExpiryElement> | null>(null)
const cvcRef = ref<InstanceType<typeof VueStripeCardCvcElement> | null>(null)

const focusNumber = () => numberRef.value?.focus()
const clearAll = () => {
  numberRef.value?.clear()
  expiryRef.value?.clear()
  cvcRef.value?.clear()
}

// Pass the number element to useCreatePaymentMethod().createPaymentMethod({ type: 'card', card })
const cardNumber = (): StripeCardNumberElement | null => numberRef.value?.element ?? null
</script>

<template>
  <VueStripeCardNumberElement ref="numberRef" />
  <VueStripeCardExpiryElement ref="expiryRef" />
  <VueStripeCardCvcElement ref="cvcRef" />
  <button type="button" @click="focusNumber">Focus number</button>
  <button type="button" @click="clearAll">Clear all</button>
  <p v-if="cardNumber()">The Stripe element exists</p>
</template>
```

## Styling

Each component renders this markup around Stripe's iframe (`<type>` is `cardNumber`, `cardExpiry` or `cardCvc`):

```html
<div class="vue-stripe-<type>-element vue-stripe-element">
  <!-- only when there is an error; an #error slot replaces the inner div -->
  <div class="vue-stripe-<type>-element-error vue-stripe-element-error">
    <div class="vue-stripe-error-message">The error message</div>
  </div>
  <!-- Stripe mounts its iframe here; plus -loading classes while loading -->
  <div class="vue-stripe-<type>-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading; a #loading slot replaces the inner div -->
  <div class="vue-stripe-<type>-element-loader vue-stripe-element-loader">
    <div class="vue-stripe-loading-message">Loading card number...</div>
  </div>
</div>
```

The default loading text is "Loading card number...", "Loading card expiry..." or "Loading card CVC...".

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or e.g. `.vue-stripe-cardNumber-element*` for one field.

## TypeScript

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeCardNumberElement,
  VueStripeCardExpiryElement,
  VueStripeCardCvcElement
} from '@vue-stripe/vue-stripe'
import type {
  StripeCardNumberElementChangeEvent,
  StripeCardNumberElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeCardNumberElementOptions = {
  style: {
    base: { fontSize: '16px' }
  },
  showIcon: true
}

// Event handlers
const handleNumberChange = (event: StripeCardNumberElementChangeEvent) => {
  console.log('Brand:', event.brand)
  console.log('Complete:', event.complete)
}

// Template refs
const numberRef = ref<InstanceType<typeof VueStripeCardNumberElement> | null>(null)
const expiryRef = ref<InstanceType<typeof VueStripeCardExpiryElement> | null>(null)
const cvcRef = ref<InstanceType<typeof VueStripeCardCvcElement> | null>(null)

const clearAll = () => {
  numberRef.value?.clear()
  expiryRef.value?.clear()
  cvcRef.value?.clear()
}
</script>

<template>
  <VueStripeCardNumberElement ref="numberRef" :options="options" @change="handleNumberChange" />
  <VueStripeCardExpiryElement ref="expiryRef" />
  <VueStripeCardCvcElement ref="cvcRef" />
  <button type="button" @click="clearAll">Clear</button>
</template>
```

## See Also

- [VueStripeCardElement](/api/components/stripe-card-element) - Number, expiry and CVC in one field
- [VueStripeElements](/api/components/stripe-elements) - Parent container
- [Card confirmers](/api/composables/confirm/cards) - `useConfirmCardPayment` and `useConfirmCardSetup`
- [useCreatePaymentMethod](/api/composables/use-create-payment-method) - Create a PaymentMethod from the number element
- [Accept card payments with the Card Element](/guide/card-element) - Step-by-step guide for the card fields
- [Style elements](/guide/styling#_3-style-the-card-iban-and-becs-elements) - The `style` option and wrapper CSS
- [Test your integration](/guide/testing#cards) - Test cards
- [Live demo](/live-demo/split-card-elements)
