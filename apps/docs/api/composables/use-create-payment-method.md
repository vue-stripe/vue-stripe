# useCreatePaymentMethod

Create a [PaymentMethod](https://docs.stripe.com/api/payment_methods) with the raw Stripe instance. Wraps [`stripe.createPaymentMethod()`](https://docs.stripe.com/js/payment_methods/create_payment_method).

Must be called within a `<VueStripeProvider>`. When called without `elements` or a manual `type`, the Elements instance provided by `<VueStripeElements>` is used automatically (the Payment Element flow).

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

| Property | Type | Description |
|----------|------|-------------|
| `createPaymentMethod` | `(options?: CreatePaymentMethodOptions) => Promise<any>` | Creates a PaymentMethod; resolves to Stripe's native `createPaymentMethod` result (`{ paymentMethod }` or `{ error }`). |
| `loading` | `Readonly<Ref<boolean>>` | `true` while the request is in flight. |
| `error` | `Readonly<Ref<string \| null>>` | The error message if creation failed. |

## Options

`CreatePaymentMethodOptions` is a passthrough of Stripe's `createPaymentMethod` params. Provide either `{ elements }` (or omit it to use the injected Elements) for the Payment Element flow, or `{ type, card, billing_details, ... }` for the manual flow.
