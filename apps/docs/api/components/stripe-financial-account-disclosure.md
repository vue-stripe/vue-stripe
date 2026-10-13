---
description: "VueStripeFinancialAccountDisclosure reference: render the legal disclosure Stripe requires for Financial Accounts for platforms in a Vue app."
---

# VueStripeFinancialAccountDisclosure

Shows your connected accounts the legal disclosure for financial accounts they open through your platform with Stripe Financial Accounts for platforms (formerly Stripe Treasury). Stripe writes the text and names your business in it. The component calls `stripe.createFinancialAccountDisclosure(options)` and mounts the HTML element Stripe.js returns. It is the Vue port of React Stripe.js 7's `FinancialAccountDisclosure`.

| | |
|---|---|
| Stripe product | Financial Accounts for platforms, on Stripe Connect |
| Stripe.js method | `stripe.createFinancialAccountDisclosure()`, not in the Stripe.js 10.0.0 type definitions |
| Account requirement | Your platform has onboarded to Financial Accounts. Without it, Stripe answers `invalid_request_error` ("Unrecognized request URL (GET: /v1/disclosures/...)"), which arrives through `@error` |
| Live demo | None: the demo account has not onboarded to Financial Accounts |
| Same disclosure, older name | [VueStripeTreasuryDisclosure](/api/components/stripe-treasury-disclosure) calls `createTreasuryDisclosure()` with the same options |

## Usage

Show the disclosure in the flow where a business opens its financial account on your platform:

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeFinancialAccountDisclosure
      :options="{ businessName: 'Rocket Rides', learnMoreLink: 'https://example.com/accounts' }"
      @load="disclosureShown = true"
    />
    <button :disabled="!disclosureShown" @click="openAccount">Open account</button>
  </VueStripeProvider>
</template>

<script setup>
import { ref } from 'vue'
import { VueStripeProvider, VueStripeFinancialAccountDisclosure } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const disclosureShown = ref(false)
const openAccount = () => fetch('/api/financial-accounts', { method: 'POST' })
</script>
```

Without `VueStripeProvider`, pass a Stripe instance or promise instead:

```vue
<script setup>
// The library re-exports Stripe.js' loadStripe
import { loadStripe, VueStripeFinancialAccountDisclosure } from '@vue-stripe/vue-stripe'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
</script>

<template>
  <VueStripeFinancialAccountDisclosure :stripe="stripePromise" />
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stripe` | `Stripe \| PromiseLike<Stripe \| null> \| null` | No | Stripe instance or a promise of one. Defaults to the surrounding `VueStripeProvider`'s; with neither, the component throws `VueStripeProviderError`. While it is `null` nothing is requested |
| `options` | `FinancialAccountDisclosureOptions` | No | How the disclosure names your business (below) |

### Options

| Option | Type | Description |
|--------|------|-------------|
| `businessName` | `string` | Your business name as the disclosure shows it. Stripe uses the name on your Stripe account when it is omitted |
| `learnMoreLink` | `string` | A link of yours with more about the financial accounts you offer |

New option values fetch the disclosure again; equal values from a re-render do not.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | - | The disclosure text is on the page (React `onLoad`) |
| `@error` | `StripeError \| { message: string }` | Stripe's error, or `{ message }` when the call throws (React `onError`) |

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Shown until the text arrives (default: "Loading disclosure...") |
| `#error` | `{ error: string }` | Shown instead of the text after an error |

## Exposed Properties

| Member | Type | Description |
|--------|------|-------------|
| `loading` | `Ref<boolean>` | `true` while the request is pending |
| `error` | `Ref<string \| null>` | Error message, or `null` |

## CSS classes

`vue-stripe-financial-account-disclosure` on the root, `-mount` on the element that receives Stripe's HTML, `-error` and `-loader` on the slot wrappers, plus the shared `vue-stripe-element*` classes from the package stylesheet.

## TypeScript

```ts
import type {
  FinancialAccountDisclosureOptions,
  DisclosureError
} from '@vue-stripe/vue-stripe'
```

When the loaded Stripe.js lacks `createFinancialAccountDisclosure`, `@error` gets `{ message: 'stripe.createFinancialAccountDisclosure() is not available in this Stripe.js version' }`.

## See Also

- [VueStripeTreasuryDisclosure](/api/components/stripe-treasury-disclosure)
- [VueStripeIssuingDisclosure](/api/components/stripe-issuing-disclosure): for card programs
- [VueStripeProvider](/api/components/stripe-provider)
