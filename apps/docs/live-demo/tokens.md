---
title: Tokens Example
description: Create a ConfirmationToken, a card Token and a Radar Session with useCreateConfirmationToken, useCreateToken and useRadarSession
---

# Tokens Example

Turn what the customer entered into something your server can use, without confirming anything in the browser:

- **ConfirmationToken**: `useCreateConfirmationToken()` submits the Payment Element and creates a token; the server then creates and confirms the PaymentIntent with `confirmation_token` ([finalize payments on the server](https://docs.stripe.com/payments/finalize-payments-on-the-server)).
- **Token** (legacy): `useCreateToken()` creates a single-use card Token from the Card Element, for Charges and Connect integrations.
- **Radar Session**: `useRadarSession()` captures device signals for Radar when payment details are collected outside Stripe.js.

Use the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Nothing is charged: each step only creates an object and shows its ID.

<TokensExample />

::: tip See also
How-to guide: [Confirm payments on your server](/guide/tokens). Reference: [useCreateConfirmationToken](/api/composables/use-create-confirmation-token), [useCreateToken](/api/composables/use-create-token) and [useRadarSession](/api/composables/use-radar-session).
:::
