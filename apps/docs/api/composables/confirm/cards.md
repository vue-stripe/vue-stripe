# Card confirmers

Confirm a PaymentIntent or SetupIntent with card details. Stripe runs 3D Secure and any other required action before the promise resolves.

Each composable returns the Stripe.js method under its own name plus `loading` and `error`; see [Method confirmers](/api/composables/confirm/) for the shared behavior. Call it in a component inside [`VueStripeProvider`](/api/components/stripe-provider).

## When to use

Use these with [`VueStripeCardElement`](/api/components/stripe-card-element) or the [split card elements](/api/components/stripe-split-card-elements), or to confirm with a saved card (`payment_method: 'pm_...'`). With the [Payment Element](/api/components/stripe-payment-element), use [`usePaymentIntent`](/api/composables/use-payment-intent) / [`useSetupIntent`](/api/composables/use-setup-intent) instead: they confirm every payment method the Payment Element shows and call `elements.submit()` for you.

## Example

```vue
<!-- PayWithCard.vue: rendered inside <VueStripeProvider> and <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCardElement, useConfirmCardPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { confirmCardPayment, loading, error } = useConfirmCardPayment()
const status = ref('')

const pay = async () => {
  const card = cardRef.value?.element
  if (!card) return
  const { paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: { card, billing_details: { name: 'Jenny Rosen' } }
  })
  status.value = paymentIntent?.status ?? ''
}
</script>

<template>
  <VueStripeCardElement ref="cardRef" />
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
  <p v-if="status">Payment {{ status }}</p>
</template>
```

Save a card for later with `useConfirmCardSetup` the same way, or confirm with a card the customer saved before:

```ts
const { confirmCardSetup } = useConfirmCardSetup()
await confirmCardSetup(setupClientSecret, { payment_method: { card } })

const { confirmCardPayment } = useConfirmCardPayment()
await confirmCardPayment(clientSecret, { payment_method: 'pm_123' })
```

## Composables

### useConfirmCardPayment

Wraps [`stripe.confirmCardPayment()`](https://docs.stripe.com/js/payment_intents/confirm_card_payment). Use `stripe.confirmCardPayment` when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide and carry out 3DS or other next actions if they are required.

```ts
const { confirmCardPayment, loading, error } = useConfirmCardPayment()

// Stripe.js signature
confirmCardPayment(
  clientSecret: string,
  data?: ConfirmCardPaymentData,
  options?: ConfirmCardPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmCardSetup

Wraps [`stripe.confirmCardSetup()`](https://docs.stripe.com/js/setup_intents/confirm_card_setup). Use `stripe.confirmCardSetup` in the [Setup Intents API flow](https://docs.stripe.com/payments/save-and-reuse) when the customer submits your payment form. When called, it will confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents) with `data` you provide and carry out 3DS or other next actions if they are required.

```ts
const { confirmCardSetup, loading, error } = useConfirmCardSetup()

// Stripe.js signature
confirmCardSetup(
  clientSecret: string,
  data?: ConfirmCardSetupData,
  options?: ConfirmCardSetupOptions
): Promise<SetupIntentResult>
```
