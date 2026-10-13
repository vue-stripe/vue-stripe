---
title: BECS Direct Debit Example
description: "Live demo of BECS Direct Debit in Vue: collect an Australian bank account with VueStripeAuBankAccountElement and confirm it in Stripe test mode."
---

# BECS Direct Debit Example

BECS (Bulk Electronic Clearing System) Direct Debit is Australia's primary direct debit payment system. This live demo shows the complete payment flow using the `VueStripeAuBankAccountElement` component.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`. BECS Direct Debit needs an Australian Stripe account, and this demo's account is in the US, so choosing a product returns Stripe's `au_becs_debit is invalid` error; the demo stays as a working code reference. On an Australian test account, Stripe's test bank account is BSB `000000` with account number `000123456`.

<AuBankAccountPaymentExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a BECS Direct Debit PaymentIntent in Australian dollars for the product's amount. On this demo's US account, this is the step that fails.
3. `VueStripeElements` gets the client secret and wraps `VueStripeAuBankAccountElement` (with `iconStyle: 'solid'`), which collects the BSB and account number. Its `change` event reports `complete`, and the bank and branch names once Stripe recognizes the BSB; the demo shows them.
4. The Pay button needs a name, an email address and the Direct Debit Request mandate checkbox. The mandate text links Stripe's BECS service agreement.
5. The button gets the mounted element with `getElement('auBankAccount')` from `useStripeElements()` and calls `confirmAuBecsDebitPayment()` from `useConfirmAuBecsDebitPayment()` with `payment_method: { au_becs_debit: element, billing_details: { name, email } }`.
6. Stripe returns the PaymentIntent in `processing`, and the demo shows its ID.

::: warning Settlement Time
BECS Direct Debit payments don't confirm instantly like cards. They typically settle in 3-4 business days. You'll need to use webhooks to track the final payment status.
:::

::: tip See also
How-to guide: [Accept BECS Direct Debit](/guide/au-bank-account-element). Reference: [VueStripeAuBankAccountElement](/api/components/stripe-au-bank-account-element).
:::
