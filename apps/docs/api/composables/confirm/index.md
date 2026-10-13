---
description: "Method confirmers: a Vue composable for each of the 46 Stripe.js confirm methods, with loading and error refs, and when to use them over usePaymentIntent."
---

# Method confirmers

Stripe.js has a confirm method for each payment method, such as `stripe.confirmCardPayment()` or `stripe.confirmSepaDebitSetup()`. Vue Stripe wraps every one of them, 46 in Stripe.js 10, in a composable named after it: `useConfirmCardPayment`, `useConfirmSepaDebitSetup`, and so on. Call them inside a `VueStripeProvider`; they do not need `VueStripeElements`, but components that render the Card, IBAN or BECS element do.

With the [Payment Element](/api/components/stripe-payment-element), confirm with [`usePaymentIntent`](/api/composables/use-payment-intent) or [`useSetupIntent`](/api/composables/use-setup-intent) instead. [How confirming works](/guide/confirming-payments#which-composable-confirms) explains which composable fits which flow. Some payment methods must be enabled on your Stripe account, or are offered only in some countries or currencies; [What each method needs](#what-each-method-needs) lists the currency and fields each confirmer requires, and each family page links Stripe's guide for the method.

## Usage

```vue
<script setup lang="ts">
import { useConfirmCardPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmCardPayment, loading, error } = useConfirmCardPayment()

const pay = async (clientSecret: string) => {
  const { paymentIntent } = await confirmCardPayment(clientSecret, { payment_method: 'pm_123' })
  return paymentIntent?.status
}
</script>

<template>
  <button :disabled="loading" @click="pay(props.clientSecret)">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Families

| Page | Composables | Includes |
|------|-------------|----------|
| [Cards](/api/composables/confirm/cards) | 2 | `useConfirmCardPayment`, `useConfirmCardSetup` |
| [Bank debits](/api/composables/confirm/bank-debits) | 9 | `useConfirmAcssDebitPayment`, `useConfirmAcssDebitSetup`, `useConfirmAuBecsDebitPayment`, ... |
| [Redirects and bank transfers](/api/composables/confirm/redirects) | 13 | `useConfirmBancontactPayment`, `useConfirmBancontactSetup`, `useConfirmEpsPayment`, ... |
| [Wallets](/api/composables/confirm/wallets) | 15 | `useConfirmAlipayPayment`, `useConfirmAmazonPaySetup`, `useConfirmBlikPayment`, ... |
| [Buy now, pay later](/api/composables/confirm/bnpl) | 4 | `useConfirmAffirmPayment`, `useConfirmAfterpayClearpayPayment`, `useConfirmBilliePayment`, ... |
| [Vouchers](/api/composables/confirm/vouchers) | 3 | `useConfirmBoletoPayment`, `useConfirmKonbiniPayment`, `useConfirmOxxoPayment` |

## What each method needs

The composables pass your arguments to Stripe.js unchanged, but Stripe accepts a confirm only when the Intent and the `data` fit the method. Three rules cover most failures:

- **Pass `payment_method`.** With only `{ return_url }`, most methods fail with `payment_intent_incompatible_payment_method` ("A payment method of type cashapp was expected to be present, but this PaymentIntent does not have a payment method and none was provided"), even where Stripe's own reference shows that form. Pass `payment_method: {}`, with the billing details below. For iDEAL, BLIK, FPX, SEPA Debit and Bacs, Stripe.js throws "Missing value for confirmIdealPayment: payment_method.ideal should be an object or element." unless `payment_method` has the method's own key, such as `{ ideal: {} }`.
- **Create the Intent in a currency the method takes.** Otherwise the server's `paymentIntents.create()` fails with "The currency provided (usd) is invalid. Payments with ideal support the following currencies: eur." Some methods also take other currencies on accounts in other countries.
- **Send the billing fields the method requires.** A missing one comes back as `parameter_missing`, for example "Missing required param: billing_details[email]."

Observed with Stripe.js 10 on a US sandbox account in October 2026:

| Method | Intent | `data` |
|--------|--------|--------|
| ACSS Debit | `cad` or `usd`, created with `payment_method_options.acss_debit.mandate_options` (a SetupIntent also needs `payment_method_options.acss_debit.currency`) | `payment_method.billing_details` with `name` and `email`. Stripe.js then opens its modal for the bank account |
| Affirm | `usd`, at least $35.00 | `payment_method: {}` |
| Afterpay / Clearpay | `usd` | `payment_method.billing_details` with `name` and `email` |
| Alipay | `usd` or `cny` | `return_url` is enough |
| Amazon Pay (setup) | SetupIntent | `payment_method: {}` |
| Bacs Debit (setup) | SetupIntent | `payment_method.bacs_debit` (`sort_code`, `account_number`) and `billing_details` with `name`, `email` and `address` |
| Bancontact | `eur` | Payment: `return_url` is enough. Setup: `payment_method.billing_details` with `name` and `email` |
| BLIK | `pln` | `payment_method: { blik: {} }` and `payment_method_options.blik.code`. Setup: also `billing_details.email` |
| Boleto | `brl` | `payment_method.boleto.tax_id` and `billing_details` with `name`, `email` and `address` (required by the Stripe.js type) |
| Cash App Pay | `usd` | `payment_method: {}`, for payments and setups |
| Customer balance | Created with a `customer` | `payment_method: {}` (or `{ customer_balance: {} }`), and `payment_method_options.customer_balance` with `funding_type: 'bank_transfer'` and the `bank_transfer.type`, here or on the Intent (see [the example](/api/composables/confirm/redirects#example)) |
| EPS | `eur` | `payment_method: {}` |
| FPX | `myr` | `payment_method: { fpx: { bank } }` |
| iDEAL | `eur` | `payment_method: { ideal: {} }`. Setup: also `billing_details` with `name` and `email` |
| Klarna | `usd` | `return_url` is enough |
| Multibanco | `eur` | `payment_method.billing_details.email` |
| OXXO | `mxn` | `payment_method.billing_details` with `name` and `email` |
| Przelewy24 | `eur` or `pln` | `payment_method.billing_details.email` |
| Pay by Bank | `gbp` or `eur` | `return_url` is enough |
| Pix | `brl` | `payment_method.billing_details` with `name`, `email` and `tax_id` (see [Pix](/api/composables/confirm/wallets#useconfirmpixpayment)) |
| SEPA Debit | `eur` | `payment_method.sepa_debit` (the IBAN Element or `{ iban }`) and `billing_details` with `name` and `email` |
| US bank account | `usd` | `payment_method.us_bank_account` (or a payment method from [`useFinancialConnections`](/api/composables/use-financial-connections)) and `billing_details.name` |
| WeChat Pay | `usd` or `cny` | `payment_method_options.wechat_pay.client`: `'web'` or `'mobile_web'`. Stripe.js throws without it |

Billie needs a [Stripe beta flag](/api/composables/confirm/bnpl#useconfirmbilliepayment), and Stripe refuses [giropay and Sofort](/api/composables/confirm/redirects) payments. GrabPay, Konbini, MobilePay, PayNow, PayPal, PromptPay, TWINT and AU BECS Debit were not available on the account used for this table; follow the Stripe guide each family page links. [Test your integration](/guide/testing#redirects-qr-codes-bnpl-and-vouchers) describes what each method does in test mode.

## Return value

Every composable has the same shape. For `useConfirmCardPayment`:

```ts
const { confirmCardPayment, loading, error } = useConfirmCardPayment()
// confirmCardPayment: Stripe['confirmCardPayment']
```

| Property | Type | Description |
|----------|------|-------------|
| `confirm<Method>Payment` / `confirm<Method>Setup` | `Stripe['confirm<Method>...']` | The Stripe.js method, with Stripe's own parameter and result types. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight (until the last of overlapping calls settles). |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset to `null` when a call starts. |

The wrapped method:

- forwards its arguments to Stripe.js unchanged and resolves to Stripe's result untouched (`{ paymentIntent }` / `{ setupIntent }` or `{ error }`). An `{ error }` result also sets `error`.
- rejects when Stripe.js throws (for example on invalid arguments), after setting `error`.
- rejects with `VueStripeProviderError` if Stripe.js has not loaded. `VueStripeProvider` renders its children only once Stripe.js is ready, so this does not happen in components inside it.

Calling a composable outside a `VueStripeProvider` throws `VueStripeProviderError`.

### Resolve or reject

Every composable that calls Stripe.js reports a Stripe error result (a decline, a validation error) as a resolved `{ error }` and also sets its `error` ref. They differ when Stripe.js is not available (no loaded provider, or the plugin's load failed; under the plugin a call made while Stripe.js loads waits for it) or when the Stripe.js call throws:

| Composable | Stripe.js not loaded, or the Stripe.js call throws |
|------------|-----------------------------------------------------|
| [`usePaymentIntent`](/api/composables/use-payment-intent), [`useSetupIntent`](/api/composables/use-setup-intent), [`useCreatePaymentMethod`](/api/composables/use-create-payment-method), [`useHandleNextAction`](/api/composables/use-handle-next-action), [`useFinancialConnections`](/api/composables/use-financial-connections), [`useIdentity`](/api/composables/use-identity) | **Resolves** to a `VueStripeErrorResult`, `{ error: { message } }` (e.g. `'Stripe not initialized'`), so one `if (result.error)` check covers every failure |
| The method confirmers on these pages, [`useCreateToken`](/api/composables/use-create-token), [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token), [`useHandleCardAction`](/api/composables/use-handle-card-action), [`useVerifyMicrodepositsForPayment`](/api/composables/use-verify-microdeposits-for-payment), [`useVerifyMicrodepositsForSetup`](/api/composables/use-verify-microdeposits-for-setup), [`useRadarSession`](/api/composables/use-radar-session), [`useEphemeralKeyNonce`](/api/composables/use-ephemeral-key-nonce) | **Rejects**, like the Stripe.js method it wraps: with `VueStripeProviderError` when Stripe.js has not loaded, or with what Stripe.js threw. `error` is set first |

The other composables have their own contracts:

- [`useStripeElements`](/api/composables/use-stripe-elements): `submit()` and `fetchUpdates()` resolve to `{ error: { message: 'Elements not initialized' } }` before the Elements group exists, and otherwise return Stripe's result. `fetchUpdates()` also resolves to `{ error }` where Stripe.js throws, as it does on a deferred (`mode`) group.
- [`useCheckoutSession`](/api/composables/use-checkout-session) and [`useCheckoutForm`](/api/composables/use-checkout-form): an action called before the session is ready resolves to `{ type: 'error', error: { message: 'Checkout session is not ready yet' } }`; otherwise it returns Stripe's result.
- [`usePaymentRequest`](/api/composables/use-payment-request): methods never throw; failures set its `error` ref.
- [`useStripeCheckout`](/api/composables/use-stripe-checkout): `redirectToCheckout()` rejects with `VueStripeCheckoutError` when `url` is empty.

Inside `VueStripeProvider`, Stripe.js has always loaded by the time your component renders, so "not loaded" only happens in code outside it, or under the [plugin](/api/plugin) before the first load finishes. [How confirming works](/guide/confirming-payments#two-error-styles) explains why the two styles exist.

## TypeScript

The composables are typed from the installed `@stripe/stripe-js`, so parameters, overloads and results follow Stripe's types. Name the return type with `UseStripeMethodReturn`:

```vue
<script setup lang="ts">
import { useConfirmCardSetup } from '@vue-stripe/vue-stripe'
import type { UseStripeMethodReturn } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string; paymentMethod: string }>()
const confirm: UseStripeMethodReturn<'confirmCardSetup'> = useConfirmCardSetup()

