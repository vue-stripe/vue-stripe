---
title: Custom Checkout Example
description: Build your own checkout page on a Checkout Session with the Checkout Elements SDK
---

# Custom Checkout Example

A checkout page you lay out yourself, backed by a Checkout Session. The server creates the session with `ui_mode: 'elements'`, and Stripe keeps the line items, totals, taxes and currency on the session while you render the Payment Element and a billing Address Element.

<CustomCheckoutExample />

::: tip See also
How-to guide: [Build your own page on a Checkout Session](/guide/custom-checkout). Reference: [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider).
:::
