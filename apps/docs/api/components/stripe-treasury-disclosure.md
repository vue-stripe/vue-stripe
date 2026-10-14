---
description: "VueStripeTreasuryDisclosure reference: render the legal disclosure Stripe requires for Treasury financial accounts in a Vue app, via createTreasuryDisclosure."
canonical: /api/components/stripe-financial-account-disclosure
---

# VueStripeTreasuryDisclosure

The financial account disclosure under the product's former name, Stripe Treasury. It calls `stripe.createTreasuryDisclosure(options)` where [VueStripeFinancialAccountDisclosure](/api/components/stripe-financial-account-disclosure) calls `stripe.createFinancialAccountDisclosure(options)`; the options, events, slots and exposed members are the same, so that page is the full reference. It is the Vue port of React Stripe.js 7's `TreasuryDisclosure`, which React Stripe.js documents with the same options as `FinancialAccountDisclosure`.

::: info Not yet verified end to end
Vue Stripe's tests and dogfood runs use a Stripe account without Financial Accounts (formerly Treasury). They confirm what happens without access, as described on this page, but not a complete flow with access. See [what is not yet verified](/coverage#not-yet-verified-end-to-end), and [open an issue](https://github.com/vue-stripe/vue-stripe/issues/new/choose) if something does not work for you.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeTreasuryDisclosure :options="{ businessName: 'Rocket Rides' }" />
  </VueStripeProvider>
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stripe` | `Stripe \| PromiseLike<Stripe \| null> \| null` | No | As on VueStripeFinancialAccountDisclosure |
| `options` | `TreasuryDisclosureOptions` | No | `businessName` and `learnMoreLink`, as on VueStripeFinancialAccountDisclosure |

## Events

`@load` and `@error`, with the same payloads as VueStripeFinancialAccountDisclosure. The `#loading` and `#error` slots are the same too.

## Exposed Properties

| Member | Type | Description |
|--------|------|-------------|
| `loading` | `Ref<boolean>` | `true` while the request is pending |
| `error` | `Ref<string \| null>` | Error message, or `null` |

The root class is `vue-stripe-treasury-disclosure`. Types: `TreasuryDisclosureOptions`, `DisclosureError`. Without `stripe.createTreasuryDisclosure` in the loaded Stripe.js, `@error` gets `{ message: 'stripe.createTreasuryDisclosure() is not available in this Stripe.js version' }`.
