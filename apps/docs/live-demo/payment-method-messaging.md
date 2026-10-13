---
title: Payment Method Messaging (BNPL) Example
description: "Live demo of VueStripePaymentMethodMessagingElement: Affirm, Klarna and Afterpay / Clearpay installment messaging for an amount in Vue."
---

# Payment Method Messaging (BNPL)

Show customers that **Buy Now, Pay Later** options — Affirm, Klarna, Afterpay/Clearpay — are available, with installment pricing for the current amount. This element is display-only; it doesn't collect payment.

## Try the demo

The demo uses the docs' Stripe test-mode key and takes no payment. Change the amount, currency, country and providers, and the message updates. Some combinations show nothing when no provider qualifies.

<PaymentMethodMessagingExample />

## How the demo works

1. Nothing is sent to the demo backend. `VueStripeElements` without a client secret wraps `VueStripePaymentMethodMessagingElement`.
2. The controls build the element's options: `amount` in the smallest currency unit (the dollar amount times 100), `currency` in upper case (`USD`, `GBP` or `EUR`), `countryCode` (`US`, `GB` or `DE`) and `paymentMethodTypes` from the provider toggles (`affirm`, `klarna`, `afterpay_clearpay`).
3. The options are one computed object. When a control changes it, the component calls `update()` on the mounted element with the new options instead of mounting a new element.
4. Stripe picks the message from the amount, currency, country and the providers enabled on the account. When no provider qualifies, the element renders nothing.
5. The element emits `ready` once it is mounted.

The element only displays messaging. Collecting the payment happens elsewhere, for example in the Payment Element.

::: tip See also
How-to guide: [Show buy-now-pay-later messaging](/guide/payment-method-messaging). Reference: [VueStripePaymentMethodMessagingElement](/api/components/stripe-payment-method-messaging-element).
:::
