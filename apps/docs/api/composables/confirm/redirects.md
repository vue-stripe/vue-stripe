# Redirect and bank transfer confirmers

Confirm a PaymentIntent or SetupIntent with a bank redirect (Bancontact, EPS, FPX, giropay, iDEAL, Przelewy24, Sofort, Pay by Bank) or a bank transfer (Multibanco, customer balance). Redirect methods send the customer to their bank to authorize the payment and back to your `return_url`; on that page, read the `payment_intent_client_secret` query parameter and retrieve the PaymentIntent with [`usePaymentIntent`](/api/composables/use-payment-intent) to show the outcome.

Stripe removed the standalone iDEAL, EPS, FPX and P24 bank elements in Stripe.js Clover (8.0), but the confirmers remain: pass billing details (and the bank, if you collect it yourself) or the ID of a PaymentMethod you created.

Each composable returns the Stripe.js method under its own name plus `loading` and `error`; see [Method confirmers](/api/composables/confirm/) for the shared behavior. Call it in a component inside [`VueStripeProvider`](/api/components/stripe-provider).

## When to use

The [Payment Element](/api/components/stripe-payment-element) shows every redirect method enabled on your account and handles the bank selection; confirm it with [`usePaymentIntent`](/api/composables/use-payment-intent) / [`useSetupIntent`](/api/composables/use-setup-intent). Use these confirmers when you build your own button for one payment method.

## Example

```vue
<!-- PayWithIdeal.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { useConfirmIdealPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { confirmIdealPayment, loading, error } = useConfirmIdealPayment()

// On success the browser leaves the page for the bank; only an error resolves here.
const pay = () =>
  confirmIdealPayment(props.clientSecret, {
    payment_method: { ideal: {}, billing_details: { name: 'Jenny Rosen' } },
    return_url: `${window.location.origin}/checkout/complete`
  })
</script>

<template>
  <button :disabled="loading" @click="pay">Pay with iDEAL</button>
  <p v-if="error">{{ error }}</p>
</template>
```

`confirmCustomerBalancePayment` requires `{ handleActions: false }`: it does not show the bank transfer instructions itself, so render them from `paymentIntent.next_action.display_bank_transfer_instructions`:

```ts
const { confirmCustomerBalancePayment } = useConfirmCustomerBalancePayment()
const { paymentIntent } = await confirmCustomerBalancePayment(
  clientSecret,
  {
    payment_method: { customer_balance: {} },
    payment_method_options: {
      customer_balance: {
        funding_type: 'bank_transfer',
        bank_transfer: { type: 'eu_bank_transfer', eu_bank_transfer: { country: 'NL' } }
      }
    }
  },
  { handleActions: false }
)
```

## Composables

### useConfirmBancontactPayment

