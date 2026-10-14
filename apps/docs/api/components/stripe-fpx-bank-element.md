---
title: "VueStripeFpxBankElement removed in Vue Stripe 6"
description: "VueStripeFpxBankElement was removed in Vue Stripe 6 because Stripe removed the FPX Bank Element. Use VueStripePaymentElement to collect FPX."
canonical: /api/components/stripe-payment-element
noindex: true
search: false
---

# VueStripeFpxBankElement was removed

Stripe removed the standalone FPX Bank Element (`fpxBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeFpxBankElement`. This page was its Vue Stripe 5 reference.

- **Use [`VueStripePaymentElement`](/api/components/stripe-payment-element) instead.** The Payment Element collects FPX when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank.
- **Start an FPX redirect from your own button.** [`useConfirmFpxPayment`](/api/composables/confirm/redirects#useconfirmfpxpayment) wraps `stripe.confirmFpxPayment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
