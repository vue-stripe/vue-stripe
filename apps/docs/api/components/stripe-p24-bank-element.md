---
title: "VueStripeP24BankElement removed in Vue Stripe 6"
description: "VueStripeP24BankElement was removed in Vue Stripe 6 because Stripe removed the P24 Bank Element. Use VueStripePaymentElement to collect P24."
canonical: /api/components/stripe-payment-element
noindex: true
search: false
---

# VueStripeP24BankElement was removed

Stripe removed the standalone P24 Bank Element (`p24Bank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeP24BankElement`. This page was its Vue Stripe 5 reference.

- **Use [`VueStripePaymentElement`](/api/components/stripe-payment-element) instead.** The Payment Element collects Przelewy24 (P24) when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank.
- **Start a P24 redirect from your own button.** [`useConfirmP24Payment`](/api/composables/confirm/redirects#useconfirmp24payment) wraps `stripe.confirmP24Payment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
