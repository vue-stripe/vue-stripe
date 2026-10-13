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
import { useRadarSession } from '@vue-stripe/vue-stripe'

const { createRadarSession, loading, error } = useRadarSession()

const checkout = async () => {
  const { radarSession } = await createRadarSession()
  if (!radarSession) return // error is set
  await fetch('/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ radarSession: radarSession.id })
  })
}
</script>

<template>
  <button :disabled="loading" @click="checkout">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
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
