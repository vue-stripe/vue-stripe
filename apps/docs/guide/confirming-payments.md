# Confirming Payments

Collecting payment details is half of a payment; the other half is **confirming** the PaymentIntent or SetupIntent with them. Vue Stripe has a composable for every way Stripe.js confirms, so a component never needs the raw `stripe` instance for it. This page helps you pick the right one.

## Which Composable?

| You collect details with | Confirm with | Live demo |
|--------------------------|--------------|-----------|
| The Payment Element | [`usePaymentIntent().confirmPayment`](/api/composables/use-payment-intent), [`useSetupIntent().confirmSetup`](/api/composables/use-setup-intent) | [Payment Element](/live-demo/payment-element), [Save a Card](/live-demo/setup-intent) |
| A Checkout Session (`ui_mode: 'elements'`) | [`useCheckoutSession().confirm`](/api/composables/use-checkout-session) | [Custom Checkout](/live-demo/custom-checkout) |
| The Checkout Form (`ui_mode: 'form'`) | [`useCheckoutForm().confirm`](/api/composables/use-checkout-form) | [Checkout Form](/live-demo/checkout-form) |
| The Card, IBAN or BECS element, Stripe's bank modal, or a saved PaymentMethod ID | A [method confirmer](/api/composables/confirm/): `useConfirmCardPayment`, `useConfirmSepaDebitPayment`, `useConfirmAuBecsDebitPayment`, `useConfirmUsBankAccountPayment`, ... | [Card Element](/live-demo/card-element), [SEPA](/live-demo/iban-element), [BECS](/live-demo/becs-payment), [ACH](/live-demo/ach-debit) |
| Anything, and your **server** confirms | [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token) to collect, then [`useHandleNextAction`](/api/composables/use-handle-next-action) for 3D Secure | [Tokens](/live-demo/tokens) |

Every composable returns `loading` and `error` refs next to its method, so the button state and the error message need no extra code.

## Payment Element: `usePaymentIntent` and `useSetupIntent`

One call covers every payment method the Payment Element shows. `confirmPayment` runs `elements.submit()` first (Stripe requires it) and reads the Elements group from the nearest `VueStripeElements`:

```vue
<!-- PayButton.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmPayment, loading, error } = usePaymentIntent()

const pay = async () => {
  const { paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` },
    // Cards stay on the page; bank redirects and some wallets still leave.
    redirect: 'if_required'
  })
  if (paymentIntent?.status === 'succeeded') {
    // show the receipt
  }
}
</script>

<template>
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

`useSetupIntent().confirmSetup` works the same way for saving a payment method. Pass `skipSubmit: true` only when you already called `submit()` from [`useStripeElements()`](/api/composables/use-stripe-elements) yourself, for example to validate before creating the Intent on your server.

## One Payment Method: the Method Confirmers

Stripe.js has a `confirm<Method>Payment` / `confirm<Method>Setup` method for each payment method, and Vue Stripe wraps all 46 of them: `useConfirmCardPayment`, `useConfirmSepaDebitSetup`, `useConfirmKlarnaPayment`, and so on. Use them with the single-purpose elements, with a PaymentMethod you saved earlier, or with a button for one payment method.

Pass the element itself, which every element component exposes on its template ref:

```vue
<!-- CardPayment.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCardElement, useConfirmCardPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { confirmCardPayment, loading, error } = useConfirmCardPayment()

const pay = async () => {
  const card = cardRef.value?.element
  if (!card) return
  // Runs 3D Secure in a modal when the card needs it.
  const { paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: { card, billing_details: { name: 'Jenny Rosen' } }
  })
  return paymentIntent?.status
}
</script>

<template>
  <VueStripeCardElement ref="cardRef" />
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

From a component that does not render the element, `getElement('card')` from [`useStripeElements()`](/api/composables/use-stripe-elements) finds it in the same Elements group. A saved PaymentMethod needs no element at all: `confirmCardPayment(clientSecret, { payment_method: 'pm_123' })`.

The confirmers take Stripe's own arguments and return Stripe's own result, typed from `@stripe/stripe-js`. The [method confirmer overview](/api/composables/confirm/) lists every family: cards, bank debits, redirects and bank transfers, wallets, buy now pay later, and vouchers.

## Bank Accounts: Collect, Then Confirm

ACH Direct Debit and Canadian pre-authorized debits link the bank account in Stripe's Financial Connections modal instead of an element. Collect with [`useFinancialConnections()`](/api/composables/use-financial-connections), then confirm with the method confirmer once the customer accepts the mandate:

```ts
const { collectBankAccountForPayment } = useFinancialConnections()
const { confirmUsBankAccountPayment } = useConfirmUsBankAccountPayment()

// 1. Stripe's modal links the account and attaches it to the PaymentIntent
const { paymentIntent } = await collectBankAccountForPayment({
  clientSecret,
  params: {
    payment_method_type: 'us_bank_account',
    payment_method_data: { billing_details: { name, email } }
  }
})

// 2. After the customer accepts the mandate text
if (paymentIntent?.status === 'requires_confirmation') {
  await confirmUsBankAccountPayment(clientSecret) // 'processing' until the debit clears
}
```

When the customer types the account number instead of logging in to the bank, Stripe verifies it with two micro-deposits. Collect the amounts on a page of your own and pass them to [`useVerifyMicrodepositsForPayment`](/api/composables/use-verify-microdeposits-for-payment) (or [`...ForSetup`](/api/composables/use-verify-microdeposits-for-setup)). Try the whole flow in the [ACH Direct Debit demo](/live-demo/ach-debit).

## Confirming on the Server

Some integrations confirm on the server: to run their own checks before charging, or to call other services in between. The browser then collects the details and finishes any action the bank asks for:

1. [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token) submits the Payment Element and returns a ConfirmationToken.
2. Your server creates and confirms the PaymentIntent with `confirmation_token`.
3. If the PaymentIntent comes back `requires_action`, [`useHandleNextAction`](/api/composables/use-handle-next-action) runs 3D Secure (or any other action) with its client secret.

The [Tokens and Payment Methods guide](/guide/tokens#confirmationtoken-confirm-on-your-server) walks through it with server code.

[`useHandleCardAction`](/api/composables/use-handle-card-action) belongs to the older manual-confirmation flow (`confirmation_method: 'manual'`), where the server confirms a second time after 3D Secure. Keep it for an existing integration; new ones use `useHandleNextAction`.

## Results and Errors

Every confirm method resolves to Stripe's result: `{ paymentIntent }` / `{ setupIntent }` or `{ error }`. Check `error` on the result, or bind the composable's `error` ref in the template:

| Composable | Stripe.js not loaded or Stripe.js throws |
|------------|------------------------------------------|
| `usePaymentIntent`, `useSetupIntent`, `useHandleNextAction`, `useFinancialConnections` | Resolves to `{ error: { message } }`, so one `if (result.error)` check covers every failure. |
| Method confirmers, `useCreateToken`, `useCreateConfirmationToken`, `useHandleCardAction`, `useVerifyMicrodeposits*` | Rejects (after setting `error`), like the Stripe.js method it wraps. |

Inside a `VueStripeProvider`, Stripe.js has always loaded by the time your component renders, so the first case only matters for code that runs outside it.

## Next Steps

- [Method confirmers](/api/composables/confirm/): every `useConfirm<Method>` composable
- [Tokens and Payment Methods](/guide/tokens): collect now, charge later or on the server
- [Saving Payment Methods](/guide/setup-intent): SetupIntents and `useSetupIntent`
