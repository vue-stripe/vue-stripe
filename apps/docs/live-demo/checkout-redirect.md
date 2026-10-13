---
title: Stripe Checkout (URL Redirect)
description: "Live demo of a one-time payment through hosted Stripe Checkout: the server creates a session and Vue redirects to its URL with VueStripeCheckout."
---

# Stripe Checkout (URL Redirect)

Accept one-time payments by redirecting customers to Stripe's hosted checkout page. The server creates the session and returns its URL; Stripe.js removed `redirectToCheckout()` in Clover (8.0), so the redirect is a plain URL change.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, start Checkout, and pay on Stripe's hosted page with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Stripe sends you back to this page, where a banner confirms the payment.

<CheckoutRedirectExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend. Choosing one shows a summary and a toggle between two ways to redirect.
2. Both ways ask the backend to create a Checkout Session with `mode: 'payment'` for the product's price. The success and cancel URLs point back to this page with `?result=success` or `?result=cancel`. The backend returns the session ID and its URL.
3. **VueStripeCheckout Component**: Create Checkout Session creates the session, then `VueStripeCheckout` renders a button for its `session-url`. Clicking the button emits `checkout` and sends the browser to the URL. Errors arrive through `@error`.
4. **Direct URL Redirect**: one click creates the session and calls `redirectToUrl(url)` from `useStripeCheckout()`, which needs no provider and no component.
5. The customer pays on Stripe's page, and Stripe redirects to the success URL. A banner on this page reads `?result=success` (or `?result=cancel` after canceling).

The redirect does not prove that the payment succeeded. A server confirms the result from Stripe, for example with the `checkout.session.completed` webhook.

::: tip See also
How-to guide: [Redirect to Stripe Checkout](/guide/checkout). Reference: [VueStripeCheckout](/api/components/stripe-checkout).
:::
