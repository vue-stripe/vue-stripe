---
title: Stripe.js Coverage
description: "Every Stripe.js 10 element and method next to the Vue Stripe component or composable that wraps it, with links to guides, reference and demos."
aside: false
pageClass: coverage-page
---

# Stripe.js Coverage

Every element and method in Stripe.js 10 (Endive), next to the Vue Stripe component or composable that wraps it. Search for a Stripe.js method, an element or an export, then jump to its guide, API reference or live demo.

<StripeCoverage />

## Not yet verified end to end

Every component and composable above has unit tests, and the payment flows were run end to end against Stripe's test API in Vue 3, Vue 2.7, Nuxt, Quasar, Laravel and custom SSR apps. A few features need Stripe access that the test account does not have, or a step that cannot be automated. For these, the tests confirm the documented behavior without access, not a complete flow:

| Feature | Why it is not verified | What is verified |
|---|---|---|
| [Terms Element](/api/components/stripe-terms-element) | Stripe beta; the test account has no access | The documented `@loaderror` and `#error` without access |
| [Link Signup Element](/api/components/stripe-link-signup-element) | Stripe beta; the test account has no access | The documented errors without the beta flag or access |
| [Checkout Form](/api/components/stripe-checkout-form), `compact` layout | Stripe private preview | The `expanded` layout, end to end |
| [Issuing Elements](/api/components/stripe-issuing-elements) | The test account has no Stripe Issuing | The documented errors without Issuing |
| [Issuing disclosure](/api/components/stripe-issuing-disclosure) | The test account has not onboarded to Issuing | The documented `invalid_request_error` through `@error` |
| [Financial Account and Treasury disclosures](/api/components/stripe-financial-account-disclosure) | The test account has not onboarded to Financial Accounts | The documented `invalid_request_error` through `@error` |
| [Klarna](/guide/testing#redirects-qr-codes-bnpl-and-vouchers) | Klarna's test site asks for a phone number and a one-time code, which the browser tests cannot complete | The Payment Element tab, the confirmer and the redirect to Klarna |

If you use one of these and something does not work, [open an issue](https://github.com/vue-stripe/vue-stripe/issues/new/choose).
