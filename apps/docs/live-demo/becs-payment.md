---
title: BECS Direct Debit Example
description: "Live demo of BECS Direct Debit in Vue: collect an Australian bank account with VueStripeAuBankAccountElement and confirm it in Stripe test mode."
---

# BECS Direct Debit Example

BECS (Bulk Electronic Clearing System) Direct Debit is Australia's primary direct debit payment system. This live demo shows the complete payment flow using the `VueStripeAuBankAccountElement` component.

<AuBankAccountPaymentExample />

::: warning Settlement Time
BECS Direct Debit payments don't confirm instantly like cards. They typically settle in 3-4 business days. You'll need to use webhooks to track the final payment status.
:::

::: tip See also
How-to guide: [Accept BECS Direct Debit](/guide/au-bank-account-element). Reference: [VueStripeAuBankAccountElement](/api/components/stripe-au-bank-account-element).
:::