Wraps [`stripe.confirmBancontactPayment()`](https://docs.stripe.com/js/payment_intents/confirm_bancontact_payment). Use `stripe.confirmBancontactPayment` in the [Bancontact Payments with Payment Methods](https://docs.stripe.com/payments/bancontact#web) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmBancontactPayment, loading, error } = useConfirmBancontactPayment()

// Stripe.js signature
confirmBancontactPayment(
  clientSecret: string,
  data?: ConfirmBancontactPaymentData,
  options?: ConfirmBancontactPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmBancontactSetup

Wraps [`stripe.confirmBancontactSetup()`](https://docs.stripe.com/js/payment_intents/confirm_bancontact_setup). Use `stripe.confirmBancontactSetup` in the [Set up future payments](https://docs.stripe.com/payments/bancontact/set-up-payment) flow to use Bancontact bank details to set up a SEPA Direct Debit payment method for future payments. When called, it will confirm a `SetupIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmBancontactSetup, loading, error } = useConfirmBancontactSetup()

// Stripe.js signature
confirmBancontactSetup(
  clientSecret: string,
  data?: ConfirmBancontactSetupData
): Promise<SetupIntentResult>
```

### useConfirmEpsPayment

Wraps [`stripe.confirmEpsPayment()`](https://docs.stripe.com/js/payment_intents/confirm_eps_payment). Use `stripe.confirmEpsPayment` in the [EPS Payments with Payment Methods](https://docs.stripe.com/payments/eps#web) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmEpsPayment, loading, error } = useConfirmEpsPayment()

// Stripe.js signature
confirmEpsPayment(
  clientSecret: string,
  data?: ConfirmEpsPaymentData,
  options?: ConfirmEpsPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmFpxPayment

Wraps [`stripe.confirmFpxPayment()`](https://docs.stripe.com/js/payment_intents/confirm_fpx_payment). Use `stripe.confirmFpxPayment` in the [FPX Payments with Payment Methods](https://docs.stripe.com/payments/fpx#web) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmFpxPayment, loading, error } = useConfirmFpxPayment()

// Stripe.js signature
confirmFpxPayment(
  clientSecret: string,
  data?: ConfirmFpxPaymentData,
  options?: ConfirmFpxPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmGiropayPayment

Wraps [`stripe.confirmGiropayPayment()`](https://docs.stripe.com/js/payment_intents/confirm_giropay_payment). Use `stripe.confirmGiropayPayment` in the [giropay Payments with Payment Methods](https://docs.stripe.com/payments/giropay#web) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmGiropayPayment, loading, error } = useConfirmGiropayPayment()

// Stripe.js signature
confirmGiropayPayment(
  clientSecret: string,
  data?: ConfirmGiropayPaymentData,
  options?: ConfirmGiropayPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmIdealPayment

Wraps [`stripe.confirmIdealPayment()`](https://docs.stripe.com/js/payment_intents/confirm_ideal_payment). Use `stripe.confirmIdealPayment` in the [iDEAL Payments with Payment Methods](https://docs.stripe.com/payments/ideal) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmIdealPayment, loading, error } = useConfirmIdealPayment()

// Stripe.js signature
confirmIdealPayment(
  clientSecret: string,
  data?: ConfirmIdealPaymentData,
  options?: ConfirmIdealPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmIdealSetup

Wraps [`stripe.confirmIdealSetup()`](https://docs.stripe.com/js/setup_intents/confirm_ideal_setup). Use `stripe.confirmIdealSetup` in the [Set up future payments](https://docs.stripe.com/payments/ideal/set-up-payment) flow to use iDEAL bank details to set up a SEPA Direct Debit payment method for future payments. When called, it will confirm a `SetupIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmIdealSetup, loading, error } = useConfirmIdealSetup()

// Stripe.js signature
confirmIdealSetup(
  clientSecret: string,
  data?: ConfirmIdealSetupData
): Promise<SetupIntentResult>
```

### useConfirmP24Payment

Wraps [`stripe.confirmP24Payment()`](https://docs.stripe.com/js/payment_intents/confirm_p24_payment). Use `stripe.confirmP24Payment` in the [Przelewy24 Payments with Payment Methods](https://docs.stripe.com/payments/p24#web) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmP24Payment, loading, error } = useConfirmP24Payment()

// Stripe.js signature
confirmP24Payment(
  clientSecret: string,
  data?: ConfirmP24PaymentData,
  options?: ConfirmP24PaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmSofortPayment

Wraps [`stripe.confirmSofortPayment()`](https://docs.stripe.com/js/payment_intents/confirm_sofort_payment). Use `stripe.confirmSofortPayment` in the [Sofort Payments with Payment Methods](https://docs.stripe.com/payments/sofort) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide.

```ts
const { confirmSofortPayment, loading, error } = useConfirmSofortPayment()

// Stripe.js signature
confirmSofortPayment(
  clientSecret: string,
  data?: ConfirmSofortPaymentData,
  options?: ConfirmSofortPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmSofortSetup

Wraps `stripe.confirmSofortSetup()`. Use `stripe.confirmSofortSetup` in the [Set up future payments](https://docs.stripe.com/payments/sofort/set-up-payment) flow to use SOFORT bank details to set up a SEPA Direct Debit payment method for future payments. When called, it will confirm a `SetupIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmSofortSetup, loading, error } = useConfirmSofortSetup()

// Stripe.js signature
confirmSofortSetup(
  clientSecret: string,
  data?: ConfirmSofortSetupData,
  options?: ConfirmSofortSetupOptions
): Promise<SetupIntentResult>
```

### useConfirmPayByBankPayment

Wraps [`stripe.confirmPayByBankPayment()`](https://docs.stripe.com/js/payment_intents/confirm_pay_by_bank_payment). Use `stripe.confirmPayByBankPayment` in the [Pay by Bank Payments](https://docs.stripe.com/payments/pay-by-bank) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmPayByBankPayment, loading, error } = useConfirmPayByBankPayment()

// Stripe.js signature
confirmPayByBankPayment(
  clientSecret: string,
  data?: ConfirmPayByBankPaymentData,
  options?: ConfirmPayByBankPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmMultibancoPayment

Wraps [`stripe.confirmMultibancoPayment()`](https://docs.stripe.com/js/payment_intents/confirm_multibanco_payment). Use `stripe.confirmMultibancoPayment` in the [Multibanco Payment](https://docs.stripe.com/payments/multibanco) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmMultibancoPayment, loading, error } = useConfirmMultibancoPayment()

// Stripe.js signature
confirmMultibancoPayment(
  clientSecret: string,
  data?: ConfirmMultibancoPaymentData,
  options?: ConfirmMultibancoPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmCustomerBalancePayment

Wraps [`stripe.confirmCustomerBalancePayment()`](https://docs.stripe.com/js/payment_intents/confirm_customer_balance_payment). Use `stripe.confirmCustomerBalancePayment` when the customer submits your payment form. When called, it will confirm the PaymentIntent with data you provide.

```ts
const { confirmCustomerBalancePayment, loading, error } = useConfirmCustomerBalancePayment()

// Stripe.js signature
confirmCustomerBalancePayment(
  clientSecret: string,
  data: ConfirmCustomerBalancePaymentData,
  options: ConfirmCustomerBalancePaymentOptions
): Promise<PaymentIntentResult>
```
