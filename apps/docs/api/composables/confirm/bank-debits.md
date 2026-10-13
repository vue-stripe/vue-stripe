# Bank debit confirmers

Confirm a PaymentIntent or SetupIntent that debits a bank account: Canadian pre-authorized debits (ACSS), Australian BECS, UK Bacs, SEPA Direct Debit and US bank accounts (ACH). ACSS opens a Stripe modal that collects and verifies the account; SEPA and BECS take the account from [`VueStripeIbanElement`](/api/components/stripe-iban-element) / [`VueStripeAuBankAccountElement`](/api/components/stripe-au-bank-account-element).

Each composable returns the Stripe.js method under its own name plus `loading` and `error`; see [Method confirmers](/api/composables/confirm/) for the shared behavior. Call it in a component inside [`VueStripeProvider`](/api/components/stripe-provider).

## When to use

The [Payment Element](/api/components/stripe-payment-element) collects all of these, shows the mandate text and confirms through [`usePaymentIntent`](/api/composables/use-payment-intent) / [`useSetupIntent`](/api/composables/use-setup-intent); prefer it for new integrations. Use the confirmers below with the IBAN or BECS element, with your own form, or to confirm an intent whose PaymentMethod is already attached (for US bank accounts, collected with `stripe.collectBankAccountForPayment()`).

## Example

```vue
<!-- PayWithSepa.vue: rendered inside <VueStripeProvider> and <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIbanElement, useConfirmSepaDebitPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)
const { confirmSepaDebitPayment, loading, error } = useConfirmSepaDebitPayment()
const status = ref('')

const pay = async () => {
  const iban = ibanRef.value?.element
  if (!iban) return
  const { paymentIntent } = await confirmSepaDebitPayment(props.clientSecret, {
    payment_method: {
      sepa_debit: iban,
      billing_details: { name: 'Jenny Rosen', email: 'jenny@example.com' }
    }
  })
  // SEPA debits settle later: expect 'processing'
  status.value = paymentIntent?.status ?? ''
}
</script>

<template>
  <VueStripeIbanElement ref="ibanRef" :options="{ supportedCountries: ['SEPA'] }" />
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
  <p v-if="status">Payment {{ status }}</p>
</template>
```

The ACSS confirmers need only billing details; Stripe's modal collects the account:

```ts
const { confirmAcssDebitPayment } = useConfirmAcssDebitPayment()
await confirmAcssDebitPayment(clientSecret, {
  payment_method: { billing_details: { name: 'Jenny Rosen', email: 'jenny@example.com' } }
})
```

## Composables

### useConfirmAcssDebitPayment

