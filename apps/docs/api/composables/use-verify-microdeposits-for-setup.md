# useVerifyMicrodepositsForSetup

Verify the customer's bank account of a SetupIntent with micro-deposits, for ACH Direct Debit and Canadian pre-authorized debits (ACSS). Wraps [`stripe.verifyMicrodepositsForSetup()`](https://docs.stripe.com/js/payment_intents/verify_microdeposits_for_setup).

When the customer enters bank details manually, Stripe sends micro-deposits and the SetupIntent waits in `requires_action`. Verify with the two amounts, or with the six-character descriptor code (starting with `SM`) when Stripe sent a single descriptor-code deposit. For a PaymentIntent, use [`useVerifyMicrodepositsForPayment`](/api/composables/use-verify-microdeposits-for-payment). Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<script setup lang="ts">
import { useVerifyMicrodepositsForSetup } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { verifyMicrodepositsForSetup, loading, error } = useVerifyMicrodepositsForSetup()

const verifyWithCode = async (code: string) => {
  const { setupIntent } = await verifyMicrodepositsForSetup(props.clientSecret, {
    descriptor_code: code // e.g. 'SM11AA'
  })
  return setupIntent?.status // 'succeeded' once verified
}

const verifyWithAmounts = (amounts: number[]) =>
  verifyMicrodepositsForSetup(props.clientSecret, { amounts })
</script>
```

## Return Value

```ts
const { verifyMicrodepositsForSetup, loading, error } = useVerifyMicrodepositsForSetup()
// UseStripeMethodReturn<'verifyMicrodepositsForSetup'>
```

| Property | Type | Description |
|----------|------|-------------|
| `verifyMicrodepositsForSetup` | `Stripe['verifyMicrodepositsForSetup']` | The Stripe.js method; resolves to `{ setupIntent }` or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

The method resolves to Stripe's result untouched and rejects when Stripe.js throws, after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## Stripe.js signature

```ts
verifyMicrodepositsForSetup(
  clientSecret: string,
  data?: { amounts?: number[]; descriptor_code?: string } // VerifyMicrodepositsForSetupData
): Promise<SetupIntentResult>
```
