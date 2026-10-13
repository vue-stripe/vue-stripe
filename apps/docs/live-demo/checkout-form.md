---
title: Checkout Form Example
description: "Live demo of Stripe's complete Checkout Form (beta) in Vue with VueStripeCheckoutFormProvider, VueStripeCheckoutForm and useCheckoutForm."
---

# Checkout Form Example

Stripe's complete checkout form as one element on this page. The server creates a Checkout Session with `ui_mode: 'form'`; `VueStripeCheckoutFormProvider` runs the Checkout Form SDK, `VueStripeCheckoutForm` renders the contact details, payment method, total and Pay button, and `confirm()` from `useCheckoutForm()` completes the payment when the form emits `@confirm`.

Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

::: warning Beta
The Checkout Form is a Stripe beta. This demo runs on a Stripe account that has access; your account needs it too, otherwise the provider's `#error` slot shows Stripe's error instead of the form.
:::

<CheckoutFormExample />

::: tip See also
How-to guide: [Add the Checkout Form](/guide/checkout-form). Reference: [VueStripeCheckoutForm](/api/components/stripe-checkout-form) and [useCheckoutForm](/api/composables/use-checkout-form).
:::
