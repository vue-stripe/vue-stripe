---
description: "useEphemeralKeyNonce reference: create the nonce Stripe Issuing Elements need before they show a card's details, then the ephemeral key on your server."
---

# useEphemeralKeyNonce

Create the single-use nonce that [Stripe Issuing](https://docs.stripe.com/issuing/elements) needs before its card elements (`issuingCardNumberDisplay`, `issuingCardCvcDisplay`, ...) can show a card's details. Wraps [`stripe.createEphemeralKeyNonce()`](https://docs.stripe.com/js/issuing/create_ephemeral_key_nonce).

The flow: create a nonce for the card in the browser, send it to your server, create an [ephemeral key](https://docs.stripe.com/issuing/elements#create-an-ephemeral-key) there with `nonce` and `issuing_card`, return its secret, and create the Issuing elements with `issuingCard`, `nonce` and `ephemeralKeySecret`. Requires Stripe Issuing on your account. Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<script setup lang="ts">
import { useEphemeralKeyNonce } from '@vue-stripe/vue-stripe'

const props = defineProps<{ issuingCard: string }>() // ic_...
const { createEphemeralKeyNonce, loading, error } = useEphemeralKeyNonce()

const reveal = async () => {
  const { nonce } = await createEphemeralKeyNonce({ issuingCard: props.issuingCard })
  if (!nonce) return // error is set
  const res = await fetch('/api/ephemeral-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issuingCard: props.issuingCard, nonce })
  })
  const { ephemeralKeySecret } = await res.json()
  return { issuingCard: props.issuingCard, nonce, ephemeralKeySecret }
}
</script>

<template>
  <button :disabled="loading" @click="reveal">Show card details</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Return Value

```ts
const { createEphemeralKeyNonce, loading, error } = useEphemeralKeyNonce()
// UseStripeMethodReturn<'createEphemeralKeyNonce'>
```

| Property | Type | Description |
|----------|------|-------------|
| `createEphemeralKeyNonce` | `Stripe['createEphemeralKeyNonce']` | The Stripe.js method; resolves to `{ nonce }` or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

The method resolves to Stripe's result untouched and rejects when Stripe.js throws, after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## Stripe.js signature

```ts
createEphemeralKeyNonce(options: { issuingCard: string }): Promise<EphemeralKeyNonceResult>
```

## See Also

- [Display issued card details](/guide/issuing) - The full nonce and ephemeral key flow
- [Issuing Elements](/api/components/stripe-issuing-elements) - The components that take the nonce
