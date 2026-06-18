---
title: BECS Direct Debit Example
description: Accept BECS Direct Debit payments from customers in Australia
---

# BECS Direct Debit Example

BECS (Bulk Electronic Clearing System) Direct Debit is Australia's primary direct debit payment system. This live demo shows the complete payment flow using the `VueStripeAuBankAccountElement` component.

<AuBankAccountPaymentExample />

::: warning Settlement Time
BECS Direct Debit payments don't confirm instantly like cards. They typically settle in 3-4 business days. You'll need to use webhooks to track the final payment status.
:::

::: tip See Also
For implementation details, see the [AU Bank Account Element Guide](/guide/au-bank-account-element) and [API Reference](/api/components/stripe-au-bank-account-element).
:::
