---
description: "useHandleCardAction reference: run 3D Secure in Vue for a PaymentIntent confirmed on the server with manual confirmation, the legacy Stripe flow."
---

# useHandleCardAction

Run the card action (3D Secure) of a PaymentIntent that you confirm on the server with `confirmation_method: 'manual'`. Wraps [`stripe.handleCardAction()`](https://docs.stripe.com/js/payment_intents/handle_card_action).

`handleCardAction` belongs to the legacy manual-confirmation flow: after it resolves, the PaymentIntent is `requires_confirmation` and your server confirms it again. New integrations that confirm on the server use [`useHandleNextAction`](/api/composables/use-handle-next-action), which handles every action type and needs no second confirmation. Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<script setup lang="ts">
import { useHandleCardAction } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { handleCardAction, loading, error } = useHandleCardAction()

// clientSecret of a PaymentIntent in status requires_action
const authenticate = async (clientSecret: string) => {
  const { paymentIntent } = await handleCardAction(clientSecret)
  if (paymentIntent?.status === 'requires_confirmation') {
    await fetch('/api/confirm', { method: 'POST', body: paymentIntent.id })
  }
}
</script>

<template>
  <button :disabled="loading" @click="authenticate(props.clientSecret)">Authenticate</button>
  <p v-if="error">{{ error }}</p>
</template>
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