Wraps [`stripe.confirmAcssDebitPayment()`](https://docs.stripe.com/js/payment_intents/confirm_acss_debit_payment). Use `stripe.confirmAcssDebitPayment` in the [Accept a Canadian pre-authorized debit payment](https://docs.stripe.com/payments/acss-debit/accept-a-payment) flow when the customer submits your payment form. When called, it will automatically pop up a modal to collect bank account details and verification, accept the mandate, and confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) when the user submits the form.

```ts
const { confirmAcssDebitPayment, loading, error } = useConfirmAcssDebitPayment()

// Stripe.js signature
confirmAcssDebitPayment(
  clientSecret: string,
  data?: ConfirmAcssDebitPaymentData,
  options?: ConfirmAcssDebitPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmAcssDebitSetup

Wraps [`stripe.confirmAcssDebitSetup()`](https://docs.stripe.com/js/setup_intents/confirm_acss_debit_setup). Use `stripe.confirmAcssDebitSetup` to [save details for future payments with pre-authorized debit in Canada](https://docs.stripe.com/payments/acss-debit/set-up-payment). When called, it will automatically pop up a modal to collect bank account details and verification, accept the mandate, and confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents) when the user submits the form.

```ts
const { confirmAcssDebitSetup, loading, error } = useConfirmAcssDebitSetup()

// Stripe.js signature
confirmAcssDebitSetup(
  clientSecret: string,
  data?: ConfirmAcssDebitSetupData,
  options?: ConfirmAcssDebitSetupOptions
): Promise<SetupIntentResult>
```

### useConfirmAuBecsDebitPayment

Wraps [`stripe.confirmAuBecsDebitPayment()`](https://docs.stripe.com/js/payment_intents/confirm_au_becs_debit_payment). Use `stripe.confirmAuBecsDebitPayment` in the [BECS Direct Debit Payments](https://docs.stripe.com/payments/payment-methods/au-becs-debit) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmAuBecsDebitPayment, loading, error } = useConfirmAuBecsDebitPayment()

// Stripe.js signature
confirmAuBecsDebitPayment(
  clientSecret: string,
  data?: ConfirmAuBecsDebitPaymentData
): Promise<PaymentIntentResult>
```

### useConfirmAuBecsDebitSetup

Wraps [`stripe.confirmAuBecsDebitSetup()`](https://docs.stripe.com/js/setup_intents/confirm_au_becs_debit_setup). Use `stripe.confirmAuBecsDebitSetup` in the [BECS Direct Debit with Setup Intents](https://docs.stripe.com/payments/payment-methods/au-becs-debit-quickstart-setup-intents) flow when the customer submits your payment form. When called, it will confirm the `SetupIntent` with `data` you provide.

```ts
const { confirmAuBecsDebitSetup, loading, error } = useConfirmAuBecsDebitSetup()

// Stripe.js signature
confirmAuBecsDebitSetup(
  clientSecret: string,
  data?: ConfirmAuBecsDebitSetupData
): Promise<SetupIntentResult>
```

### useConfirmBacsDebitSetup

Wraps [`stripe.confirmBacsDebitSetup()`](https://docs.stripe.com/js/setup_intents/confirm_bacs_debit_setup). Use `stripe.confirmBacsDebitSetup` in the [Bacs Direct Debit Payments](https://docs.stripe.com/payments/payment-methods/bacs-debit) flow when the customer submits your payment form. When called, it will confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents) with `data` you provide.

```ts
const { confirmBacsDebitSetup, loading, error } = useConfirmBacsDebitSetup()

// Stripe.js signature
confirmBacsDebitSetup(
  clientSecret: string,
  data?: ConfirmBacsDebitSetupData
): Promise<SetupIntentResult>
```

### useConfirmSepaDebitPayment

Wraps [`stripe.confirmSepaDebitPayment()`](https://docs.stripe.com/js/payment_intents/confirm_sepa_debit_payment). Use `stripe.confirmSepaDebitPayment` in the [SEPA Direct Debit Payments](https://docs.stripe.com/payments/sepa-debit) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmSepaDebitPayment, loading, error } = useConfirmSepaDebitPayment()

// Stripe.js signature
confirmSepaDebitPayment(
  clientSecret: string,
  data?: ConfirmSepaDebitPaymentData
): Promise<PaymentIntentResult>
```

### useConfirmSepaDebitSetup

Wraps [`stripe.confirmSepaDebitSetup()`](https://docs.stripe.com/js/setup_intents/confirm_sepa_debit_setup). Use `stripe.confirmSepaDebitSetup` in the [SEPA Direct Debit with Setup Intents](https://docs.stripe.com/payments/sepa-debit-setup-intents) flow when the customer submits your payment form. When called, it will confirm the `SetupIntent` with `data` you provide.

```ts
const { confirmSepaDebitSetup, loading, error } = useConfirmSepaDebitSetup()

// Stripe.js signature
confirmSepaDebitSetup(
  clientSecret: string,
  data?: ConfirmSepaDebitSetupData
): Promise<SetupIntentResult>
```

### useConfirmUsBankAccountPayment

Wraps [`stripe.confirmUsBankAccountPayment()`](https://docs.stripe.com/js/payment_intents/confirm_us_bank_account_payment). Use `stripe.confirmUsBankAccountPayment` in the [Accept a payment](https://docs.stripe.com/payments/ach-debit/accept-a-payment) flow for the [ACH Direct Debit](https://docs.stripe.com/payments/ach-debit) payment method to record the customer’s authorization for payment. When you confirm a [PaymentIntent](https://docs.stripe.com/api/payment_intents), it needs to have an attached PaymentMethod.

```ts
const { confirmUsBankAccountPayment, loading, error } = useConfirmUsBankAccountPayment()

// Stripe.js signature
confirmUsBankAccountPayment(
  clientSecret: string,
  data?: ConfirmUsBankAccountPaymentData
): Promise<PaymentIntentResult>
```

Try it in the [ACH Direct Debit demo](/live-demo/ach-debit): `useFinancialConnections().collectBankAccountForPayment()` links the account, then this composable confirms.

### useConfirmUsBankAccountSetup

Wraps [`stripe.confirmUsBankAccountSetup()`](https://docs.stripe.com/js/setup_intents/confirm_us_bank_account_setup). Use `stripe.confirmUsBankAccountSetup` in the [Save bank details](https://docs.stripe.com/payments/ach-debit/set-up-payment) flow for the [ACH Direct Debit payment](https://docs.stripe.com/payments/ach-debit) method to record the customer’s authorization for future payments. When you confirm a [SetupIntent](https://docs.stripe.com/api/setup_intents), it needs to have an attached PaymentMethod.

```ts
const { confirmUsBankAccountSetup, loading, error } = useConfirmUsBankAccountSetup()

// Stripe.js signature
confirmUsBankAccountSetup(
  clientSecret: string,
  data?: ConfirmUsBankAccountSetupData
): Promise<SetupIntentResult>
```
