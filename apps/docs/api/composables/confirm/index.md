---
description: "Method confirmers: a Vue composable for each of the 46 Stripe.js confirm methods, with loading and error refs, and when to use them over usePaymentIntent."
---

# Method confirmers

Stripe.js has a confirm method for each payment method, such as `stripe.confirmCardPayment()` or `stripe.confirmSepaDebitSetup()`. Vue Stripe wraps every one of them, 46 in Stripe.js 10, in a composable named after it: `useConfirmCardPayment`, `useConfirmSepaDebitSetup`, and so on. Call them inside a `VueStripeProvider`; they do not need `VueStripeElements`, but components that render the Card, IBAN or BECS element do.

With the [Payment Element](/api/components/stripe-payment-element), confirm with [`usePaymentIntent`](/api/composables/use-payment-intent) or [`useSetupIntent`](/api/composables/use-setup-intent) instead. [How confirming works](/guide/confirming-payments#which-composable-confirms) explains which composable fits which flow. Some payment methods must be enabled on your Stripe account, or are offered only in some countries or currencies; each family page links Stripe's guide for the method.

## Usage

```vue
<script setup lang="ts">
import { useConfirmCardPayment } from '@vue-stripe/vue-stripe'

const { confirmCardPayment, loading, error } = useConfirmCardPayment()

const pay = async (clientSecret: string) => {
  const { paymentIntent } = await confirmCardPayment(clientSecret, { payment_method: 'pm_123' })
  return paymentIntent?.status
}
</script>
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

- [`useStripeElements`](/api/composables/use-stripe-elements): `submit()` and `fetchUpdates()` resolve to `{ error: { message: 'Elements not initialized' } }` before the Elements group exists, and otherwise return Stripe's result.
- [`useCheckoutSession`](/api/composables/use-checkout-session) and [`useCheckoutForm`](/api/composables/use-checkout-form): an action called before the session is ready resolves to `{ type: 'error', error: { message: 'Checkout session is not ready yet' } }`; otherwise it returns Stripe's result.
- [`usePaymentRequest`](/api/composables/use-payment-request): methods never throw; failures set its `error` ref.
- [`useStripeCheckout`](/api/composables/use-stripe-checkout): `redirectToCheckout()` rejects with `VueStripeCheckoutError` when `url` is empty.

Inside `VueStripeProvider`, Stripe.js has always loaded by the time your component renders, so "not loaded" only happens in code outside it, or under the [plugin](/api/plugin) before the first load finishes. [How confirming works](/guide/confirming-payments#two-error-styles) explains why the two styles exist.

## TypeScript

The composables are typed from the installed `@stripe/stripe-js`, so parameters, overloads and results follow Stripe's types. Name the return type with `UseStripeMethodReturn`:

```ts
import { useConfirmCardSetup } from '@vue-stripe/vue-stripe'
import type { UseStripeMethodReturn } from '@vue-stripe/vue-stripe'

const confirm: UseStripeMethodReturn<'confirmCardSetup'> = useConfirmCardSetup()
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
