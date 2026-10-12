# VueStripeTaxIdElement

Collects a business name and tax ID (e.g. EU VAT, GST, ABN). Use it inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (created with `checkout.createTaxIdElement()`), or inside [VueStripeElements](/api/components/stripe-elements) with Stripe beta access (`elements.create('taxId')`).

::: tip When to Use
Use VueStripeTaxIdElement to collect and validate a business tax ID during checkout, so the resulting invoice and tax calculation reflect the customer's tax registration.
:::

::: danger Requires a beta flag
The Tax ID element is beta-gated by Stripe. Initialize Stripe with the Tax ID beta flag, or `createTaxIdElement` will not exist at runtime. Pass it via the [`betas`](/api/components/stripe-provider#props) prop on `VueStripeProvider` (check [Stripe's Tax ID docs](https://docs.stripe.com/tax/advanced/tax-ids?payment-ui=embedded-components) for the current flag name):

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  :betas="['custom_checkout_tax_id_1']"
>
  <!-- … -->
</VueStripeProvider>
```

Add `'custom_checkout_tax_id_verification_1'` as well for real-time tax ID verification. Your Stripe account must have access to these betas.
:::

## Usage

```vue
<template>
  <VueStripeProvider
    :publishable-key="publishableKey"
    :betas="['custom_checkout_tax_id_1']"
  >
    <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
      <VueStripeTaxIdElement
        :options="taxIdOptions"
        @ready="onReady"
        @change="onChange"
      />
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeCheckoutElementsProvider,
  VueStripeTaxIdElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = '<checkout-session-client-secret>'

const taxIdOptions = {
  fields: { businessName: 'auto' }
}

const onReady = (element) => console.log('Tax ID ready', element)
const onChange = (event) => console.log('Complete:', event.complete)
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeTaxIdElementOptions` | No | Tax ID element configuration |

### Options Object

```ts
interface StripeTaxIdElementOptions {
  // Control visibility of the element.
  visibility?: 'always' | 'never' | 'auto'
  // Control which fields are displayed.
  fields?: {
    businessName?: 'always' | 'never' | 'auto'
  }
  // Validation rules per field.
  validation?: {
    businessName?: { required?: 'always' | 'never' | 'auto' }
    taxId?: { required?: 'always' | 'never' | 'auto' }
  }
  // Default values for the element fields.
  defaultValues?: {
    businessName?: string
    taxIdType?: TaxIdType
    taxId?: string
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeTaxIdElement` | Emitted when the element is fully rendered |
| `@change` | `StripeTaxIdElementChangeEvent` | Emitted when the element value changes |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the user presses the Escape key |
| `@loaderstart` | - | Emitted when the element begins loading |
| `@loaderror` | `{ elementType: 'taxId'; error: StripeError }` | Emitted when the element fails to load |

### Change Event

```ts
interface StripeTaxIdElementChangeEvent {
  elementType: 'taxId'
  empty: boolean
  complete: boolean
  visible: boolean
  value: {
    businessName: string
    taxId: string
    taxIdType: TaxIdType
    externalTaxIdType: ExternalTaxIdType
  }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is initializing |
| `#error` | `{ error: string }` | Rendered when an error occurs; receives the error message string |

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `Ref<StripeTaxIdElement \| null>` | The underlying Stripe element instance |
| `loading` | `Ref<boolean>` | Whether the element is loading |
| `error` | `Ref<string \| null>` | Current error message |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element |
| `getValue()` | `() => Promise<...>` | Validate and read the current business name and tax ID |

## TypeScript

```ts
import { VueStripeTaxIdElement } from '@vue-stripe/vue-stripe'
import type {
  StripeTaxIdElement,
  StripeTaxIdElementOptions,
  StripeTaxIdElementChangeEvent
} from '@stripe/stripe-js'

const options: StripeTaxIdElementOptions = {
  fields: { businessName: 'auto' }
}

const handleChange = (event: StripeTaxIdElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Tax ID:', event.value.taxId)
}
```

## See Also

- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for elements with Checkout Sessions
- [VueStripeCurrencySelectorElement](/api/components/stripe-currency-selector-element) - Let customers pick a currency with Checkout Sessions
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive the Checkout Session
