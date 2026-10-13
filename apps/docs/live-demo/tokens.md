---
title: "Tokens demo: ConfirmationToken, Token, Radar"
description: "Live demo of tokens in Vue: create a ConfirmationToken, a card Token and a Radar Session with useCreateConfirmationToken, useCreateToken, useRadarSession."
---

# Tokens Example

Turn what the customer entered into something your server can use, without confirming anything in the browser:

- **ConfirmationToken**: `useCreateConfirmationToken()` submits the Payment Element and creates a token; the server then creates and confirms the PaymentIntent with `confirmation_token` ([finalize payments on the server](https://docs.stripe.com/payments/finalize-payments-on-the-server)).
- **Token** (legacy): `useCreateToken()` creates a single-use card Token from the Card Element, for Charges and Connect integrations.
- **Radar Session**: `useRadarSession()` captures device signals for Radar when payment details are collected outside Stripe.js.

## Try the demo

The demo runs in Stripe test mode with the docs' test-mode key. Use the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Nothing is charged: each step only creates an object and shows its ID.

<TokensExample />

## How the demo works

One `VueStripeProvider` wraps three independent panels. None of them calls the demo backend.

1. **ConfirmationToken**: `VueStripeElements` gets `mode="payment"`, `:amount="1099"` and `currency="usd"` instead of an Intent, and holds `VueStripePaymentElement`. Create ConfirmationToken calls `createConfirmationToken({ params: { return_url } })` from `useCreateConfirmationToken()`, which runs `elements.submit()` first and then creates the token. The demo shows the token ID and the payment method type, brand and last four digits from `payment_method_preview`.
2. **Card Token**: a second `VueStripeElements` group holds `VueStripeCardElement`. Create Token calls `createToken(cardElement, { name: 'Jenny Rosen' })` from `useCreateToken()`, and the demo shows the Token ID with the card brand and last four digits.
3. **Radar Session**: Create Radar Session calls `createRadarSession()` from `useRadarSession()`, which only needs the Stripe instance. The demo shows the Radar Session ID.

A server would use these IDs: the ConfirmationToken as `confirmation_token` when it creates and confirms a PaymentIntent, the Token as the payment source of a charge, and the Radar Session as `radar_options.session`.

::: tip See also
How-to guide: [Confirm payments on your server](/guide/tokens). Reference: [useCreateConfirmationToken](/api/composables/use-create-confirmation-token), [useCreateToken](/api/composables/use-create-token) and [useRadarSession](/api/composables/use-radar-session).
:::
