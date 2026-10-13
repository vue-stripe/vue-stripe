# Method confirmers

Stripe.js has a confirm method for each payment method, such as `stripe.confirmCardPayment()` or `stripe.confirmSepaDebitSetup()`. Vue Stripe wraps every one of them, 46 in Stripe.js 10, in a composable named after it: `useConfirmCardPayment`, `useConfirmSepaDebitSetup`, and so on.

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

## When to use

If you collect payment details with the [Payment Element](/api/components/stripe-payment-element), confirm with [`usePaymentIntent`](/api/composables/use-payment-intent) / [`useSetupIntent`](/api/composables/use-setup-intent): one call covers every payment method the Payment Element shows, and it runs `elements.submit()` first. The method confirmers are for everything else: the Card, IBAN and BECS elements, a button for one payment method, your own form, or a saved PaymentMethod ID.

Some payment methods must be enabled on your Stripe account first, and a few are only offered in certain countries or currencies; see the Stripe guide linked from each method.

::: tip Guide and live demo
The [Confirming Payments guide](/guide/confirming-payments) compares the confirmers with `usePaymentIntent`, the Checkout composables and server-side confirmation. The [ACH Direct Debit demo](/live-demo/ach-debit) confirms with `useConfirmUsBankAccountPayment`.
:::

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
- rejects when Stripe.js throws (for example on invalid arguments), after setting `error`. This differs from `usePaymentIntent` and `useSetupIntent`, which resolve to `{ error }` instead.
- rejects with `VueStripeProviderError` if Stripe.js has not loaded. `VueStripeProvider` renders its children only once Stripe.js is ready, so this does not happen in components inside it.

Calling a composable outside a `VueStripeProvider` throws `VueStripeProviderError`. The confirmers do not need `VueStripeElements`; components that use the Card, IBAN or BECS element do.

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
