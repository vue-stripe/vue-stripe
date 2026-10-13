---
description: "useVerifyMicrodepositsForPayment reference: verify a PaymentIntent's bank account with micro-deposit amounts for ACH Direct Debit and ACSS in Vue."
---

# useVerifyMicrodepositsForPayment

Verify the customer's bank account of a PaymentIntent with micro-deposits, for ACH Direct Debit and Canadian pre-authorized debits (ACSS). Wraps [`stripe.verifyMicrodepositsForPayment()`](https://docs.stripe.com/js/payment_intents/verify_microdeposits_for_payment).

When the customer enters bank details manually, Stripe sends two micro-deposits and the PaymentIntent waits in `requires_action` (`next_action.type: 'verify_with_microdeposits'`). Collect the two amounts on a page of your own and verify them here. For a SetupIntent, use [`useVerifyMicrodepositsForSetup`](/api/composables/use-verify-microdeposits-for-setup). Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useVerifyMicrodepositsForPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const first = ref(32)
const second = ref(45)
const { verifyMicrodepositsForPayment, loading, error } = useVerifyMicrodepositsForPayment()

const verify = async () => {
  const { paymentIntent } = await verifyMicrodepositsForPayment(props.clientSecret, {
    amounts: [first.value, second.value] // in cents
  })
  return paymentIntent?.status // 'processing' once verified
}
</script>
```

## Return Value

```ts
const { verifyMicrodepositsForPayment, loading, error } = useVerifyMicrodepositsForPayment()
// UseStripeMethodReturn<'verifyMicrodepositsForPayment'>
```

| Property | Type | Description |
|----------|------|-------------|
| `verifyMicrodepositsForPayment` | `Stripe['verifyMicrodepositsForPayment']` | The Stripe.js method; resolves to `{ paymentIntent }` or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

The method resolves to Stripe's result untouched and rejects when Stripe.js throws, after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## Stripe.js signature

```ts
verifyMicrodepositsForPayment(
  clientSecret: string,
  data?: { amounts?: number[] } // VerifyMicrodepositsForPaymentData
): Promise<PaymentIntentResult>
```

## See Also

- [useVerifyMicrodepositsForSetup](/api/composables/use-verify-microdeposits-for-setup) - The SetupIntent variant
- [useFinancialConnections](/api/composables/use-financial-connections) - Collect the bank account
- [Payment methods that settle later](/guide/confirming-payments#payment-methods-that-settle-later)
- [Accept ACH Direct Debit](/guide/ach-debit#_4-verify-with-micro-deposits) - Verify with micro-deposits
- [Live demo](/live-demo/ach-debit)
