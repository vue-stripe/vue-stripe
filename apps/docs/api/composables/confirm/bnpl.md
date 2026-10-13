---
description: "Vue composables that confirm buy now, pay later payments with Stripe.js: Affirm, Afterpay / Clearpay, Billie and Klarna, with the redirect back to your app."
---

# Buy now, pay later confirmers

Confirm a PaymentIntent with a buy now, pay later method: Affirm, Afterpay / Clearpay, Billie (Stripe beta) and Klarna. Stripe redirects the customer to the provider to approve the plan and back to your `return_url`.

Each composable returns the Stripe.js method under its own name plus `loading` and `error`; see [Method confirmers](/api/composables/confirm/) for the shared behavior. Call it in a component inside [`VueStripeProvider`](/api/components/stripe-provider).

## When to use

The [Payment Element](/api/components/stripe-payment-element) offers the BNPL methods that fit the amount and currency; confirm it with [`usePaymentIntent`](/api/composables/use-payment-intent). Advertise instalments with [`VueStripePaymentMethodMessagingElement`](/api/components/stripe-payment-method-messaging-element). Use these confirmers for a dedicated button per provider.

## Example

```vue
<!-- PayWithKlarna.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { useConfirmKlarnaPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { confirmKlarnaPayment, loading, error } = useConfirmKlarnaPayment()

const pay = () =>
  confirmKlarnaPayment(props.clientSecret, {
    payment_method: {
      billing_details: { email: 'jenny@example.com', address: { country: 'DE' } }
    },
    return_url: `${window.location.origin}/checkout/complete`
  })
</script>

<template>
  <button :disabled="loading" @click="pay">Pay with Klarna</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Composables

### useConfirmAffirmPayment

Wraps [`stripe.confirmAffirmPayment()`](https://docs.stripe.com/js/payment_intents/confirm_affirm_payment). Use `stripe.confirmAffirmPayment` in the [Affirm payments](https://docs.stripe.com/payments/affirm) flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents).

```ts
const { confirmAffirmPayment, loading, error } = useConfirmAffirmPayment()

// Stripe.js signature
confirmAffirmPayment(
  clientSecret: string,
  data?: ConfirmAffirmPaymentData,
  options?: ConfirmAffirmPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmAfterpayClearpayPayment

Wraps [`stripe.confirmAfterpayClearpayPayment()`](https://docs.stripe.com/js/payment_intents/confirm_afterpay_clearpay_payment). Use `stripe.confirmAfterpayClearpayPayment` in the [Afterpay / Clearpay payments](https://docs.stripe.com/payments/afterpay-clearpay) flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents).

```ts
const { confirmAfterpayClearpayPayment, loading, error } = useConfirmAfterpayClearpayPayment()

// Stripe.js signature
confirmAfterpayClearpayPayment(
  clientSecret: string,
  data?: ConfirmAfterpayClearpayPaymentData,
  options?: ConfirmAfterpayClearpayPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmBilliePayment

Wraps `stripe.confirmBilliePayment()`. Use `stripe.confirmBilliePayment` in the [Billie Payments](https://docs.stripe.com/payments/billie) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

::: danger Stripe beta
Billie is a Stripe beta. Stripe.js refuses the call unless the Stripe instance was created with a beta flag: without it, `confirmBilliePayment()` rejects before any request with "You cannot call `stripe.confirmBilliePayment` without supplying an appropriate beta flag when initializing Stripe.js.", and the `error` ref holds the same message. Stripe gives the flag to accounts with access ([contact Stripe](https://support.stripe.com/)). Pass it with the [`betas`](/api/components/stripe-provider#props) prop of `VueStripeProvider`; the [plugin](/api/plugin) has no `betas` option, so wrap the component in a `VueStripeProvider` that sets it.
:::

```ts
const { confirmBilliePayment, loading, error } = useConfirmBilliePayment()

// Stripe.js signature
confirmBilliePayment(
  clientSecret: string,
  data?: ConfirmBilliePaymentData,
  options?: ConfirmBilliePaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmKlarnaPayment

Wraps [`stripe.confirmKlarnaPayment()`](https://docs.stripe.com/js/payment_intents/confirm_klarna_payment). Use `stripe.confirmKlarnaPayment` in the [Klarna Payments](https://docs.stripe.com/payments/klarna) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmKlarnaPayment, loading, error } = useConfirmKlarnaPayment()

// Stripe.js signature
confirmKlarnaPayment(
  clientSecret: string,
  data?: ConfirmKlarnaPaymentData,
  options?: ConfirmKlarnaPaymentOptions
): Promise<PaymentIntentResult>
```

## See Also

- [Method confirmers](/api/composables/confirm/) - The shared return value
- [VueStripePaymentMethodMessagingElement](/api/components/stripe-payment-method-messaging-element) - Show installment messaging
- [Redirects](/guide/confirming-payments#redirects) - How the return to your page works
