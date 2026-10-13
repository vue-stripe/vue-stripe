---
description: "Vue composables that confirm cash voucher payments with Stripe.js: Boleto in Brazil, Konbini in Japan and OXXO in Mexico, settled through your webhook."
---

# Voucher confirmers

Confirm a PaymentIntent with a cash voucher: Boleto (Brazil), Konbini (Japan) and OXXO (Mexico). By default Stripe.js displays the voucher to the customer (pass `{ handleActions: false }` to render it yourself from `paymentIntent.next_action`). The PaymentIntent stays `requires_action` until the customer pays, so confirm the payment from your webhook.

Each composable returns the Stripe.js method under its own name plus `loading` and `error`; see [Method confirmers](/api/composables/confirm/) for the shared behavior. Call it in a component inside [`VueStripeProvider`](/api/components/stripe-provider). [What each method needs](/api/composables/confirm/#what-each-method-needs) lists the Intent currency and the `data` each method requires, and [Test your integration](/guide/testing#redirects-qr-codes-bnpl-and-vouchers) what each method does in test mode.

## When to use

The [Payment Element](/api/components/stripe-payment-element) collects the details each voucher needs; confirm it with [`usePaymentIntent`](/api/composables/use-payment-intent). Use these confirmers with your own form.

## Example

```vue
<!-- PayWithOxxo.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { ref } from 'vue'
import { useConfirmOxxoPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const name = ref('')
const email = ref('')
const { confirmOxxoPayment, loading, error } = useConfirmOxxoPayment()

const pay = () =>
  confirmOxxoPayment(props.clientSecret, {
    payment_method: { billing_details: { name: name.value, email: email.value } }
  })
</script>

<template>
  <input v-model="name" placeholder="Full name" />
  <input v-model="email" type="email" placeholder="Email" />
  <button :disabled="loading" @click="pay">Get OXXO voucher</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Composables

### useConfirmBoletoPayment

Wraps [`stripe.confirmBoletoPayment()`](https://docs.stripe.com/js/payment_intents/confirm_boleto_payment). Use `stripe.confirmBoletoPayment` in the [Boleto Payment](https://docs.stripe.com/payments/boleto) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmBoletoPayment, loading, error } = useConfirmBoletoPayment()

// Stripe.js signature
confirmBoletoPayment(
  clientSecret: string,
  data?: ConfirmBoletoPaymentData,
  options?: ConfirmBoletoPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmKonbiniPayment

Wraps [`stripe.confirmKonbiniPayment()`](https://docs.stripe.com/js/payment_intents/confirm_konbini_payment). Use `stripe.confirmKonbiniPayment` in the [Konbini](https://docs.stripe.com/payments/konbini) payment flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmKonbiniPayment, loading, error } = useConfirmKonbiniPayment()

// Stripe.js signature
confirmKonbiniPayment(
  clientSecret: string,
  data?: ConfirmKonbiniPaymentData,
  options?: ConfirmKonbiniPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmOxxoPayment

Wraps [`stripe.confirmOxxoPayment()`](https://docs.stripe.com/js/payment_intents/confirm_oxxo_payment). Use `stripe.confirmOxxoPayment` in the [OXXO Payment](https://docs.stripe.com/payments/oxxo) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmOxxoPayment, loading, error } = useConfirmOxxoPayment()

// Stripe.js signature
confirmOxxoPayment(
  clientSecret: string,
  data?: ConfirmOxxoPaymentData,
  options?: ConfirmOxxoPaymentOptions
): Promise<PaymentIntentResult>
```

## See Also

- [Method confirmers](/api/composables/confirm/) - The shared return value
- [Payment methods that settle later](/guide/confirming-payments#payment-methods-that-settle-later)
