---
title: Embedded Checkout Example
description: "Live demo of VueStripeEmbeddedCheckout: Stripe's prebuilt Checkout page embedded in a Vue page and paid with a test card in Stripe test mode."
---

# Embedded Checkout Example

Stripe's prebuilt Checkout page inside this page. The server creates a Checkout Session with `ui_mode: 'embedded_page'`, and `VueStripeEmbeddedCheckout` mounts it with `stripe.createEmbeddedCheckoutPage()`. Stripe renders the line items, totals and payment form in an iframe; after payment it redirects back here.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product; Stripe's Checkout page loads in a frame below. Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

<EmbeddedCheckoutExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product renders `VueStripeEmbeddedCheckout` inside `VueStripeProvider`, with a `fetch-client-secret` function.
3. Stripe calls that function when it creates the page. The function asks the backend to create a Checkout Session with `uiMode: 'embedded_page'` and a return URL to this page that carries `session_id={CHECKOUT_SESSION_ID}`, and returns the session's client secret.
4. Stripe renders the line items, the total and the payment form in an iframe. The component re-emits Stripe's analytics events through `@analytics`, and the demo lists their names under the frame.
5. After payment, Stripe sends the browser to the return URL. On load, the demo reads `session_id` from the URL and shows the Checkout Session ID. It also listens to `@complete`, which moves to the same step when the session completes without a redirect.
6. If the session cannot be created, `@error` carries the message and the demo shows it.

::: tip See also
How-to guide: [Embed Stripe Checkout](/guide/embedded-checkout). Reference: [VueStripeEmbeddedCheckout](/api/components/stripe-embedded-checkout).
:::
