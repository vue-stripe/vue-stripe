---
description: "VueStripeIbanElement reference: collect and validate an IBAN for SEPA Direct Debit in Vue. Props, change events, and the payment and setup confirmers."
---

# VueStripeIbanElement

Collects an IBAN for SEPA Direct Debit. The element formats and validates the IBAN as the customer types and reports the bank and country in `@change`. Use it inside [VueStripeElements](/api/components/stripe-elements), and confirm with [`useConfirmSepaDebitPayment()` or `useConfirmSepaDebitSetup()`](/api/composables/confirm/bank-debits), passing the exposed `element`. For the server and client steps, see [Accept SEPA Direct Debit](/guide/iban-element). SEPA payments settle days later; [Payments that settle later](/guide/payment-objects#payments-that-settle-later) explains what that means for fulfilment.

::: info Mandate text
SEPA Direct Debit requires you to show the customer mandate text before they pay. Stripe's [SEPA Direct Debit docs](https://docs.stripe.com/payments/sepa-debit) give the wording.
:::

## Usage

```vue
<!-- SepaForm.vue: rendered inside VueStripeProvider > VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIbanElement, useConfirmSepaDebitPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string; name: string; email: string }>()

const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)
const ibanComplete = ref(false)
const { confirmSepaDebitPayment, loading } = useConfirmSepaDebitPayment()

const pay = async () => {
  const iban = ibanRef.value?.element
  if (!iban) return
  const { error, paymentIntent } = await confirmSepaDebitPayment(props.clientSecret, {
    payment_method: {
      sepa_debit: iban,
      billing_details: { name: props.name, email: props.email }
    }
  })
  console.log(error ? error.message : paymentIntent.status)
}
</script>

<template>
  <form @submit.prevent="pay">
    <VueStripeIbanElement
      ref="ibanRef"
      :options="{ supportedCountries: ['SEPA'], placeholderCountry: 'DE' }"
      @change="(e) => (ibanComplete = e.complete)"
    />
    <button :disabled="!ibanComplete || loading">Pay with SEPA</button>
  </form>
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeIbanElementOptions` | No | IBAN element configuration. Defaults to `{ supportedCountries: ['SEPA'] }` |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.
:::

### Options Object

```ts
interface StripeIbanElementOptions {
  supportedCountries?: string[] // ['SEPA'] (default) or country codes
  placeholderCountry?: string // country whose IBAN format the placeholder shows, e.g. 'DE'
  style?: StripeElementStyle // { base, complete, empty, invalid }
  classes?: StripeElementClasses
  iconStyle?: 'default' | 'solid'
  hideIcon?: boolean
  disabled?: boolean
}
```

| Option | Values |
|--------|--------|
| `supportedCountries` | `['SEPA']` accepts IBANs from every SEPA country; a list of country codes (`['DE', 'FR', 'NL']`) limits them |
| `placeholderCountry` | A country code. The placeholder shows that country's IBAN format, e.g. `DE00 0000 0000 0000 0000 00` for `DE` |

`style` is Stripe's [element style object](https://docs.stripe.com/js/appendix/style), with `base`, `complete`, `empty` and `invalid` variants.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeIbanElement` | Emitted when the element is fully rendered |
| `@change` | `StripeIbanElementChangeEvent` | Emitted when the element value changes |
| `@focus` | `{ elementType: 'iban' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'iban' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'iban' }` | Emitted when the user presses the Escape key |

### Change Event

```ts
interface StripeIbanElementChangeEvent {
  elementType: 'iban'
  empty: boolean
  complete: boolean
  country: string // e.g. 'DE', 'FR', 'NL'
  bankName: string // e.g. 'Deutsche Bank'
  error?: { type: 'validation_error'; code: string; message: string }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading IBAN form...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change` or a creation error |

```vue
<VueStripeIbanElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeIbanElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeIbanElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `ibanRef.value.element` is a `StripeIbanElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIbanElement } from '@vue-stripe/vue-stripe'
import type { StripeIbanElement } from '@stripe/stripe-js'

const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)

const focus = () => ibanRef.value?.focus()
const clear = () => ibanRef.value?.clear()
const stripeElement = (): StripeIbanElement | null => ibanRef.value?.element ?? null
</script>

<template>
  <VueStripeIbanElement ref="ibanRef" />
  <button type="button" @click="focus">Focus</button>
  <button type="button" @click="clear">Clear</button>
  <p v-if="stripeElement()">The Stripe element exists</p>
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-iban-element vue-stripe-element">
  <!-- only when there is an error; an #error slot replaces the inner div -->
  <div class="vue-stripe-iban-element-error vue-stripe-element-error">
    <div class="vue-stripe-error-message">The error message</div>
  </div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-iban-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-iban-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading; a #loading slot replaces the inner div -->
  <div class="vue-stripe-iban-element-loader vue-stripe-element-loader">
    <div class="vue-stripe-loading-message">Loading IBAN form...</div>
  </div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-iban-element*` for this one. [Style elements](/guide/styling#_4-style-the-wrapper-markup) covers the markup and the Appearance API.

## TypeScript

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIbanElement } from '@vue-stripe/vue-stripe'
import type {
  StripeIbanElement,
  StripeIbanElementChangeEvent,
  StripeIbanElementOptions
} from '@stripe/stripe-js'

const options: StripeIbanElementOptions = {
  supportedCountries: ['SEPA'],
  placeholderCountry: 'DE'
}

const handleChange = (event: StripeIbanElementChangeEvent) => {
  console.log(event.complete, event.country, event.bankName)
}

const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)
const iban = (): StripeIbanElement | null => ibanRef.value?.element ?? null
</script>

<template>
  <VueStripeIbanElement
    ref="ibanRef"
    :options="options"
    @change="handleChange"
  />
  <p v-if="iban()">The Stripe element exists</p>
</template>
```

## See Also

- [Accept SEPA Direct Debit](/guide/iban-element) - Server and client steps
- [Bank debit confirmers](/api/composables/confirm/bank-debits) - `useConfirmSepaDebitPayment` and `useConfirmSepaDebitSetup`
- [VueStripeElements](/api/components/stripe-elements) - Required parent
- [VueStripePaymentElement](/api/components/stripe-payment-element) - SEPA, iDEAL, P24, EPS and other bank payments in one element (Stripe removed the standalone iDEAL, P24, EPS and FPX elements in Clover)
- [Style elements](/guide/styling#_3-style-the-card-iban-and-becs-elements) - The `style` option and wrapper CSS
- [Test your integration](/guide/testing#sepa-direct-debit-iban) - Test IBANs
- [Fulfil orders with webhooks](/guide/webhooks) - SEPA payments settle days later
- [Live demo](/live-demo/iban-element)
