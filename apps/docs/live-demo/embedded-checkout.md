---
title: Embedded Checkout Example
description: Stripe's prebuilt Checkout page embedded in your site with VueStripeEmbeddedCheckout
---

# Embedded Checkout Example

Stripe's prebuilt Checkout page inside this page. The server creates a Checkout Session with `ui_mode: 'embedded_page'`, and `VueStripeEmbeddedCheckout` mounts it with `stripe.createEmbeddedCheckoutPage()`. Stripe renders the line items, totals and payment form in an iframe; after payment it redirects back here.

Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

<EmbeddedCheckoutExample />

::: tip See also
How-to guide: [Embed Stripe Checkout](/guide/embedded-checkout). Reference: [VueStripeEmbeddedCheckout](/api/components/stripe-embedded-checkout).
:::
