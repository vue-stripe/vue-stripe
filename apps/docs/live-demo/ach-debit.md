---
title: ACH Direct Debit Example
description: Link a US bank account with Financial Connections and confirm an ACH Direct Debit payment with useFinancialConnections and useConfirmUsBankAccountPayment
---

# ACH Direct Debit Example

Pay from a US bank account. The server creates a PaymentIntent for `us_bank_account`; `collectBankAccountForPayment()` from `useFinancialConnections()` opens Stripe's Financial Connections modal, where the customer links an account, and `useConfirmUsBankAccountPayment()` confirms the payment once the customer accepts the mandate. No Elements group is needed: Stripe's modal collects the account.

In the test-mode modal, pick **Test (Non-OAuth)**, agree to the terms, choose the **Success** account and finish without saving to Link. ACH payments clear in a few business days, so the PaymentIntent ends in `processing`.

<AchDebitExample />

::: tip See Also
For implementation details, see [useFinancialConnections](/api/composables/use-financial-connections) and [useConfirmUsBankAccountPayment](/api/composables/confirm/bank-debits#useconfirmusbankaccountpayment).
:::
