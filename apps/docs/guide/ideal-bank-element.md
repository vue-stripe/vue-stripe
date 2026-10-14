---
title: "iDEAL Bank Element removed in Vue Stripe 6"
description: "Vue Stripe 6 has no iDEAL Bank Element: Stripe removed it. Collect iDEAL with the Payment Element, or confirm an iDEAL payment with useConfirmIdealPayment."
canonical: /guide/payment-element
noindex: true
search: false
---

# The iDEAL Bank Element was removed

Stripe removed the standalone iDEAL Bank Element (`idealBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeIdealBankElement`. This page was its Vue Stripe 5 guide. iDEAL payments still work:

- **Collect iDEAL with the Payment Element.** It offers iDEAL when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank. Follow [Accept a payment (Payment Element)](/guide/payment-element).
- **Start an iDEAL redirect from your own button.** [`useConfirmIdealPayment`](/api/composables/confirm/redirects#useconfirmidealpayment) wraps `stripe.confirmIdealPayment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
