---
title: "VueStripeIdealBankElement removed in Vue Stripe 6"
description: "VueStripeIdealBankElement was removed in Vue Stripe 6 because Stripe removed the iDEAL Bank Element. Use VueStripePaymentElement to collect iDEAL."
canonical: /api/components/stripe-payment-element
noindex: true
search: false
---

# VueStripeIdealBankElement was removed

Stripe removed the standalone iDEAL Bank Element (`idealBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeIdealBankElement`. This page was its Vue Stripe 5 reference.

- **Use [`VueStripePaymentElement`](/api/components/stripe-payment-element) instead.** The Payment Element collects iDEAL when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank.
- **Start an iDEAL redirect from your own button.** [`useConfirmIdealPayment`](/api/composables/confirm/redirects#useconfirmidealpayment) wraps `stripe.confirmIdealPayment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
