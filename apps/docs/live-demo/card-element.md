---
title: Card Element Example
description: "Live demo of VueStripeCardElement: accept a test card payment in Vue with Stripe's single-field Card Element and useConfirmCardPayment."
---

# Card Element

Accept card payments using the single-field Card Element. This is a legacy element that combines card number, expiry, and CVC into one input.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, then type the test card `4242 4242 4242 4242`, any future expiry date and any CVC into the one card field. The demo ends with the PaymentIntent ID.

<CardElementExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a PaymentIntent for that product's price and returns its client secret.
3. Inside `VueStripeProvider` and `VueStripeElements`, `VueStripeCardElement` renders one field for the card number, expiry date and CVC. Its `change` event carries validation errors, which the demo shows under the field. The Pay button stays disabled until the element is ready and has no error.
4. The Pay button gets the mounted Card Element with `getElement('card')` from `useStripeElements()`, then calls `confirmCardPayment(clientSecret, { payment_method: { card } })` from `useConfirmCardPayment()`. Stripe.js opens 3D Secure in a modal when the card requires it.
5. When the PaymentIntent status is `succeeded`, the demo shows the PaymentIntent ID.

The Card Element accepts cards only. The [Payment Element demo](/live-demo/payment-element) shows the element Stripe recommends for new integrations.

::: tip See also
How-to guide: [Accept card payments with the Card Element](/guide/card-element). Reference: [VueStripeCardElement](/api/components/stripe-card-element).
:::
