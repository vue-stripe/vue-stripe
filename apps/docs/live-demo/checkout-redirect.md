---
title: Stripe Checkout (URL Redirect)
description: "Live demo of a one-time payment through hosted Stripe Checkout: the server creates a session and Vue redirects to its URL with VueStripeCheckout."
---

# Stripe Checkout (URL Redirect)

Accept one-time payments by redirecting customers to Stripe's hosted checkout page. The server creates the session and returns its URL; Stripe.js removed `redirectToCheckout()` in Clover (8.0), so the redirect is a plain URL change.

<CheckoutRedirectExample />

::: tip See also
How-to guide: [Redirect to Stripe Checkout](/guide/checkout). Reference: [VueStripeCheckout](/api/components/stripe-checkout).
:::
