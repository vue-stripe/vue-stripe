---
title: "EPS Bank Element removed in Vue Stripe 6"
description: "Vue Stripe 6 has no EPS Bank Element: Stripe removed it. Collect EPS with the Payment Element, or confirm an EPS payment with useConfirmEpsPayment."
canonical: /guide/payment-element
noindex: true
search: false
---

# The EPS Bank Element was removed

Stripe removed the standalone EPS Bank Element (`epsBank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeEpsBankElement`. This page was its Vue Stripe 5 guide. EPS payments still work:

- **Collect EPS with the Payment Element.** It offers EPS when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank. Follow [Accept a payment (Payment Element)](/guide/payment-element).
- **Start an EPS redirect from your own button.** [`useConfirmEpsPayment`](/api/composables/confirm/redirects#useconfirmepspayment) wraps `stripe.confirmEpsPayment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
