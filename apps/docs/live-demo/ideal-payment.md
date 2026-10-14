---
title: "iDEAL Bank Element live demo removed"
description: "The iDEAL Bank Element live demo is gone in Vue Stripe 6 with the element itself. The Payment Element, which collects iDEAL now, has its own demo."
canonical: /live-demo/payment-element
noindex: true
search: false
---

# The iDEAL Bank Element demo was removed

Stripe removed the standalone iDEAL Bank Element (`idealBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeIdealBankElement`. This page was its Vue Stripe 5 live demo.

- **Try the [Payment Element live demo](/live-demo/payment-element).** The Payment Element collects iDEAL now, when the PaymentIntent's currency and the customer's location fit.
- **Read the guide.** [Accept a payment (Payment Element)](/guide/payment-element) sets it up step by step, and [`useConfirmIdealPayment`](/api/composables/confirm/redirects#useconfirmidealpayment) confirms an iDEAL payment from your own button.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
