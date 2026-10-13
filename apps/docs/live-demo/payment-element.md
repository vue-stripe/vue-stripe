---
title: Payment Element Example
description: "Live demo of VueStripePaymentElement: create a PaymentIntent and accept a one-time test payment in Vue with Stripe's Payment Element."
---

# Payment Element Example

The Payment Element is Stripe's recommended way to accept payments. It automatically adapts to show the best payment methods for your customer based on their location and the transaction currency.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, then pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. The demo ends with the PaymentIntent ID.

<PaymentElementExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a PaymentIntent for that product's price. The backend keeps the secret key and returns only the client secret.
3. The demo renders `VueStripeProvider`, which loads Stripe.js, then `VueStripeElements` with the client secret and `VueStripePaymentElement` inside it. Two indicators turn green when the Elements group and the Payment Element emit `ready`.
4. The Pay button is a child component of `VueStripeElements`, so it can call `usePaymentIntent()`. Its `confirmPayment()` runs `elements.submit()` to validate the form, then confirms the PaymentIntent with `redirect: 'if_required'`. Card payments stay on the page; payment methods that need a redirect return to this URL.
5. When the PaymentIntent status is `succeeded`, the demo shows the PaymentIntent ID. After a redirect, a banner reads the `redirect_status` parameter that Stripe adds to the return URL.

::: tip See also
How-to guide: [Accept a payment with the Payment Element](/guide/payment-element). Reference: [VueStripePaymentElement](/api/components/stripe-payment-element).
:::
