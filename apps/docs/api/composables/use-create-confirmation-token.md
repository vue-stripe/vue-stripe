# useCreateConfirmationToken

Create a [ConfirmationToken](https://docs.stripe.com/api/confirmation_tokens) from the Payment Element and confirm the PaymentIntent or SetupIntent on your server. Wraps [`stripe.createConfirmationToken()`](https://docs.stripe.com/js/confirmation_tokens/create_confirmation_token).

Use it in the [finalize payments on the server](https://docs.stripe.com/payments/finalize-payments-on-the-server) flow: render the Payment Element with a deferred intent (`mode`, `amount` and `currency` props on `VueStripeElements`), create the token in the browser, then create and confirm the intent on your server with `confirmation_token`. If the intent then needs an action (3D Secure), finish it with [`useHandleNextAction`](/api/composables/use-handle-next-action). Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<!-- PayOnServer.vue: rendered inside <VueStripeProvider> and
     <VueStripeElements mode="payment" :amount="1099" currency="usd"> -->
<script setup lang="ts">
import { VueStripePaymentElement, useCreateConfirmationToken } from '@vue-stripe/vue-stripe'

const { createConfirmationToken, loading, error } = useCreateConfirmationToken()

const pay = async () => {
  // Runs elements.submit() first, then stripe.createConfirmationToken({ elements })
  const { confirmationToken } = await createConfirmationToken({
    params: { return_url: 'https://example.com/order/complete' }
  })
  if (!confirmationToken) return // error is set
  await fetch('/api/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmationToken: confirmationToken.id })
  })
}
</script>

<template>
  <VueStripePaymentElement />
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Options

```ts
interface CreateConfirmationTokenOptions {
  elements?: StripeElements
  params?: CreateConfirmationToken['params']
  skipSubmit?: boolean
}
```

| Option | Type | Description |
|--------|------|-------------|
| `elements` | `StripeElements` | Elements instance to read from. Defaults to the one injected by `<VueStripeElements>`. |
| `params` | `ConfirmationTokenCreateParams` | `return_url`, `payment_method_data`, `shipping`, ...; values here override what the Payment Element collected. |
| `skipSubmit` | `boolean` | Skip the automatic `elements.submit()` (default `false`). Set it only when you already called `elements.submit()`. |

## Return Value

```ts
interface UseCreateConfirmationTokenReturn {
  createConfirmationToken: (
    options?: CreateConfirmationTokenOptions
  ) => Promise<ConfirmationTokenResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `createConfirmationToken` | `(options?) => Promise<ConfirmationTokenResult>` | Submits the Elements, then creates the token; resolves to `{ confirmationToken }` or `{ error }`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while a call is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | Message of the last call's `{ error }` result or thrown error; reset when a call starts. |

`createConfirmationToken`:

- calls `elements.submit()` first, as Stripe requires. A validation error from `submit()` resolves as `{ error }` (and sets `error`) without creating a token.
- resolves to Stripe's result untouched; an `{ error }` result also sets `error`.
- rejects with `VueStripeElementsError` when there is no Elements instance (no `elements` option and no `<VueStripeElements>` around the component), and rejects when Stripe.js throws, after setting `error`. This is the same behavior as the [method confirmers](/api/composables/confirm/#return-value).

## TypeScript

```ts
import { useCreateConfirmationToken } from '@vue-stripe/vue-stripe'
import type {
  CreateConfirmationTokenOptions,
  UseCreateConfirmationTokenReturn
} from '@vue-stripe/vue-stripe'

const api: UseCreateConfirmationTokenReturn = useCreateConfirmationToken()
const options: CreateConfirmationTokenOptions = { params: { return_url: location.href } }
const { confirmationToken, error } = await api.createConfirmationToken(options)
```