const save = () =>
  confirm.confirmCardSetup(props.clientSecret, { payment_method: props.paymentMethod })
</script>

<template>
  <button :disabled="confirm.loading.value" @click="save">Save card</button>
  <p v-if="confirm.error.value">{{ confirm.error.value }}</p>
</template>
```

## All composables

| Composable | Stripe.js method | Page |
|------------|------------------|------|
| `useConfirmAcssDebitPayment` | `stripe.confirmAcssDebitPayment()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmAcssDebitSetup` | `stripe.confirmAcssDebitSetup()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmAffirmPayment` | `stripe.confirmAffirmPayment()` | [Buy now, pay later](/api/composables/confirm/bnpl) |
| `useConfirmAfterpayClearpayPayment` | `stripe.confirmAfterpayClearpayPayment()` | [Buy now, pay later](/api/composables/confirm/bnpl) |
| `useConfirmAlipayPayment` | `stripe.confirmAlipayPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmAmazonPaySetup` | `stripe.confirmAmazonPaySetup()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmAuBecsDebitPayment` | `stripe.confirmAuBecsDebitPayment()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmAuBecsDebitSetup` | `stripe.confirmAuBecsDebitSetup()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmBacsDebitSetup` | `stripe.confirmBacsDebitSetup()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmBancontactPayment` | `stripe.confirmBancontactPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmBancontactSetup` | `stripe.confirmBancontactSetup()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmBilliePayment` | `stripe.confirmBilliePayment()` | [Buy now, pay later](/api/composables/confirm/bnpl) |
| `useConfirmBlikPayment` | `stripe.confirmBlikPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmBlikSetup` | `stripe.confirmBlikSetup()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmBoletoPayment` | `stripe.confirmBoletoPayment()` | [Vouchers](/api/composables/confirm/vouchers) |
| `useConfirmCardPayment` | `stripe.confirmCardPayment()` | [Cards](/api/composables/confirm/cards) |
| `useConfirmCardSetup` | `stripe.confirmCardSetup()` | [Cards](/api/composables/confirm/cards) |
| `useConfirmCashappPayment` | `stripe.confirmCashappPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmCashappSetup` | `stripe.confirmCashappSetup()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmCustomerBalancePayment` | `stripe.confirmCustomerBalancePayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmEpsPayment` | `stripe.confirmEpsPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmFpxPayment` | `stripe.confirmFpxPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmGiropayPayment` | `stripe.confirmGiropayPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmGrabPayPayment` | `stripe.confirmGrabPayPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmIdealPayment` | `stripe.confirmIdealPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmIdealSetup` | `stripe.confirmIdealSetup()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmKlarnaPayment` | `stripe.confirmKlarnaPayment()` | [Buy now, pay later](/api/composables/confirm/bnpl) |
| `useConfirmKonbiniPayment` | `stripe.confirmKonbiniPayment()` | [Vouchers](/api/composables/confirm/vouchers) |
| `useConfirmMobilepayPayment` | `stripe.confirmMobilepayPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmMultibancoPayment` | `stripe.confirmMultibancoPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmOxxoPayment` | `stripe.confirmOxxoPayment()` | [Vouchers](/api/composables/confirm/vouchers) |
| `useConfirmP24Payment` | `stripe.confirmP24Payment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmPayByBankPayment` | `stripe.confirmPayByBankPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmPayNowPayment` | `stripe.confirmPayNowPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmPayPalPayment` | `stripe.confirmPayPalPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmPayPalSetup` | `stripe.confirmPayPalSetup()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmPixPayment` | `stripe.confirmPixPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmPromptPayPayment` | `stripe.confirmPromptPayPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmSepaDebitPayment` | `stripe.confirmSepaDebitPayment()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmSepaDebitSetup` | `stripe.confirmSepaDebitSetup()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmSofortPayment` | `stripe.confirmSofortPayment()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmSofortSetup` | `stripe.confirmSofortSetup()` | [Redirects and bank transfers](/api/composables/confirm/redirects) |
| `useConfirmTwintPayment` | `stripe.confirmTwintPayment()` | [Wallets](/api/composables/confirm/wallets) |
| `useConfirmUsBankAccountPayment` | `stripe.confirmUsBankAccountPayment()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmUsBankAccountSetup` | `stripe.confirmUsBankAccountSetup()` | [Bank debits](/api/composables/confirm/bank-debits) |
| `useConfirmWechatPayPayment` | `stripe.confirmWechatPayPayment()` | [Wallets](/api/composables/confirm/wallets) |

## See Also

- [How confirming works](/guide/confirming-payments) - Which composable confirms which flow
- [usePaymentIntent](/api/composables/use-payment-intent) and [useSetupIntent](/api/composables/use-setup-intent) - Confirm with the Payment Element
- [Types and errors](/api/types) - `UseStripeMethodReturn`, `VueStripeErrorResult` and the error classes
- [Stripe.js coverage](/coverage) - Every Stripe.js method and its composable
- [ACH Direct Debit demo](/live-demo/ach-debit) - Confirms with `useConfirmUsBankAccountPayment`
