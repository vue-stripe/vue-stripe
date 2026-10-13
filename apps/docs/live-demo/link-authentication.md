---
title: Link Authentication Example
description: "Live demo of VueStripeLinkAuthenticationElement: collect an email and let returning Stripe Link customers pay with saved details in Vue."
---

# Link Authentication

Enable faster checkout with Stripe Link. The Link Authentication Element collects customer email and enables one-click payment for returning customers.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, enter any email address, then pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. The demo ends with the PaymentIntent ID.

<LinkAuthenticationExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a PaymentIntent for that product's price and returns its client secret.
3. One `VueStripeElements` group holds `VueStripeLinkAuthenticationElement` above `VueStripePaymentElement`. Because both elements share the group, the email entered in the first one reaches the Payment Element, and when the email belongs to a Link customer, Stripe offers that customer's saved payment details.
4. The Link Authentication Element's `change` event carries the email (`event.value.email`). The demo shows it under the field.
5. The Pay button calls `confirmPayment()` from `usePaymentIntent()`. It runs `elements.submit()`, then confirms the PaymentIntent with `redirect: 'if_required'`.
6. When the PaymentIntent status is `succeeded`, the demo shows the PaymentIntent ID.

::: tip See also
How-to guide: [Add Link to checkout](/guide/link-authentication). Reference: [VueStripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element).
:::
