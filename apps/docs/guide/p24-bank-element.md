---
title: "P24 Bank Element removed in Vue Stripe 6"
description: "Vue Stripe 6 has no P24 Bank Element: Stripe removed it. Collect P24 with the Payment Element, or confirm a P24 payment with useConfirmP24Payment."
canonical: /guide/payment-element
noindex: true
search: false
---

# The P24 Bank Element was removed

Stripe removed the standalone P24 Bank Element (`p24Bank`) from Stripe.js in its Clover release, so Vue Stripe 6 has no `VueStripeP24BankElement`. This page was its Vue Stripe 5 guide. Przelewy24 (P24) payments still work:

- **Collect P24 with the Payment Element.** It offers P24 when the PaymentIntent's currency and the customer's location fit, and it handles the redirect to the bank. Follow [Accept a payment (Payment Element)](/guide/payment-element).
- **Start a P24 redirect from your own button.** [`useConfirmP24Payment`](/api/composables/confirm/redirects#useconfirmp24payment) wraps `stripe.confirmP24Payment()`, which Stripe kept.
- **Upgrading from v5?** [Upgrade from v5 to v6](/guide/migration-v6#_3-replace-what-changed) lists every component that changed, and [Stripe.js versions and what v6 changed](/guide/stripe-js-versions#clover) explains why these elements are gone.
