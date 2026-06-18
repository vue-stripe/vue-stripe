# useHandleNextAction

Invoke the next required action (e.g. 3DS authentication) on a PaymentIntent or SetupIntent **without re-confirming it**. Wraps [`stripe.handleNextAction()`](https://docs.stripe.com/js/payment_intents/handle_next_action).

Useful when you confirm an intent server-side and only need the client to complete required actions. Must be called within a `<VueStripeProvider>`.

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

| Property | Type | Description |
|----------|------|-------------|
| `handleNextAction` | `(options: HandleNextActionOptions) => Promise<any>` | Runs the next action; resolves to Stripe's native result (`{ paymentIntent }` / `{ setupIntent }` or `{ error }`). |
| `loading` | `Readonly<Ref<boolean>>` | `true` while the action is in progress. |
| `error` | `Readonly<Ref<string \| null>>` | The error message if the action failed. |

## Options

| Field | Type | Description |
|-------|------|-------------|
| `clientSecret` | `string` | Client secret of the PaymentIntent or SetupIntent requiring an action. |
