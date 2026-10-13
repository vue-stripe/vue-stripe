---
description: "VueStripePaymentElement reference: Stripe's Payment Element for Vue, one form for cards, wallets, bank debits and BNPL. Props, events, slots, methods."
---

# VueStripePaymentElement

Stripe's Payment Element: one form for cards, wallets, bank debits, buy-now-pay-later and local payment methods. Stripe chooses which methods to show from the Intent or Checkout Session, the customer's location and your Dashboard settings. Use it inside [VueStripeElements](/api/components/stripe-elements) or [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider). For the steps of a full integration, see [Accept a payment with the Payment Element](/guide/payment-element); [Choosing an integration](/guide/approaches#payment-element-or-card-element) compares it with the Card Element.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement :options="{ layout: 'tabs' }" @change="onChange" />
      <!-- PayButton calls usePaymentIntent(), so it renders inside VueStripeElements -->
      <PayButton :client-secret="clientSecret" :disabled="!isComplete" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import PayButton from './PayButton.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
const isComplete = ref(false)

const onChange = (event) => {
  isComplete.value = event.complete
}
</script>
```

```vue
<!-- PayButton.vue -->
<script setup>
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: String, disabled: Boolean })
const { confirmPayment, loading, error } = usePaymentIntent()

const pay = () =>
  confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: window.location.href },
    redirect: 'if_required'
  })
</script>

<template>
  <button :disabled="disabled || loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

The Payment Element needs one of these parents:

- `VueStripeElements` with a `clientSecret` from a PaymentIntent or SetupIntent created on your server.
- `VueStripeElements` with `mode` / `currency` / `amount` (a deferred Intent, created on your server at submit time). Restrict payment methods here with `:options="{ allowedPaymentMethodTypes: [...] }"` on `VueStripeElements`.
- `VueStripeCheckoutElementsProvider` for a Checkout Session (see [With Checkout Sessions](#with-checkout-sessions)).

### With Checkout Sessions

Inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider), the component is created with `checkout.createPaymentElement()`. The Checkout SDK accepts only `layout`, `paymentMethodOrder`, `readOnly`, `terms`, `fields`, `wallets` and `walletOptions`; other options are dropped. Confirm with `useCheckoutSession().confirm()` instead of `usePaymentIntent()`.

Saved payment methods are on by default with Checkout Sessions since Stripe.js Clover; control them with the provider's `elementsOptions.savedPaymentMethod`.

```vue
<VueStripeCheckoutElementsProvider :client-secret="clientSecret">
  <VueStripePaymentElement :options="{ layout: 'accordion' }" />
</VueStripeCheckoutElementsProvider>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripePaymentElementOptions` | No | Payment element configuration |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.
:::

### Options Object

The commonly used subset of Stripe's `StripePaymentElementOptions` type (exported from `@stripe/stripe-js`). The installed `.d.ts` and [Stripe's Payment Element options](https://docs.stripe.com/js/elements_object/create_payment_element) are the full list.

```ts
interface StripePaymentElementOptions {
  layout?: 'tabs' | 'accordion' | 'auto' | {
    type: 'tabs' | 'accordion'
    defaultCollapsed?: boolean
    radios?: 'auto' | 'never' | 'always' | 'if_multiple'
    spacedAccordionItems?: boolean
    visibleAccordionItemsCount?: number
  }
  defaultValues?: {
    billingDetails?: {
      name?: string
      email?: string
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
  }
  business?: {
    name: string
  }
  paymentMethodOrder?: string[]
  fields?: {
    billingDetails?: 'auto' | 'never' | {
      name?: 'auto' | 'never'
      email?: 'auto' | 'never'
      phone?: 'auto' | 'never'
      address?: 'auto' | 'never' | {
        line1?: 'auto' | 'never'
        line2?: 'auto' | 'never'
        city?: 'auto' | 'never'
        state?: 'auto' | 'never'
        postal_code?: 'auto' | 'never'
        country?: 'auto' | 'never'
      }
    }
  }
  wallets?: {
    applePay?: 'auto' | 'never'
    googlePay?: 'auto' | 'never'
  }
  terms?: {
    card?: 'auto' | 'always' | 'never'
    auBecsDebit?: 'auto' | 'always' | 'never'
    bancontact?: 'auto' | 'always' | 'never'
    ideal?: 'auto' | 'always' | 'never'
    sepaDebit?: 'auto' | 'always' | 'never'
    sofort?: 'auto' | 'always' | 'never'
    usBankAccount?: 'auto' | 'always' | 'never'
  }
}
```

For example, `:options="{ layout: { type: 'accordion', radios: 'always' } }"` switches to the accordion layout with a radio button on every item, `fields: { billingDetails: 'never' }` hides the billing fields (pass them at confirm time instead), and `wallets: { applePay: 'never', googlePay: 'never' }` hides the wallets.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripePaymentElement` | Emitted when the element is fully rendered |
| `@change` | `StripePaymentElementChangeEvent` | Emitted when the element value changes |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the escape key is pressed |
| `@loaderstart` | `{ elementType: 'payment' }` | Emitted when the element starts loading |
| `@loaderror` | `{ elementType: 'payment'; error: StripeError }` | Emitted when the element fails to load |
| `@availablepaymentmethodschange` | `StripePaymentElementAvailablePaymentMethodsChangeEvent` | Emitted when the set of payment methods shown changes |
| `@carddetailschange` | `StripePaymentElementCardDetailsChangeEvent` | Emitted when the entered card's brand or details change |
| `@savedpaymentmethodupdate` | `StripePaymentElementSavedPaymentMethodUpdateEvent` | Emitted when a saved payment method is updated |
| `@savedpaymentmethodremove` | `StripePaymentElementSavedPaymentMethodRemoveEvent` | Emitted when a saved payment method is removed |

`@loaderror` also fires when creating the element fails (for example when the surrounding provider does not support it), with the payload `{ elementType: 'payment', error: { message } }`; the message is also shown through the `#error` slot.

There is no `@loaderstop` event: Stripe.js never emits one (v5 listed it by mistake). The element is loaded when `@ready` fires.

### Change Event

```ts
interface StripePaymentElementChangeEvent {
  elementType: 'payment'
  empty: boolean
  complete: boolean
  collapsed?: boolean
  value: {
    type: string // e.g., 'card', 'ideal', 'sepa_debit'
  }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading payment form...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change`, a load error or a creation error |

```vue
<VueStripePaymentElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripePaymentElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripePaymentElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |
| `collapse()` | `() => void` | Collapse the Payment Element (accordion layout) |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `paymentRef.value.element` is a `StripePaymentElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePaymentElement } from '@vue-stripe/vue-stripe'
import type { StripePaymentElement } from '@stripe/stripe-js'

