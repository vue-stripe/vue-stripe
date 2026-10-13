---
title: Create Payment Method Example
description: "Live demo of useCreatePaymentMethod: turn card details into a reusable Stripe PaymentMethod in Vue without confirming a payment."
---

# Create Payment Method

Tokenize card details into a reusable `PaymentMethod` — without confirming a payment — using the `useCreatePaymentMethod` composable. Useful for collecting a card now and charging it later server-side.

## Try the demo

The demo uses the docs' Stripe test-mode key and takes no payment. Enter the test card `4242 4242 4242 4242`, any future expiry date and any CVC, then click Create Payment Method. The demo shows the new PaymentMethod ID.

<CreatePaymentMethodExample />

## How the demo works

1. Nothing is sent to the demo backend. `VueStripeProvider` loads Stripe.js and `VueStripeElements` creates an Elements group without an Intent.
2. `VueStripeCardElement` mounts and emits `ready` with the element instance. The demo keeps that instance and enables the button.
3. The button calls `createPaymentMethod({ type: 'card', card })` from `useCreatePaymentMethod()`. Stripe.js sends the card details from its iframe to Stripe and returns a PaymentMethod; the card number never reaches the page's own code.
4. The demo shows the PaymentMethod ID, or Stripe's error message, for example for an incomplete card number. While the request runs, the composable's `loading` keeps the button disabled.

A server would then attach the PaymentMethod to a Customer or use it in a PaymentIntent. This demo stops after creating it.

::: tip See also
How-to guide: [Confirm payments on your server](/guide/tokens). Reference: [useCreatePaymentMethod](/api/composables/use-create-payment-method).
:::
