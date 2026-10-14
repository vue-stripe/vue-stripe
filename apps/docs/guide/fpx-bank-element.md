---
title: "FPX Bank Element removed in Vue Stripe 6"
description: "Vue Stripe 6 has no FPX Bank Element: Stripe removed it. Collect FPX with the Payment Element, or confirm an FPX payment with useConfirmFpxPayment."
canonical: /guide/payment-element
noindex: true
search: false
---

# The FPX Bank Element was removed

Stripe removed the standalone FPX Bank Element (`fpxBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeFpxBankElement`. This page was its Vue Stripe 5 guide. FPX payments still work:

- **Collect FPX with the Payment Element.** It offers FPX when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank. Follow [Accept a payment (Payment Element)](/guide/payment-element).
- **Start an FPX redirect from your own button.** [`useConfirmFpxPayment`](/api/composables/confirm/redirects#useconfirmfpxpayment) wraps `stripe.confirmFpxPayment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
