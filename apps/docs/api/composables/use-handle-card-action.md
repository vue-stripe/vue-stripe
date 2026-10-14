---
description: "useHandleCardAction reference: run 3D Secure in Vue for a PaymentIntent confirmed on the server with manual confirmation, the legacy Stripe flow."
---

# useHandleCardAction

Run the card action (3D Secure) of a PaymentIntent that you confirm on the server with `confirmation_method: 'manual'`. Wraps [`stripe.handleCardAction()`](https://docs.stripe.com/js/payment_intents/handle_card_action).

`handleCardAction` belongs to the legacy manual-confirmation flow: after it resolves, the PaymentIntent is `requires_confirmation` and your server confirms it again. New integrations that confirm on the server use [`useHandleNextAction`](/api/composables/use-handle-next-action), which handles every action type and needs no second confirmation. Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useHandleCardAction } from '@vue-stripe/vue-stripe'

// clientSecret of a PaymentIntent in status requires_action
const props = defineProps<{ clientSecret: string }>()
const { handleCardAction, loading, error } = useHandleCardAction()
const status = ref('')

const authenticate = async () => {
  status.value = ''
  try {
    const { paymentIntent } = await handleCardAction(props.clientSecret)
    if (paymentIntent?.status !== 'requires_confirmation') return // error is set
    // Your server confirms the PaymentIntent again (see below)
    const response = await fetch('/api/confirm-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: paymentIntent.id })
    })
    status.value = response.ok ? (await response.json()).status : 'failed'
  } catch {
    // Stripe.js threw, for example for a PaymentIntent not in requires_action; error is set
  }
}
</script>

<template>
  <button :disabled="loading" @click="authenticate">Authenticate</button>
  <p v-if="error">{{ error }}</p>
  <p v-if="status">Payment {{ status }}</p>
</template>
```

`/api/confirm-payment-intent` is your own route. It confirms the PaymentIntent again. Your server created it with `confirmation_method: 'manual'`, `confirm: true` and `use_stripe_sdk: true`; the last one makes `handleCardAction()` run 3D Secure in a modal on your page. With only a `return_url`, Stripe.js sends the customer to the bank's page and back to `return_url` instead.

```js
// Node.js (Express-style handler)
app.post('/api/confirm-payment-intent', async (req, res) => {
  // Check that the PaymentIntent belongs to this customer's order first
  const paymentIntent = await stripe.paymentIntents.confirm(req.body.paymentIntentId, {
    // Required unless the PaymentIntent accepts no redirect-based payment methods
    return_url: 'https://example.com/checkout/complete'
  })
  res.json({ status: paymentIntent.status }) // 'succeeded', or 'requires_action' again
})
```

## Return Value

```ts
const { handleCardAction, loading, error } = useHandleCardAction()
// UseStripeMethodReturn<'handleCardAction'>
```

| Property | Type | Description |
|----------|------|-------------|
| `handleCardAction` | `Stripe['handleCardAction']` | The Stripe.js method; resolves to `{ paymentIntent }` or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

`handleCardAction` resolves to Stripe's result untouched and rejects when Stripe.js throws (for example when the PaymentIntent is not in `requires_action`), after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## Stripe.js signature

```ts
handleCardAction(clientSecret: string): Promise<PaymentIntentResult>
```

## See Also

- [useHandleNextAction](/api/composables/use-handle-next-action) - The current way to run next actions
- [Next actions](/guide/confirming-payments#next-actions) - What a next action is
