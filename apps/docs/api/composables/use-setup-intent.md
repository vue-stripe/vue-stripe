---
description: "useSetupIntent reference: confirm a SetupIntent from the Payment Element in Vue to save a payment method for later, with loading and error refs."
---

# useSetupIntent

Confirms a SetupIntent with `stripe.confirmSetup()`, using the Elements group from the nearest [`VueStripeElements`](/api/components/stripe-elements), and tracks `loading` and `error`. A SetupIntent saves a payment method for later without charging it. Call it in a component rendered inside `VueStripeProvider` (or an app that installs [`createVueStripe()`](/api/plugin)); inside `VueStripeElements` it picks up the Elements group automatically. [Save a payment method for later](/guide/setup-intent) walks through the flow, and [PaymentIntent or SetupIntent](/guide/payment-objects#paymentintent-or-setupintent) explains which to use.

## Usage

```vue
<!-- SaveCardButton.vue, rendered inside VueStripeElements next to VueStripePaymentElement -->
<script setup>
import { useSetupIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: { type: String, required: true } })

const { confirmSetup, loading, error } = useSetupIntent()

const save = async () => {
  const result = await confirmSetup({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/account/cards` }
  })

  if (result.setupIntent?.status === 'succeeded') {
    // Saved without a redirect; result.setupIntent.payment_method is the saved method
  }
}
</script>

<template>
  <button :disabled="loading" @click="save">{{ loading ? 'Saving...' : 'Save card' }}</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Options

`confirmSetup(options)` takes a `ConfirmSetupOptions`:

```ts
import type { StripeElements } from '@stripe/stripe-js'

interface ConfirmSetupOptions {
  clientSecret: string
  confirmParams?: {
    return_url?: string
    payment_method_data?: {
      billing_details?: {
        name?: string
        email?: string
        phone?: string
        address?: {
          line1?: string
          line2?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
        }
      }
    }
  }
  redirect?: 'if_required' | 'always'
  elements?: StripeElements
  skipSubmit?: boolean
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientSecret` | `string` | — | Client secret from the SetupIntent (required) |
| `confirmParams` | object | `{}` | `return_url` and `payment_method_data.billing_details`, passed to `stripe.confirmSetup()` |
| `redirect` | `'if_required' \| 'always'` | `'if_required'` | Redirect behavior. The default differs from Stripe's own (`'always'`): the promise resolves unless the payment method needs a redirect |
| `elements` | `StripeElements` | injected | Override the injected Elements instance |
| `skipSubmit` | `boolean` | `false` | Skip the automatic `elements.submit()` validation call before confirmation |

## Return Value

```ts
interface UseSetupIntentReturn {
  confirmSetup: (options: ConfirmSetupOptions) => Promise<ConfirmSetupResult>
  retrieveSetupIntent: (clientSecret: string) => Promise<ConfirmSetupResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `confirmSetup` | `(options: ConfirmSetupOptions) => Promise<ConfirmSetupResult>` | Confirm a setup intent |
| `retrieveSetupIntent` | `(clientSecret: string) => Promise<ConfirmSetupResult>` | Look up a SetupIntent by its client secret |
| `loading` | `Readonly<Ref<boolean>>` | Whether a confirm or retrieve is in progress |
| `error` | `Readonly<Ref<string \| null>>` | Error message from the last confirm or retrieve attempt |

### retrieveSetupIntent

Looks up the current status of a SetupIntent by its client secret, for example on your `return_url` page after a redirect. It shares the `loading` / `error` refs with `confirmSetup`.

```ts
const { retrieveSetupIntent } = useSetupIntent()

const clientSecret = new URLSearchParams(window.location.search).get('setup_intent_client_secret')
if (clientSecret) {
  const { setupIntent } = await retrieveSetupIntent(clientSecret)
  // setupIntent?.status: 'succeeded', 'processing', 'requires_payment_method', ...
}
```

## Result

`confirmSetup` and `retrieveSetupIntent` resolve to a `ConfirmSetupResult`, exported from the package:

```ts
import type { ConfirmSetupResult, VueStripeErrorResult } from '@vue-stripe/vue-stripe'

// Stripe's own result, or the composable's error result
type ConfirmSetupResult = SetupIntentResult | VueStripeErrorResult

// SetupIntentResult (from @stripe/stripe-js):
//   { setupIntent: SetupIntent; error?: undefined }
//   | { setupIntent?: undefined; error: StripeError }

interface VueStripeErrorResult {
  error: { message: string }
  paymentIntent?: undefined
  setupIntent?: undefined
  paymentMethod?: undefined
}
```

With `redirect: 'always'`, or when the payment method needs a redirect, a successful confirmation navigates away instead of resolving.

## Automatic submit

Before calling `stripe.confirmSetup()`, `confirmSetup` calls `elements.submit()` to validate the form and collect wallet data, as Stripe requires for the Payment Element. If `submit()` reports a validation error, `confirmSetup` stops: `error.value` is set (to the validation message or `'Form validation failed'`) and the result resolves to `{ error: submitError }`; `stripe.confirmSetup()` is not called. Pass `skipSubmit: true` only when you already called [`submit()`](/api/composables/use-stripe-elements#submit) yourself.

## Error Handling

The promise never rejects. Every failure resolves to `{ error }` and sets `error.value`: a validation error from `elements.submit()`, Stripe's error (`StripeError`, with `type` and `code`), `{ error: { message: 'Stripe not initialized' } }` when Stripe.js is not available (outside a loaded provider, or the plugin's load failed; under the plugin a call made while Stripe.js loads waits for it), or `{ error: { message } }` when the Stripe call throws. Outside a provider, `useSetupIntent()` itself throws a `VueStripeProviderError`. The [method confirmers overview](/api/composables/confirm/#return-value) lists which composables resolve `{ error }` and which reject. [Handle errors and declines](/guide/error-handling#_3-handle-confirmation-errors) shows how to branch on the error type.

## TypeScript

```ts
import { useSetupIntent } from '@vue-stripe/vue-stripe'
import type {
  ConfirmSetupOptions,
  ConfirmSetupResult,
  UseSetupIntentReturn
} from '@vue-stripe/vue-stripe'

// useSave.ts: call useSave() in a component's setup
export function useSave() {
  const { confirmSetup }: UseSetupIntentReturn = useSetupIntent()

  const save = async (options: ConfirmSetupOptions): Promise<ConfirmSetupResult> => {
    const result = await confirmSetup(options)
    // result.setupIntent is SetupIntent | undefined
    // result.error is StripeError | { message: string } | undefined
    return result
  }

  return { save }
}
```

## See Also

- [VueStripePaymentElement](/api/components/stripe-payment-element) - Payment UI component
- [VueStripeElements](/api/components/stripe-elements) - Elements container
- [usePaymentIntent](/api/composables/use-payment-intent) - Charge immediately
- [Save a payment method for later](/guide/setup-intent) - Step-by-step guide, including the server code
- [Payment objects](/guide/payment-objects#paymentintent-or-setupintent) - SetupIntent or PaymentIntent
- [Start a subscription](/guide/subscriptions#option-c-save-a-card-then-subscribe) - Save a card, then subscribe
- [Handle errors and declines](/guide/error-handling) - Show validation and confirmation errors
- [Stripe SetupIntents docs](https://docs.stripe.com/payments/setup-intents)
