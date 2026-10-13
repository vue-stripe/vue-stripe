---
title: Checkout Form Example
description: "Live demo of Stripe's complete Checkout Form (beta) in Vue with VueStripeCheckoutFormProvider, VueStripeCheckoutForm and useCheckoutForm."
---

# Checkout Form Example

Stripe's complete checkout form as one element on this page. The server creates a Checkout Session with `ui_mode: 'form'`; `VueStripeCheckoutFormProvider` runs the Checkout Form SDK, `VueStripeCheckoutForm` renders the contact details, payment method, total and Pay button, and `confirm()` from `useCheckoutForm()` completes the payment when the form emits `@confirm`.

::: warning Beta
The Checkout Form is a Stripe beta. This demo runs on a Stripe account that has access; your account needs it too, otherwise the provider's `#error` slot shows Stripe's error instead of the form.
:::

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, then fill in the form. Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. The demo ends with the Checkout Session ID.

<CheckoutFormExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a Checkout Session with `uiMode: 'form'` and a return URL to this page. The demo passes the Promise of the client secret straight to `VueStripeCheckoutFormProvider`.
3. The provider runs the Checkout Form SDK. Inside it, `VueStripeCheckoutForm` (with `layout: 'expanded'`) renders the contact details, payment method, total and its own Pay button and wallet buttons. Its `change` event reports whether the form is complete; the demo shows that next to the session total from `useCheckoutForm()`.
4. The Pay button and the wallet buttons make the form emit `confirm` with an event. The handler passes that event to `confirm({ formConfirmEvent: event, redirect: 'if_required' })` from `useCheckoutForm()`.
5. On success, the result carries the session, and the demo shows its ID. A Stripe error is shown under the form instead.
6. Payment methods that need a redirect return to this page with `?result=success`, and a banner shows the result.

::: tip See also
How-to guide: [Add the Checkout Form](/guide/checkout-form). Reference: [VueStripeCheckoutForm](/api/components/stripe-checkout-form) and [useCheckoutForm](/api/composables/use-checkout-form).
:::
