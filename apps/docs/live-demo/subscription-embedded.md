---
title: Embedded Subscription Example
description: "Live demo of a Stripe subscription in Vue with the Payment Element on your own page, confirmed with a test card in Stripe test mode."
---

# Embedded Subscription Elements

Keep customers on your site throughout the entire subscription flow using embedded Stripe Elements. This gives you full control over the checkout experience while maintaining a seamless branded experience.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a plan, enter an email address, then pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. The demo ends with the subscription ID.

<SubscriptionEmbeddedExample />

## How the demo works

1. The product step loads the demo account's recurring prices only, each with its billing interval.
2. After the email step, the backend creates a Customer with that email and a subscription to the chosen price. It returns the subscription ID and the client secret of the first invoice's payment.
3. If the backend returns no client secret because nothing is due now (for example during a trial), the demo goes straight to the last step.
4. Otherwise `VueStripeElements` gets the client secret and renders `VueStripePaymentElement` on this page.
5. The Subscribe button calls `confirmPayment()` from `usePaymentIntent()`. It runs `elements.submit()`, then confirms the payment with `redirect: 'if_required'`. Paying the first invoice makes the subscription active.
6. The demo shows the subscription ID.

The customer stays on this page for the whole flow. The [Stripe Checkout subscription demo](/live-demo/subscription-checkout) shows the hosted alternative.

::: tip See also
How-to guide: [Start a subscription](/guide/subscriptions#option-b-the-payment-element). For the hosted alternative, try the [Stripe Checkout subscription demo](/live-demo/subscription-checkout).
:::
