---
description: "useFinancialConnections reference: link bank accounts with Stripe Financial Connections and collect ACH Direct Debit accounts from a Vue app."
---

# useFinancialConnections

Collect bank accounts with [Stripe Financial Connections](https://docs.stripe.com/financial-connections) and the [ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit) bank account flows. Wraps four Stripe.js methods, each of which opens Stripe's modal and resolves when the customer finishes or closes it. [Accept ACH Direct Debit](/guide/ach-debit) walks through the payment flow:

| Method | Wraps Stripe.js | Resolves to |
|--------|-----------------|-------------|
| `collectFinancialConnectionsAccounts` | [docs](https://docs.stripe.com/js/financial_connections/collect_financial_connections_accounts) | `{ financialConnectionsSession }` |
| `collectBankAccountToken` | [docs](https://docs.stripe.com/js/financial_connections/collect_bank_account_token) | `{ financialConnectionsSession, token }` |
| `collectBankAccountForPayment` | [docs](https://docs.stripe.com/js/payment_intents/collect_bank_account_for_payment) | `{ paymentIntent }` |
| `collectBankAccountForSetup` | [docs](https://docs.stripe.com/js/setup_intents/collect_bank_account_for_setup) | `{ setupIntent }` |

Each method has the same name as the `stripe.*` method it wraps.

Must be called within a `<VueStripeProvider>` or an app using [`createVueStripe()`](/api/plugin). No `<VueStripeElements>` is needed. Create the Financial Connections Session, PaymentIntent or SetupIntent on your server and pass its client secret.

Stripe's Financial Connections flow needs `minimum-scale=1` in the page's viewport meta tag. Without it, opening the modal logs `[Stripe.js] The Financial Connections authentication flow requires "minimum-scale=1" to be set in your page's viewport meta tag.` The default templates of Vite, Vue CLI, Quasar and Nuxt leave it out. Set it in `index.html` (`public/index.html` with Vue CLI):

```html
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
```

In Nuxt, set it in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  app: { head: { viewport: 'width=device-width, initial-scale=1, minimum-scale=1' } }
})
```

::: tip Live demo
The [ACH Direct Debit demo](/live-demo/ach-debit) links a test bank account with `collectBankAccountForPayment()` and confirms with `useConfirmUsBankAccountPayment()`.
:::

## Usage

### Link financial accounts

```vue
<script setup>
import { useFinancialConnections } from '@vue-stripe/vue-stripe'

const { collectFinancialConnectionsAccounts, loading, error } = useFinancialConnections()

// clientSecret of a Financial Connections Session created on your server
const linkAccounts = async (clientSecret) => {
  const { financialConnectionsSession, error } = await collectFinancialConnectionsAccounts({
    clientSecret
  })
  if (error) return
  // An empty list means the customer closed the modal without linking an account
  console.log(financialConnectionsSession.accounts)
}
</script>

<template>
  <button :disabled="loading" @click="linkAccounts(sessionClientSecret)">Link your bank</button>
  <p v-if="error">{{ error }}</p>
</template>
```

### ACH Direct Debit payment

`collectBankAccountForPayment` attaches the collected bank account to the PaymentIntent. Confirm it afterwards, for example with [`usePaymentIntent`](/api/composables/use-payment-intent) or `stripe.confirmUsBankAccountPayment()`.

```ts
const { collectBankAccountForPayment } = useFinancialConnections()

const { paymentIntent, error } = await collectBankAccountForPayment({
  clientSecret: paymentIntentClientSecret,
  params: {
    payment_method_type: 'us_bank_account',
    payment_method_data: {
      billing_details: { name: 'Jenny Rosen', email: 'jenny@example.com' }
    }
  }
})

if (paymentIntent?.status === 'requires_confirmation') {
  // Show the mandate text, then confirm the PaymentIntent
}
```

`collectBankAccountForSetup` takes the same options with a SetupIntent client secret and resolves to `{ setupIntent }`.

### Bank account token

```ts
const { collectBankAccountToken } = useFinancialConnections()

const { token, financialConnectionsSession, error } = await collectBankAccountToken({
  clientSecret: sessionClientSecret
})
// token.id is a btok_... to add as the connected account's external account
```

Stripe issues the token only for the [Connect payouts flow](https://docs.stripe.com/financial-connections/connect-payouts): create the session with `account_holder[type]=account` and a US Custom connected account. For a session whose account holder is a customer, Stripe.js resolves with the session and `token: undefined`.

### Pre-collected consent

If you show and record the Financial Connections consent yourself, pass the evidence as `preCollectedConsent` (Stripe.js 9.17+). Every method accepts it. It requires a Stripe beta, and Stripe decides server-side whether to skip its consent pane.

```ts
await collectFinancialConnectionsAccounts({
  clientSecret,
  preCollectedConsent: {
    consent: 'fcconsent_...', // financial_connections.consent ID from your server
    collectedAt: 1760000000 // Unix seconds when the customer accepted
  }
})
```

## Return Value

```ts
interface UseFinancialConnectionsReturn {
  collectFinancialConnectionsAccounts: (
    options: CollectFinancialConnectionsAccountsOptions
  ) => Promise<CollectFinancialConnectionsAccountsResult>
  collectBankAccountForPayment: (
    options: CollectBankAccountForPaymentOptions
  ) => Promise<CollectBankAccountForPaymentResult>
  collectBankAccountForSetup: (
    options: CollectBankAccountForSetupOptions
  ) => Promise<CollectBankAccountForSetupResult>
  collectBankAccountToken: (
    options: CollectBankAccountTokenOptions
  ) => Promise<CollectBankAccountTokenResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `collectFinancialConnectionsAccounts` | `(options) => Promise<CollectFinancialConnectionsAccountsResult>` | Opens the Financial Connections modal for a session client secret. |
| `collectBankAccountForPayment` | `(options) => Promise<CollectBankAccountForPaymentResult>` | Collects a US bank account and attaches it to a PaymentIntent. |
| `collectBankAccountForSetup` | `(options) => Promise<CollectBankAccountForSetupResult>` | Collects a US bank account and attaches it to a SetupIntent. |
| `collectBankAccountToken` | `(options) => Promise<CollectBankAccountTokenResult>` | Opens the Financial Connections modal and returns a bank account token. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while any of the four calls is in progress (the modal is open), until the last of overlapping calls settles. |
| `error` | `Readonly<Ref<string \| null>>` | The error message of the last call, or `null`. Cleared when a new call starts. |

When Stripe.js is not available (the plugin's load failed, for example; a call made while it loads waits for it), or the Stripe call throws, the methods do not reject: they resolve to a `VueStripeErrorResult`, `{ error: { message } }` (e.g. `{ error: { message: 'Stripe not initialized' } }`), so one `if (result.error)` check covers every failure.

## Options

The option types are taken from the matching `Stripe` method, so they follow the installed `@stripe/stripe-js`:

```ts
type CollectFinancialConnectionsAccountsOptions = Parameters<
  Stripe['collectFinancialConnectionsAccounts']
>[0]
// { clientSecret: string; preCollectedConsent?: PreCollectedConsent }

type CollectBankAccountTokenOptions = Parameters<Stripe['collectBankAccountToken']>[0]
// { clientSecret: string; preCollectedConsent?: PreCollectedConsent }

type CollectBankAccountForPaymentOptions = Parameters<Stripe['collectBankAccountForPayment']>[0]
type CollectBankAccountForSetupOptions = Parameters<Stripe['collectBankAccountForSetup']>[0]
// { clientSecret: string; params: CollectBankAccountParams; expand?: string[];
//   preCollectedConsent?: PreCollectedConsent }
```

| Field | Type | Description |
|-------|------|-------------|
| `clientSecret` | `string` | Client secret of the Financial Connections Session, PaymentIntent or SetupIntent. |
| `params` | `CollectBankAccountParams` | Payment and setup only: `payment_method_type: 'us_bank_account'` plus `payment_method_data.billing_details` (name required, email recommended). |
| `expand` | `string[]` | Payment and setup only: response fields to expand. |
| `preCollectedConsent` | `{ consent: string; collectedAt: number }` | Consent evidence you collected yourself (beta, Stripe.js 9.17+). |

## TypeScript

```ts
import { useFinancialConnections } from '@vue-stripe/vue-stripe'
import type {
  CollectFinancialConnectionsAccountsOptions,
  CollectFinancialConnectionsAccountsResult
} from '@vue-stripe/vue-stripe'

// useLinkAccounts.ts: call useLinkAccounts() in a component's setup
export function useLinkAccounts() {
  const { collectFinancialConnectionsAccounts } = useFinancialConnections()

  const link = async (
    options: CollectFinancialConnectionsAccountsOptions
  ): Promise<CollectFinancialConnectionsAccountsResult> => {
    const result = await collectFinancialConnectionsAccounts(options)
    if (result.error) console.error(result.error.message)
    return result
  }

  return { link }
}
```

All result types are Stripe's result for that method widened with `VueStripeErrorResult`: `CollectFinancialConnectionsAccountsResult`, `CollectBankAccountForPaymentResult`, `CollectBankAccountForSetupResult` and `CollectBankAccountTokenResult`.

## See Also

- [Bank debit confirmers](/api/composables/confirm/bank-debits#useconfirmusbankaccountpayment) - Confirm the ACH payment after collecting the account
- [useVerifyMicrodepositsForPayment](/api/composables/use-verify-microdeposits-for-payment) - Verify a manually entered account
- [Payment methods that settle later](/guide/confirming-payments#payment-methods-that-settle-later)
- [Accept ACH Direct Debit](/guide/ach-debit) - Link the account, confirm, verify micro-deposits
- [Live demo](/live-demo/ach-debit)
