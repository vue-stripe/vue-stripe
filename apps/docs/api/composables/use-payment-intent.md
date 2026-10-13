# usePaymentIntent

Confirms a PaymentIntent with `stripe.confirmPayment()`, using the Elements group from the nearest [`VueStripeElements`](/api/components/stripe-elements), and tracks `loading` and `error`. Call it in a component rendered inside `VueStripeProvider` (or an app that installs [`createVueStripe()`](/api/plugin)); inside `VueStripeElements` it picks up the Elements group automatically. [Accept a payment with the Payment Element](/guide/payment-element) walks through the whole flow, and [How confirming works](/guide/confirming-payments) explains what confirming does.

## Usage

```vue
<!-- PayButton.vue, rendered inside VueStripeElements next to VueStripePaymentElement -->
<script setup>
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: { type: String, required: true } })

const { confirmPayment, loading, error } = usePaymentIntent()

const pay = async () => {
  const result = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` }
  })

  if (result.paymentIntent?.status === 'succeeded') {
    // Paid without a redirect
  }
}
</script>

<template>
  <button :disabled="loading" @click="pay">{{ loading ? 'Processing...' : 'Pay' }}</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Options

`confirmPayment(options)` takes a `ConfirmPaymentOptions`:

```ts
import type { ConfirmPaymentData, StripeElements } from '@stripe/stripe-js'

interface ConfirmPaymentOptions {
  clientSecret: string
  confirmParams?: ConfirmPaymentData
  redirect?: 'if_required' | 'always'
  elements?: StripeElements
  skipSubmit?: boolean
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientSecret` | `string` | — | Client secret from the PaymentIntent (required) |
| `confirmParams` | `ConfirmPaymentData` | `{}` | Stripe's confirmation parameters: `return_url`, `payment_method_data.billing_details`, `shipping`, ... |
| `redirect` | `'if_required' \| 'always'` | `'if_required'` | Redirect behavior. The default differs from Stripe's own (`'always'`): the promise resolves unless the payment method needs a redirect |
| `elements` | `StripeElements` | injected | Override the injected Elements instance |
| `skipSubmit` | `boolean` | `false` | Skip the automatic `elements.submit()` validation call before confirmation |

## Return Value

```ts
interface UsePaymentIntentReturn {
  confirmPayment: (options: ConfirmPaymentOptions) => Promise<ConfirmPaymentResult>
  retrievePaymentIntent: (clientSecret: string) => Promise<ConfirmPaymentResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `confirmPayment` | `(options: ConfirmPaymentOptions) => Promise<ConfirmPaymentResult>` | Confirm a payment |
| `retrievePaymentIntent` | `(clientSecret: string) => Promise<ConfirmPaymentResult>` | Look up a PaymentIntent by its client secret |
| `loading` | `Readonly<Ref<boolean>>` | Whether a confirm or retrieve is in progress |
| `error` | `Readonly<Ref<string \| null>>` | Error message from the last confirm or retrieve attempt |

### retrievePaymentIntent

Looks up the current status of a PaymentIntent by its client secret, for example on your `return_url` page after a redirect. It shares the `loading` / `error` refs with `confirmPayment`.

```ts
const { retrievePaymentIntent } = usePaymentIntent()

const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret')
if (clientSecret) {
  const { paymentIntent } = await retrievePaymentIntent(clientSecret)
  // paymentIntent?.status: 'succeeded', 'processing', 'requires_payment_method', ...
}
```

## Result

`confirmPayment` and `retrievePaymentIntent` resolve to a `ConfirmPaymentResult`, exported from the package:

```ts
import type { ConfirmPaymentResult, VueStripeErrorResult } from '@vue-stripe/vue-stripe'

// Stripe's own result, or the composable's error result
type ConfirmPaymentResult = PaymentIntentResult | VueStripeErrorResult

// PaymentIntentResult (from @stripe/stripe-js):
//   { paymentIntent: PaymentIntent; error?: undefined }
//   | { paymentIntent?: undefined; error: StripeError }

interface VueStripeErrorResult {
  error: { message: string }
  paymentIntent?: undefined
  setupIntent?: undefined
  paymentMethod?: undefined
}
```

With `redirect: 'always'`, or when the payment method needs a redirect, a successful confirmation navigates away instead of resolving.

## Automatic submit

Before calling `stripe.confirmPayment()`, `confirmPayment` calls `elements.submit()` to validate the form and collect wallet data, as Stripe requires for the Payment Element. If `submit()` reports a validation error, `confirmPayment` stops: `error.value` is set (to the validation message or `'Form validation failed'`) and the result resolves to `{ error: submitError }`; `stripe.confirmPayment()` is not called. Pass `skipSubmit: true` only when you already called [`submit()`](/api/composables/use-stripe-elements#submit) yourself. [Why the Payment Element is submitted first](/guide/confirming-payments#why-the-payment-element-is-submitted-first) explains the requirement.

## Error Handling

The promise never rejects. Every failure resolves to `{ error }` and sets `error.value`:

- a validation error from `elements.submit()`;
- Stripe's error (`StripeError`, with `type`, `code` and `decline_code`), for example a declined card;
- `{ error: { message: 'Stripe not initialized' } }` when Stripe.js has not loaded yet;
- `{ error: { message } }` when the Stripe call throws.

So one `if (result.error)` check covers every failure. Outside a provider, `usePaymentIntent()` itself throws a `VueStripeProviderError`. The [method confirmers overview](/api/composables/confirm/#return-value) lists which composables resolve `{ error }` and which reject.

## TypeScript

```ts
import { usePaymentIntent } from '@vue-stripe/vue-stripe'
import type {
  ConfirmPaymentOptions,
  ConfirmPaymentResult,
  UsePaymentIntentReturn
} from '@vue-stripe/vue-stripe'

const { confirmPayment }: UsePaymentIntentReturn = usePaymentIntent()

const pay = async (options: ConfirmPaymentOptions) => {
  const result: ConfirmPaymentResult = await confirmPayment(options)
  // result.paymentIntent is PaymentIntent | undefined
  // result.error is StripeError | { message: string } | undefined
}
```

## See Also

- [VueStripePaymentElement](/api/components/stripe-payment-element) - Payment UI component
- [VueStripeElements](/api/components/stripe-elements) - Elements container
- [useSetupIntent](/api/composables/use-setup-intent) - Save a payment method without charging
- [Accept a payment with the Payment Element](/guide/payment-element) - Step-by-step guide
- [How confirming works](/guide/confirming-payments) - Redirects, next actions and payments that settle later