const paymentRef = ref<InstanceType<typeof VueStripePaymentElement> | null>(null)

const focus = () => paymentRef.value?.focus()
const clear = () => paymentRef.value?.clear()
const stripeElement = (): StripePaymentElement | null => paymentRef.value?.element ?? null
const collapse = () => paymentRef.value?.collapse()
</script>

<template>
  <VueStripePaymentElement ref="paymentRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-payment-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-payment-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-payment-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-payment-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-payment-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-payment-element*` for this one.

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripePaymentElement } from '@vue-stripe/vue-stripe'
import type {
  StripePaymentElement,
  StripePaymentElementChangeEvent,
  StripePaymentElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripePaymentElementOptions = {
  layout: 'tabs',
  defaultValues: {
    billingDetails: {
      email: 'customer@example.com'
    }
  }
}

// Event handlers
const handleReady = (element: StripePaymentElement) => {
  console.log('Ready:', element)
}

const handleChange = (event: StripePaymentElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Payment type:', event.value.type)
}

// Template ref
const paymentRef = ref<InstanceType<typeof VueStripePaymentElement> | null>(null)
```

## See Also

- [VueStripeElements](/api/components/stripe-elements) - Parent container component
- [usePaymentIntent](/api/composables/use-payment-intent) - Confirm payments
- [useSetupIntent](/api/composables/use-setup-intent) - Save payment methods
- [Accept a payment with the Payment Element](/guide/payment-element) - Step-by-step guide
- [Choosing an integration](/guide/approaches#payment-element-or-card-element) - Payment Element or Card Element
- [Collect payment details before creating an Intent](/guide/deferred-intent) - The `mode` / `amount` / `currency` flow
- [Handle errors and declines](/guide/error-handling) - Validation, confirmation and decline errors
- [Style elements](/guide/styling#_2-theme-the-fields-with-the-appearance-api) - Theme the Payment Element
- [Test your integration](/guide/testing#cards) - Test cards
- [Stripe Payment Element docs](https://docs.stripe.com/payments/payment-element) - Official documentation
