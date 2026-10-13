# useCreatePaymentMethod

Create a [PaymentMethod](https://docs.stripe.com/api/payment_methods) with the raw Stripe instance. Wraps [`stripe.createPaymentMethod()`](https://docs.stripe.com/js/payment_methods/create_payment_method).

Must be called within a `<VueStripeProvider>` or an app that installs [`createVueStripe()`](/api/plugin). When called without `elements` or a manual `type`, the Elements instance provided by `<VueStripeElements>` is used automatically (the Payment Element flow).

## Usage

```vue
<script setup>
import { useCreatePaymentMethod } from '@vue-stripe/vue-stripe'

const { createPaymentMethod, loading, error } = useCreatePaymentMethod()

const onSubmit = async () => {
  // Payment Element flow — uses the injected elements automatically
  const { paymentMethod, error } = await createPaymentMethod()
  if (paymentMethod) {
    console.log(paymentMethod.id) // pm_xxx
  }
}
</script>
```

With a Card Element, pass the element instance explicitly:

```js
const { paymentMethod } = await createPaymentMethod({
  type: 'card',
  card: cardElementRef.value.element
})
```

## Return Value

```ts
interface UseCreatePaymentMethodReturn {
  createPaymentMethod: (options?: CreatePaymentMethodOptions) => Promise<CreatePaymentMethodResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

type CreatePaymentMethodResult = PaymentMethodResult | VueStripeErrorResult
```

| Property | Type | Description |
|----------|------|-------------|
| `createPaymentMethod` | `(options?: CreatePaymentMethodOptions) => Promise<CreatePaymentMethodResult>` | Creates a PaymentMethod; resolves to Stripe's `createPaymentMethod` result (`{ paymentMethod }` or `{ error }`). |
| `loading` | `Readonly<Ref<boolean>>` | `true` while the request is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | The error message if creation failed. |

When Stripe.js has not loaded yet, or the Stripe call throws, `createPaymentMethod` does not reject: it resolves to a `VueStripeErrorResult`, `{ error: { message } }` (e.g. `{ error: { message: 'Stripe not initialized' } }`). A failed `elements.submit()` resolves to `{ error }` with Stripe's submit error.

## Options

`CreatePaymentMethodOptions` is a passthrough of Stripe's `createPaymentMethod` params. Provide either `{ elements }` (or omit it to use the injected Elements) for the Payment Element flow, or `{ type, card, billing_details, ... }` for the manual flow.

| Field | Type | Description |
|-------|------|-------------|
| `elements` | `StripeElements` | Elements group to read from. Defaults to the one provided by `<VueStripeElements>` when `type` is not set |
| `type` | `string` | Manual flow: the payment method type (e.g. `'card'`) |
| `skipSubmit` | `boolean` | Skip the automatic `elements.submit()` before creating (Payment Element flow only). Defaults to `false` |
| ...rest | | Any other `stripe.createPaymentMethod()` param (`card`, `billing_details`, `params`, ...) |

In the Elements flow, `elements.submit()` runs first (as Stripe requires); the manual `{ type, card }` flow never submits.

## TypeScript

```ts
import { ref } from 'vue'
import { useCreatePaymentMethod, VueStripeCardElement } from '@vue-stripe/vue-stripe'
import type { CreatePaymentMethodResult } from '@vue-stripe/vue-stripe'

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { createPaymentMethod } = useCreatePaymentMethod()

const create = async (): Promise<string | null> => {
  const card = cardRef.value?.element
  if (!card) return null
  const result: CreatePaymentMethodResult = await createPaymentMethod({ type: 'card', card })
  return result.paymentMethod?.id ?? null
}
```

## See Also

- [Create a PaymentMethod to charge later](/guide/tokens#create-a-paymentmethod-to-charge-later) - Step-by-step guide
- [useCreateConfirmationToken](/api/composables/use-create-confirmation-token) - Confirm on your server instead
- [Payment objects](/guide/payment-objects#paymentmethods-confirmationtokens-and-tokens) - PaymentMethods, ConfirmationTokens and Tokens
- [Live demo](/live-demo/create-payment-method)
