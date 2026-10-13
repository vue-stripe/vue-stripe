---
description: "Overview of the Vue Stripe documentation: tutorials, how-to guides, reference and explanation, and which section to start with for your task."
---

# Documentation overview

The Vue Stripe documentation has four sections. Each one serves a different need, so start with the one that matches what you are doing right now.

## Tutorials

Lessons that take you from an empty folder to a working result, one step at a time. Start here if you have not used Vue Stripe before: [Take your first test payment](/guide/first-payment).

## How-to guides

Steps for a specific goal, such as accepting SEPA Direct Debit or embedding Stripe Checkout. They assume Vue Stripe is installed and you know what you want to build. The [index below](#i-want-to) lists them by goal.

## Reference

The props, events, slots, exposed members and return values of every component, composable and type. Open the [reference overview](/api/), or look up a Stripe.js method in [Stripe.js coverage](/coverage) to find the export that wraps it.

## Explanation

Background on how Vue Stripe and Stripe fit together, and why. Read these when you want to understand a choice rather than make it work:

- [About Vue Stripe](/guide/introduction)
- [How Vue Stripe works](/guide/architecture)
- [Choosing an integration](/guide/approaches)
- [Payment objects: Intents, Sessions, tokens](/guide/payment-objects)
- [How confirming works](/guide/confirming-payments)
- [How Stripe.js is loaded](/guide/stripe-js-loading)
- [Stripe.js versions and what v6 changed](/guide/stripe-js-versions)
- [What runs where: keys and PCI](/guide/security)

## I want to...

### Set up

- [Install and set up](/guide/installation) Vue Stripe in a Vite, Vue CLI, Quasar or Laravel app
- [Use Vue Stripe on Vue 2.7](/guide/vue-2)
- [Use Vue Stripe with Nuxt and SSR](/guide/ssr), including Quasar SSR and VitePress
- [Provide Stripe app-wide](/guide/plugin) with the `createVueStripe` plugin
- [Upgrade from v5 to v6](/guide/migration-v6)

### Accept payments with Elements

- [Accept a payment](/guide/payment-element) with the Payment Element, which offers cards, wallets, bank debits and local methods
- [Collect payment details before creating an Intent](/guide/deferred-intent)
- [Add Apple Pay, Google Pay and Link](/guide/express-checkout) buttons
- [Add Link to checkout](/guide/link-authentication) so returning customers pay with saved details
- [Collect a shipping or billing address](/guide/address-element)
- [Accept card payments](/guide/card-element) with the Card Element
- [Show buy-now-pay-later messaging](/guide/payment-method-messaging) next to a price
- [Confirm payments on your server](/guide/tokens) with a ConfirmationToken, or create a PaymentMethod or Token
- [Handle errors and declines](/guide/error-handling)

### Accept bank debits

- [Accept SEPA Direct Debit](/guide/iban-element) with an IBAN
- [Accept BECS Direct Debit](/guide/au-bank-account-element) from Australian bank accounts
- [Accept ACH Direct Debit](/guide/ach-debit) from US bank accounts

### Use Stripe Checkout

- [Redirect to Stripe Checkout](/guide/checkout), the page Stripe hosts
- [Embed Stripe Checkout](/guide/embedded-checkout) in your own page
- [Build your own page on a Checkout Session](/guide/custom-checkout) with Elements
- [Add the Checkout Form](/guide/checkout-form) (beta), Stripe's whole checkout form as one element

### Save cards and bill repeatedly

- [Save a payment method for later](/guide/setup-intent)
- [Start a subscription](/guide/subscriptions)
- [Embed a pricing table](/guide/pricing-table)

### Customize, test and run

- [Style elements](/guide/styling)
- [Test your integration](/guide/testing) with test cards, IBANs and bank accounts
- [Fulfil orders with webhooks](/guide/webhooks)
- [Troubleshoot common problems](/guide/troubleshooting)

### Beyond payments

- [Display issued card details](/guide/issuing) to Stripe Issuing cardholders
- [Verify a customer's identity](/guide/identity)

## Live demos

The [live demos](/live-demo/) run each integration in test mode, so you can see how it behaves before you build it. Report problems on [GitHub](https://github.com/vue-stripe/vue-stripe/issues).
