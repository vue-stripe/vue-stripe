---
description: "VueStripeAuBankAccountElement reference: collect an Australian BSB and account number for BECS Direct Debit in Vue. Props, events, confirm composables."
---

# VueStripeAuBankAccountElement

Collects an Australian BSB and account number for BECS Direct Debit (AUD only). The element validates the details and reports the bank and branch in `@change`. Use it inside [VueStripeElements](/api/components/stripe-elements), and confirm with [`useConfirmAuBecsDebitPayment()` or `useConfirmAuBecsDebitSetup()`](/api/composables/confirm/bank-debits), passing the exposed `element`. For the server and client steps, including the mandate, see [Accept BECS Direct Debit](/guide/au-bank-account-element). BECS payments stay `processing` for a few business days; [Payments that settle later](/guide/payment-objects#payments-that-settle-later) explains the status flow.

::: info Mandate
BECS Direct Debit requires you to show the Direct Debit Request service agreement and collect the customer's consent before you confirm. [Accept BECS Direct Debit](/guide/au-bank-account-element#_3-render-the-form-with-the-mandate-and-confirm) has the mandate text.
:::

## Usage

```vue
<!-- BecsForm.vue: rendered inside VueStripeProvider > VueStripeElements -->
<script setup>
import { ref } from 'vue'
import { VueStripeAuBankAccountElement, useConfirmAuBecsDebitPayment } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: String, name: String, email: String })

const becsRef = ref(null)
const complete = ref(false)
const mandateAccepted = ref(false)
const { confirmAuBecsDebitPayment, loading } = useConfirmAuBecsDebitPayment()

const pay = async () => {
  const account = becsRef.value?.element
  if (!account) return
  const { error, paymentIntent } = await confirmAuBecsDebitPayment(props.clientSecret, {
    payment_method: {
      au_becs_debit: account,
      billing_details: { name: props.name, email: props.email }
    }
  })
  console.log(error ? error.message : paymentIntent.status) // 'processing'
}
</script>

<template>
  <form @submit.prevent="pay">
    <VueStripeAuBankAccountElement ref="becsRef" @change="(e) => (complete = e.complete)" />
    <label>
      <input v-model="mandateAccepted" type="checkbox" />
      I agree to the Direct Debit Request service agreement
    </label>
    <button :disabled="!complete || !mandateAccepted || loading">Pay with BECS Direct Debit</button>
  </form>
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeAuBankAccountElementOptions` | No | Element configuration |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.
:::

### Options Object

```ts
interface StripeAuBankAccountElementOptions {
  classes?: StripeElementClasses
  style?: StripeElementStyle // { base, complete, empty, invalid }
  iconStyle?: 'default' | 'solid' // style of the bank icon, default 'default'
  hideIcon?: boolean // default false
  disabled?: boolean
}
```

`style` is Stripe's [element style object](https://docs.stripe.com/js/appendix/style), with `base`, `complete`, `empty` and `invalid` variants.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeAuBankAccountElement` | Emitted when the element is fully rendered |
| `@change` | `StripeAuBankAccountElementChangeEvent` | Emitted when input changes |
| `@focus` | `{ elementType: 'auBankAccount' }` | Emitted when the element gains focus |
| `@blur` | `{ elementType: 'auBankAccount' }` | Emitted when the element loses focus |
| `@escape` | `{ elementType: 'auBankAccount' }` | Emitted when Escape key is pressed |

### Change Event

```ts
interface StripeAuBankAccountElementChangeEvent {
  elementType: 'auBankAccount'
  empty: boolean
  complete: boolean
  bankName?: string // bank name from the BSB
  branchName?: string // branch name from the BSB
  error?: { type: 'validation_error'; code: string; message: string }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading BECS Direct Debit form...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change` or a creation error |

```vue
<VueStripeAuBankAccountElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeAuBankAccountElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeAuBankAccountElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `auBankRef.value.element` is a `StripeAuBankAccountElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeAuBankAccountElement } from '@vue-stripe/vue-stripe'
import type { StripeAuBankAccountElement } from '@stripe/stripe-js'

const auBankRef = ref<InstanceType<typeof VueStripeAuBankAccountElement> | null>(null)

const focus = () => auBankRef.value?.focus()
const clear = () => auBankRef.value?.clear()
const stripeElement = (): StripeAuBankAccountElement | null => auBankRef.value?.element ?? null
</script>

<template>
  <VueStripeAuBankAccountElement ref="auBankRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-au-bank-account-element vue-stripe-element">
  <!-- only when there is an error; an #error slot replaces the inner div -->
  <div class="vue-stripe-au-bank-account-element-error vue-stripe-element-error">
    <div class="vue-stripe-error-message">The error message</div>
  </div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-au-bank-account-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-au-bank-account-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading; a #loading slot replaces the inner div -->
  <div class="vue-stripe-au-bank-account-element-loader vue-stripe-element-loader">
    <div class="vue-stripe-loading-message">Loading BECS Direct Debit form...</div>
  </div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-au-bank-account-element*` for this one. [Style elements](/guide/styling#_4-style-the-wrapper-markup) covers the markup and the Appearance API.

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeAuBankAccountElement } from '@vue-stripe/vue-stripe'
import type {
  StripeAuBankAccountElement,
  StripeAuBankAccountElementChangeEvent,
  StripeAuBankAccountElementOptions
} from '@stripe/stripe-js'

const options: StripeAuBankAccountElementOptions = { iconStyle: 'solid' }

const handleChange = (event: StripeAuBankAccountElementChangeEvent) => {
  console.log(event.complete, event.bankName, event.branchName)
}

const becsRef = ref<InstanceType<typeof VueStripeAuBankAccountElement> | null>(null)
const account = (): StripeAuBankAccountElement | null => becsRef.value?.element ?? null
```

## See Also

- [Accept BECS Direct Debit](/guide/au-bank-account-element) - Server and client steps, with the mandate
- [Bank debit confirmers](/api/composables/confirm/bank-debits) - `useConfirmAuBecsDebitPayment` and `useConfirmAuBecsDebitSetup`
- [VueStripeElements](/api/components/stripe-elements) - Required parent
- [VueStripeIbanElement](/api/components/stripe-iban-element) - SEPA Direct Debit
- [Payments that settle later](/guide/payment-objects#payments-that-settle-later) - Why the PaymentIntent stays `processing`
- [Fulfil orders with webhooks](/guide/webhooks#_2-handle-the-events-for-your-integration) - Act on settlement events
- [Style elements](/guide/styling#_3-style-the-card-iban-and-becs-elements) - The `style` option and icon
- [Test your integration](/guide/testing#becs-direct-debit-australia) - Test BSB and account numbers
- [Live demo](/live-demo/becs-payment)
