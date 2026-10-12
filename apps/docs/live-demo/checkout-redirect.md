---
title: Stripe Checkout (URL Redirect)
description: One-time payments by redirecting to the Stripe Checkout session URL
---

# Stripe Checkout (URL Redirect)

Accept one-time payments by redirecting customers to Stripe's hosted checkout page. The server creates the session and returns its URL; Stripe.js removed `redirectToCheckout()` in Clover (8.0), so the redirect is a plain URL change.

<CheckoutRedirectExample />

::: tip See Also
For implementation details, see the [Checkout Guide](/guide/checkout) and [API Reference](/api/components/stripe-checkout).
:::
