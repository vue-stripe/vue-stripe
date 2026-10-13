---
title: Split Card Elements Example
description: "Live demo of Split Card Elements: separate card number, expiry and CVC fields in Vue, confirmed with a test card in Stripe test mode."
---

# Split Card Elements

Use separate elements for card number, expiry date, and CVC for full control over your payment form layout.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, then enter the test card `4242 4242 4242 4242`, any future expiry date and any CVC across the three fields. The demo ends with the PaymentIntent ID.

<SplitCardElementExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a PaymentIntent for that product's price and returns its client secret.
3. Inside one `VueStripeElements` group, the demo renders `VueStripeCardNumberElement`, `VueStripeCardExpiryElement` and `VueStripeCardCvcElement` in its own layout. Each emits `ready` and `change`; the demo shows each field's validation error under that field.
4. The Pay button is enabled once all three elements are ready and none reports an error.
5. The button gets the card number element with `getElement('cardNumber')` from `useStripeElements()` and calls `confirmCardPayment(clientSecret, { payment_method: { card } })` from `useConfirmCardPayment()`. Stripe.js reads the expiry date and CVC from the other two elements in the same group, and opens 3D Secure when the card requires it.
6. When the PaymentIntent status is `succeeded`, the demo shows the PaymentIntent ID.

::: tip See also
How-to guide: [Accept card payments with the Card Element](/guide/card-element). Reference: [Split Card Elements](/api/components/stripe-split-card-elements).
:::
