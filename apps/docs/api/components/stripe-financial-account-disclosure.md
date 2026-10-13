# VueStripeFinancialAccountDisclosure

Renders the legal disclosure Stripe requires for Financial Accounts for platforms. It is the Vue port of React Stripe.js 7's `FinancialAccountDisclosure`: it calls `stripe.createFinancialAccountDisclosure(options)` and mounts the HTML element Stripe.js returns. Vue Stripe does not ship any legal text of its own.

::: warning Account requirement
Stripe answers with an error unless your account has onboarded to Financial Accounts for platforms (Treasury). In a sandbox account without it, Stripe returns an `invalid_request_error` ("Unrecognized request URL (GET: /v1/disclosures/...)"), which this component emits through `@error` and shows in the `#error` slot.
:::

::: info No live demo
The docs' live demos run on an account that has not onboarded to Financial Accounts, so this disclosure has no live demo.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeFinancialAccountDisclosure
      :options="options"
      @load="onLoad"
      @error="onError"
    />
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeFinancialAccountDisclosure } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const options = {
  businessName: 'Rocket Rides',
  learnMoreLink: 'https://example.com/financial-accounts'
}

const onLoad = () => console.log('Disclosure rendered')
const onError = (error) => console.error(error.message)
</script>
```

Like the React component, it also accepts a `stripe` prop (a `Stripe` instance, a Promise of one, or `null`), so it works without `VueStripeProvider`:

```vue
<script setup>
import { loadStripe } from '@stripe/stripe-js'
import { VueStripeFinancialAccountDisclosure } from '@vue-stripe/vue-stripe'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
</script>

<template>
  <VueStripeFinancialAccountDisclosure :stripe="stripePromise" />
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stripe` | `Stripe \| PromiseLike<Stripe \| null> \| null` | No | Stripe instance to use. Defaults to the one from the surrounding `VueStripeProvider`; without either, the component throws `VueStripeProviderError`. While it is `null` nothing is requested |
| `options` | `FinancialAccountDisclosureOptions` | No | Disclosure options (below) |

### Options

| Option | Type | Description |
|--------|------|-------------|
| `businessName` | `string` | Your business name as it should appear in the disclosure. Inferred from the Stripe account when omitted |
| `learnMoreLink` | `string` | A supplemental link where your users can learn more |

```ts
interface FinancialAccountDisclosureOptions {
  businessName?: string
  learnMoreLink?: string
}
```

Changing an option requests the disclosure again and replaces the rendered text. Re-renders with equal option values (an inline `:options="{ ... }"`) do not.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | - | Emitted after the disclosure content is mounted (React `onLoad`) |
| `@error` | `StripeError \| { message: string }` | Emitted when Stripe returns an error, or `{ message }` when the call fails (React `onError`) |

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the disclosure loads (default: "Loading disclosure...") |
| `#error` | `{ error: string }` | Rendered when the disclosure could not be created |

## Exposed Properties

| Member | Type | Description |
|--------|------|-------------|
| `loading` | `Ref<boolean>` | `true` until the disclosure is mounted or fails |
| `error` | `Ref<string \| null>` | Current error message |

## Styling

```html
<div class="vue-stripe-financial-account-disclosure vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-financial-account-disclosure-error vue-stripe-element-error">...</div>
  <!-- the HTML element returned by stripe.createFinancialAccountDisclosure() goes here -->
  <div class="vue-stripe-financial-account-disclosure-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-financial-account-disclosure-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles ship in the package stylesheet (`import '@vue-stripe/vue-stripe/style.css'`).

## TypeScript

```ts
import { VueStripeFinancialAccountDisclosure } from '@vue-stripe/vue-stripe'
import type { FinancialAccountDisclosureOptions, DisclosureError } from '@vue-stripe/vue-stripe'

const options: FinancialAccountDisclosureOptions = {
  businessName: 'Rocket Rides',
  learnMoreLink: 'https://example.com/financial-accounts'
}

const handleError = (error: DisclosureError) => console.error(error.message)
```

`stripe.createFinancialAccountDisclosure()` is not in the Stripe.js 10.0.0 type definitions; React Stripe.js 7 calls it the same way. If the loaded Stripe.js has no such method, the component emits `@error` with `{ message: 'stripe.createFinancialAccountDisclosure() is not available in this Stripe.js version' }`.

## See Also

- [VueStripeIssuingDisclosure](/api/components/stripe-issuing-disclosure)
- [VueStripeTreasuryDisclosure](/api/components/stripe-treasury-disclosure)
- [VueStripeProvider](/api/components/stripe-provider) - Loads Stripe.js
