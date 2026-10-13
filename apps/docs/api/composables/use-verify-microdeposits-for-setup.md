---
description: "useVerifyMicrodepositsForSetup reference: verify a SetupIntent's bank account with micro-deposit amounts or a descriptor code for ACH and ACSS in Vue."
---

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

<template>
  <button :disabled="loading" @click="verifyWithCode('SM11AA')">Verify with code</button>
  <button :disabled="loading" @click="verifyWithAmounts([32, 45])">Verify with amounts</button>
  <p v-if="error">{{ error }}</p>
</template>
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

## See Also

- [useVerifyMicrodepositsForPayment](/api/composables/use-verify-microdeposits-for-payment) - The PaymentIntent variant
- [useFinancialConnections](/api/composables/use-financial-connections) - Collect the bank account
- [Payment methods that settle later](/guide/confirming-payments#payment-methods-that-settle-later)
- [Accept ACH Direct Debit](/guide/ach-debit#_4-verify-with-micro-deposits) - Verify with micro-deposits
- [Live demo](/live-demo/ach-debit)
