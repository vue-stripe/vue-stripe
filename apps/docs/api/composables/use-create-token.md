# useCreateToken

Turn card details, bank account details, PII, or Connect account / person details into a single-use [Token](https://docs.stripe.com/api/tokens) that you send to your server. Wraps [`stripe.createToken()`](https://docs.stripe.com/js/tokens_sources/create_token?type=cardElement).

Tokens are the legacy way to collect payment details; new integrations create a PaymentMethod ([`useCreatePaymentMethod`](/api/composables/use-create-payment-method)) or a ConfirmationToken ([`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token)). Use `createToken` for Connect account and person tokens, PII tokens, CVC recollection, or an existing Charges / Sources integration. Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

::: tip Live demo
The [Tokens demo](/live-demo/tokens) creates a card Token from the Card Element.
:::

## Usage

```vue
<!-- TokenizeCard.vue: rendered inside <VueStripeProvider> and <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCardElement, useCreateToken } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { createToken, loading, error } = useCreateToken()
const tokenId = ref('')

const tokenize = async () => {
  const card = cardRef.value?.element
  if (!card) return
  const { token } = await createToken(card, { name: 'Jenny Rosen' })
  tokenId.value = token?.id ?? ''
}
</script>

<template>
  <VueStripeCardElement ref="cardRef" />
  <button :disabled="loading" @click="tokenize">Create token</button>
  <p v-if="error">{{ error }}</p>
  <p v-if="tokenId">Token {{ tokenId }}</p>
</template>
```

Every Stripe.js overload works, for example:

```ts
const { createToken } = useCreateToken()

await createToken('pii', { personal_id_number: '000000000' })
await createToken('bank_account', {
  country: 'US',
  currency: 'usd',
  routing_number: '110000000',
  account_number: '000123456789',
  account_holder_name: 'Jenny Rosen',
  account_holder_type: 'individual'
})
await createToken('account', { business_type: 'individual', tos_shown_and_accepted: true })
await createToken('cvc_update', cardCvcElement)
```

## Return Value

```ts
const { createToken, loading, error } = useCreateToken()
// UseStripeMethodReturn<'createToken'>
```

| Property | Type | Description |
|----------|------|-------------|
| `createToken` | `Stripe['createToken']` | The Stripe.js method with all its overloads; resolves to `{ token }` or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

`createToken` resolves to Stripe's result untouched and rejects when Stripe.js throws, after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## Stripe.js signature

```ts
createToken(tokenType: StripeCardElement | StripeCardNumberElement, data?: CreateTokenCardData): Promise<TokenResult>
createToken(tokenType: StripeIbanElement, data: CreateTokenIbanData): Promise<TokenResult>
createToken(tokenType: 'pii', data: CreateTokenPiiData): Promise<TokenResult>
createToken(tokenType: 'bank_account', data: CreateTokenBankAccountData): Promise<TokenResult>
createToken(tokenType: 'cvc_update', element: StripeCardCvcElement): Promise<TokenResult>
createToken(tokenType: 'account', data: TokenCreateParams.Account): Promise<TokenResult>
createToken(tokenType: 'person', data: TokenCreateParams.Person): Promise<TokenResult>
```

## See Also

- [Tokens and Radar sessions](/guide/tokens#tokens-and-radar-sessions) - Where tokens still fit
- [useCreatePaymentMethod](/api/composables/use-create-payment-method) - The current way to save payment details
- [Payment objects](/guide/payment-objects#paymentmethods-confirmationtokens-and-tokens) - PaymentMethods, ConfirmationTokens and Tokens
- [Live demo](/live-demo/tokens)
