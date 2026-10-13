---
title: ACH Direct Debit Example
description: "Live demo of ACH Direct Debit in Vue: link a US bank account with Financial Connections and confirm with useConfirmUsBankAccountPayment in test mode."
---

# ACH Direct Debit Example

Pay from a US bank account. The server creates a PaymentIntent for `us_bank_account`; `collectBankAccountForPayment()` from `useFinancialConnections()` opens Stripe's Financial Connections modal, where the customer links an account, and `useConfirmUsBankAccountPayment()` confirms the payment once the customer accepts the mandate. No Elements group is needed: Stripe's modal collects the account.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product, then click Link bank account. In the test-mode modal, pick **Test (Non-OAuth)**, agree to the terms, choose the **Success** account and finish without saving to Link. ACH payments clear in a few business days, so the PaymentIntent ends in `processing`.

<AchDebitExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a PaymentIntent for `us_bank_account` in US dollars for the product's amount, and returns its client secret.
3. Only `VueStripeProvider` wraps the payment step. There is no Elements group, because Stripe's Financial Connections modal collects the bank account.
4. The name and email fields are pre-filled with `Jenny Rosen` and `jenny@example.com`. Link bank account calls `collectBankAccountForPayment()` from `useFinancialConnections()` with `payment_method_type: 'us_bank_account'` and those billing details. The modal links an account and attaches it to the PaymentIntent, which moves to `requires_confirmation`. Closing the modal leaves the PaymentIntent in `requires_payment_method`, and the demo says so.
5. The demo then shows the ACH mandate text with the amount. Pay calls `confirmUsBankAccountPayment(clientSecret)` from `useConfirmUsBankAccountPayment()`, which records the mandate acceptance and starts the debit.
6. The demo shows the PaymentIntent ID and its status, `processing`.

::: tip See also
How-to guide: [Accept ACH Direct Debit](/guide/ach-debit). Reference: [useFinancialConnections](/api/composables/use-financial-connections) and [useConfirmUsBankAccountPayment](/api/composables/confirm/bank-debits#useconfirmusbankaccountpayment).
:::
