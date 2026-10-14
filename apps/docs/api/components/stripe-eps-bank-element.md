---
title: "VueStripeEpsBankElement removed in Vue Stripe 6"
description: "VueStripeEpsBankElement was removed in Vue Stripe 6 because Stripe removed the EPS Bank Element. Use VueStripePaymentElement to collect EPS."
canonical: /api/components/stripe-payment-element
noindex: true
search: false
---

# VueStripeEpsBankElement was removed

Stripe removed the standalone EPS Bank Element (`epsBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeEpsBankElement`. This page was its Vue Stripe 5 reference.

- **Use [`VueStripePaymentElement`](/api/components/stripe-payment-element) instead.** The Payment Element collects EPS when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank.
- **Start an EPS redirect from your own button.** [`useConfirmEpsPayment`](/api/composables/confirm/redirects#useconfirmepspayment) wraps `stripe.confirmEpsPayment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
