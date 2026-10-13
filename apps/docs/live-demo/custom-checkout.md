---
title: Custom Checkout Example
description: "Live demo of a custom checkout page in Vue on a Stripe Checkout Session, with the Checkout Elements SDK, the Payment Element and an Address Element."
---

# Custom Checkout Example

A checkout page you lay out yourself, backed by a Checkout Session. The server creates the session with `ui_mode: 'elements'`, and Stripe keeps the line items, totals, taxes and currency on the session while you render the Payment Element and a billing Address Element.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, enter an email address, pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC, and fill in a billing address. The demo ends with the Checkout Session ID.

<CustomCheckoutExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a Checkout Session with `uiMode: 'elements'` and a return URL to this page. The demo passes the Promise of the client secret straight to the provider, so the form renders while the session is created.
3. `VueStripeProvider` loads Stripe.js, and `VueStripeCheckoutElementsProvider` starts the Checkout Elements SDK with the client secret and `adaptive-pricing="{ allowed: true }"`.
4. Inside it, the form calls `useCheckoutSession()` for the session: the Pay button shows the session's total. It renders an email field, `VueStripeCurrencySelectorElement` (only when Adaptive Pricing offers more than one currency), `VueStripePaymentElement` and `VueStripeAddressElement` in billing mode. The elements come from the Checkout context, not from `VueStripeElements`.
5. Pay calls `confirm({ email, redirect: 'if_required' })` from `useCheckoutSession()`. No return URL is passed, because the session already has one.
6. On success, the result carries the session, and the demo shows its ID.

Stripe keeps the line items, totals, tax and currency on the session; the page only lays them out.

::: tip See also
How-to guide: [Build your own page on a Checkout Session](/guide/custom-checkout). Reference: [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider).
:::
