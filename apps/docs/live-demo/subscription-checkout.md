---
title: Subscription Checkout Example
description: "Live demo of a Stripe subscription in Vue through hosted Stripe Checkout: choose a price, redirect to Checkout and pay with a test card."
---

# Subscription via Stripe Checkout

Stripe Checkout is a hosted payment page that handles the entire subscription flow. This is the quickest way to accept subscription payments with a professionally designed, high-conversion checkout experience.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a plan, click Subscribe with Stripe Checkout, and pay on Stripe's hosted page with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Stripe sends you back to this page, where a banner confirms the result.

<SubscriptionCheckoutExample />

## How the demo works

1. The product step loads the demo account's recurring prices only, each with its billing interval.
2. Subscribe asks the backend to create a Checkout Session with `mode: 'subscription'` for the chosen price. The success and cancel URLs point back to this page with `?result=success` or `?result=cancel`.
3. The backend returns the session URL, and the demo calls `redirectToUrl(url)` from `useStripeCheckout()`. The demo renders no `VueStripeProvider`: hosted Checkout runs on Stripe's page, so the redirect needs no Stripe.js instance.
4. On Stripe's page the customer enters an email address and a card. Stripe creates the Customer and the subscription and charges the first invoice.
5. Stripe redirects to the success URL, and a banner on this page reads `?result=success`.

The redirect does not prove that the subscription is paid. A server learns that from Stripe's webhooks, for example `checkout.session.completed`.

::: tip See also
How-to guide: [Start a subscription](/guide/subscriptions#option-a-stripe-checkout). Reference: [VueStripeCheckout](/api/components/stripe-checkout).
:::
