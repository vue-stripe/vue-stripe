---
title: "useRadarSession: Stripe Radar Sessions in Vue"
description: "useRadarSession reference: create a Stripe Radar Session in Vue to send device signals for fraud scoring when you collect payment details outside Stripe.js."
---

# useRadarSession

Create a [Radar Session](https://docs.stripe.com/radar/radar-session): a snapshot of the browser and device details that helps Radar score a payment, captured without tokenizing payment details on Stripe. Wraps `stripe.createRadarSession()`.

Use it when you collect payment details outside Stripe.js (for example, a server-side or third-party vault) or when saving card details, and still want Radar's device signals. Send `radarSession.id` to your server and pass it as `radar_options.session` when you create the PaymentIntent, SetupIntent or PaymentMethod. Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

::: tip Live demo
The [Tokens demo](/live-demo/tokens) creates a Radar Session.
:::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRadarSession } from '@vue-stripe/vue-stripe'

const { createRadarSession, loading, error } = useRadarSession()
const sent = ref(false)

const checkout = async () => {
  sent.value = false
  const { radarSession } = await createRadarSession()
  if (!radarSession) return // error is set
  // Your own route: it keeps the ID with the order (see below)
  const response = await fetch('/api/radar-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ radarSession: radarSession.id })
  })
  sent.value = response.ok
}
</script>

<template>
  <button :disabled="loading" @click="checkout">Continue</button>
  <p v-if="error">{{ error }}</p>
  <p v-if="sent">Radar session sent</p>
</template>
```

`/api/radar-session` is your own route, not one from the guides. It stores the `rse_...` ID with the order, and your server passes it when it creates the PaymentIntent:

```js
// Node.js (stripe-node), where your server creates the PaymentIntent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'usd',
  payment_method: paymentMethodId,
  confirm: true,
  radar_options: { session: radarSessionId } // the ID the browser sent
})
```

## Return Value

```ts
const { createRadarSession, loading, error } = useRadarSession()
// UseStripeMethodReturn<'createRadarSession'>
```

| Property | Type | Description |
|----------|------|-------------|
| `createRadarSession` | `Stripe['createRadarSession']` | The Stripe.js method; resolves to `{ radarSession }` (with an `id`, `rse_...`) or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

The composable is named after the Radar Session it creates; the method keeps its Stripe.js name. It resolves to Stripe's result untouched and rejects when Stripe.js throws, after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## Stripe.js signature

```ts
createRadarSession(): Promise<RadarSessionPayload>
```

## See Also

- [Tokens and Radar sessions](/guide/tokens#tokens-and-radar-sessions)
- [Fraud signals and privacy](/guide/security#fraud-signals-and-privacy) - What Stripe.js collects for Radar
- [Method confirmers](/api/composables/confirm/#return-value) - The shared return contract
