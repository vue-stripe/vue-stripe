# Tax ID Element

The Tax ID Element collects and validates a customer's tax ID (for example EU VAT, GST, or ABN) during a Custom Checkout session. Use it so the resulting invoice and tax calculation reflect the customer's tax registration.

::: warning Requires stripe-js 8.x
The Tax ID Element is created from the Custom Checkout `checkout` instance, which only exists in `@stripe/stripe-js` 8.0.0+. Vue Stripe 6+ requires `@stripe/stripe-js@^8.5.3`.
:::

::: danger Requires a beta flag
Stripe currently beta-gates the Tax ID Element. Initialize Stripe with the `custom_checkout_tax_id_1` beta via the `betas` prop on `VueStripeProvider`, otherwise `createTaxIdElement` is missing at runtime (`createTaxIdElement is not a function`):

```vue
<VueStripeProvider :publishable-key="publishableKey" :betas="['custom_checkout_tax_id_1']">
```

Your Stripe account must have access to the beta.
:::

## Required Components

| Component | Role |
|-----------|------|
| `VueStripeProvider` | Loads Stripe.js and provides the stripe instance |
| `VueStripeCheckoutProvider` | Initializes the Custom Checkout session from a `client_secret` |
| `VueStripeTaxIdElement` | Renders the tax ID input |

::: tip Custom Checkout only
This is a Custom Checkout element. It must be rendered inside a [VueStripeCheckoutProvider](/api/components/stripe-checkout-provider), which itself lives inside a `VueStripeProvider`. It does not work inside `VueStripeElements`.
:::

## Basic Implementation

### Step 1: Set Up the Provider Hierarchy

Create a Checkout Session on your server with `ui_mode: 'custom'` and pass its `client_secret` to `VueStripeCheckoutProvider`.

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeCheckoutProvider,
  VueStripeTaxIdElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// A Custom Checkout session client secret (cs_..._secret_...) created on
// your server with `ui_mode: 'custom'`.
const clientSecret = '<checkout-session-client-secret>'

// Optionally also collect a business name alongside the tax ID.
const taxIdOptions = {
  fields: { businessName: 'auto' }
}
</script>

<template>
  <VueStripeProvider
    :publishable-key="publishableKey"
    :betas="['custom_checkout_tax_id_1']"
  >
    <VueStripeCheckoutProvider :client-secret="clientSecret">
      <VueStripeTaxIdElement
        :options="taxIdOptions"
        @ready="onReady"
        @change="onChange"
        @focus="onFocus"
        @blur="onBlur"
        @escape="onEscape"
        @loaderstart="onLoadStart"
        @loaderror="onLoadError"
      />
    </VueStripeCheckoutProvider>
  </VueStripeProvider>
</template>
```

**What's happening:**
- `VueStripeProvider` loads Stripe.js with your publishable key
- `VueStripeCheckoutProvider` initializes the Custom Checkout session
- `VueStripeTaxIdElement` renders the tax ID input; the `options` prop controls which fields appear

### Step 2: Handle Events

```vue
<script setup>
import { ref } from 'vue'

const taxIdComplete = ref(false)

const onReady = (element) => {
  console.log('Tax ID ready', element)
}

const onChange = (event) => {
  taxIdComplete.value = event.complete
  console.log('Tax ID:', event.value.taxId)
}

const onFocus = () => console.log('Tax ID focused')
const onBlur = () => console.log('Tax ID blurred')
const onEscape = () => console.log('Escape pressed in tax ID')
const onLoadStart = () => console.log('Tax ID begins loading')

const onLoadError = (event) => {
  console.error('Failed to load tax ID:', event.error)
}
</script>
```

**What's happening:**
- The `@change` event includes `complete` and a `value` object with `businessName`, `taxId`, and `taxIdType`
- Use `complete` to enable/disable your submit button

## Options

The `options` prop accepts a `StripeTaxIdElementOptions` object:

| Option | Type | Description |
|--------|------|-------------|
| `visibility` | `'always' \| 'never' \| 'auto'` | Control visibility of the element |
| `fields.businessName` | `'always' \| 'never' \| 'auto'` | Whether to show the business name field |
| `validation` | object | Per-field required rules (`businessName`, `taxId`) |
| `defaultValues` | object | Default `businessName`, `taxIdType`, and `taxId` |

## Events

`VueStripeTaxIdElement` emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeTaxIdElement` | Fired when the element finishes mounting |
| `@change` | `StripeTaxIdElementChangeEvent` | Fired on every change (includes `complete`, `empty`, `value`) |
| `@focus` | — | Fired when the element gains focus |
| `@blur` | — | Fired when the element loses focus |
| `@escape` | — | Fired when the user presses the Escape key |
| `@loaderstart` | — | Fired when the element begins loading |
| `@loaderror` | `{ elementType: 'taxId'; error: StripeError }` | Fired when the element fails to load |

## Next Steps

- [Currency Selector Element](/guide/currency-selector-element) — Let customers pick a currency in Custom Checkout
- [API Reference](/api/components/stripe-tax-id-element) — Full props, events, and exposed members
- [useCheckoutSession](/api/composables/use-checkout-session) — Drive the Checkout Session
