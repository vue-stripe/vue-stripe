---
description: "useHandleNextAction reference: complete 3D Secure or another required action on an Intent you confirmed on your server, from a Vue component."
---

# useHandleNextAction

Invoke the next required action (e.g. 3DS authentication) on a PaymentIntent or SetupIntent **without re-confirming it**. Wraps [`stripe.handleNextAction()`](https://docs.stripe.com/js/payment_intents/handle_next_action).

Useful when you confirm an intent server-side and only need the client to complete required actions. Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin).

## Usage

```vue
<script setup>
import { useHandleNextAction } from '@vue-stripe/vue-stripe'

const { handleNextAction, loading, error } = useHandleNextAction()

const finish = async (clientSecret) => {
  const { paymentIntent, error } = await handleNextAction({ clientSecret })
  if (paymentIntent?.status === 'succeeded') {
    // done
  }
}
</script>
```

## Return Value

```ts
interface UseHandleNextActionReturn {
  handleNextAction: (options: HandleNextActionOptions) => Promise<HandleNextActionResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

type HandleNextActionResult = PaymentIntentOrSetupIntentResult | VueStripeErrorResult
```

| Property | Type | Description |
|----------|------|-------------|
| `handleNextAction` | `(options: HandleNextActionOptions) => Promise<HandleNextActionResult>` | Runs the next action; resolves to Stripe's result (`{ paymentIntent }` / `{ setupIntent }` or `{ error }`). |
| `loading` | `Readonly<Ref<boolean>>` | `true` while an action is in progress (until the last of overlapping calls settles). |
| `error` | `Readonly<Ref<string \| null>>` | The error message if the action failed. |

When Stripe.js is not available (the plugin's load failed, for example; a call made while it loads waits for it), or the Stripe call throws, `handleNextAction` does not reject: it resolves to a `VueStripeErrorResult`, `{ error: { message } }` (e.g. `{ error: { message: 'Stripe not initialized' } }`), so one `if (result.error)` check covers every failure.

## Options

`HandleNextActionOptions` is one of two shapes, matching Stripe's two `handleNextAction` overloads:

```ts
type HandleNextActionOptions =
  | { clientSecret: string } // PaymentIntent / SetupIntent requiring an action
  | { hashedValue: string }  // shared payment token (Stripe.js 9.4+)
```

| Field | Type | Description |
|-------|------|-------------|
| `clientSecret` | `string` | Client secret of the PaymentIntent or SetupIntent requiring an action. |
| `hashedValue` | `string` | Hashed value of a shared payment token (agentic commerce, Stripe.js 9.4+). |

```ts
// Intent requiring an action
await handleNextAction({ clientSecret: 'pi_xxx_secret_xxx' })

// Shared payment token
await handleNextAction({ hashedValue: tokenHashedValue })
```

## TypeScript

```ts
import { useHandleNextAction } from '@vue-stripe/vue-stripe'
import type { HandleNextActionOptions, HandleNextActionResult } from '@vue-stripe/vue-stripe'

const { handleNextAction } = useHandleNextAction()

const run = async (options: HandleNextActionOptions): Promise<HandleNextActionResult> => {
  const result = await handleNextAction(options)
  if (result.error) console.error(result.error.message)
  return result
}
```

## See Also

- [useCreateConfirmationToken](/api/composables/use-create-confirmation-token) - Create the token your server confirms with
- [Confirm payments on your server](/guide/tokens#confirmationtoken-confirm-on-your-server) - Step-by-step guide
- [Next actions](/guide/confirming-payments#next-actions) - What a next action is
