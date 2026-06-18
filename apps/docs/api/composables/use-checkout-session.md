# useCheckoutSession

Drives a **Custom Checkout** session from inside a [`VueStripeCheckoutProvider`](/api/components/stripe-checkout-provider). Returns the reactive session state plus the Checkout Session methods (`confirm`, `applyPromotionCode`, `updateEmail`, …).

::: tip Usage context
Must be called within a `VueStripeCheckoutProvider` (which itself must be inside a `VueStripeProvider`). Calling it elsewhere throws `VueStripeCheckoutError`.
:::

## Usage

```vue
<script setup>
import { useCheckoutSession } from '@vue-stripe/vue-stripe'

const {
  session,            // reactive snapshot
  confirm,
  updateEmail,
  applyPromotionCode,
  loading,
  error
} = useCheckoutSession()

const onPay = async () => {
  const result = await confirm({ returnUrl: `${window.location.origin}/complete` })
  if (result.type === 'error') {
    console.error(result.error.message)
  }
}
</script>

<template>
  <p>Total: {{ session?.total?.total?.amount }}</p>
  <input :value="session?.email" @change="e => updateEmail(e.target.value)" />
  <button :disabled="!session?.canConfirm" @click="onPay">Pay</button>
</template>
```

## Return Value

```ts
interface UseCheckoutSessionReturn {
  checkout: Readonly<Ref<StripeCheckout | null>>
  session: Readonly<Ref<StripeCheckoutSession | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  getSession: () => StripeCheckoutSession | null
  // Session methods — signatures come straight from @stripe/stripe-js
  confirm: StripeCheckout['confirm']
  applyPromotionCode: StripeCheckout['applyPromotionCode']
  removePromotionCode: StripeCheckout['removePromotionCode']
  updateEmail: StripeCheckout['updateEmail']
  updatePhoneNumber: StripeCheckout['updatePhoneNumber']
  updateBillingAddress: StripeCheckout['updateBillingAddress']
  updateShippingAddress: StripeCheckout['updateShippingAddress']
  updateLineItemQuantity: StripeCheckout['updateLineItemQuantity']
  updateShippingOption: StripeCheckout['updateShippingOption']
  updateTaxIdInfo: StripeCheckout['updateTaxIdInfo']
  runServerUpdate: StripeCheckout['runServerUpdate']
  changeAppearance: StripeCheckout['changeAppearance']
}
```

| Member | Description |
|--------|-------------|
| `session` | Reactive session snapshot, kept in sync with Stripe's `change` event |
| `getSession()` | Imperative snapshot of the current session (prefer the reactive `session`) |
| `confirm(options?)` | Confirm the checkout. Returns `{ type: 'success', session }` or `{ type: 'error', error }` |
| `applyPromotionCode(code)` / `removePromotionCode()` | Manage promotion codes |
| `updateEmail(email)` / `updatePhoneNumber(phone)` | Update contact info |
| `updateBillingAddress(addr)` / `updateShippingAddress(addr)` | Update addresses (pass `null` to clear) |
| `updateLineItemQuantity({ lineItem, quantity })` | Change a line item's quantity |
| `updateShippingOption(id)` / `updateTaxIdInfo(info)` | Update shipping option / tax ID |
| `runServerUpdate(fn)` | Run a server-side update inside the session |
| `changeAppearance(appearance)` | Restyle the Checkout Elements at runtime |
| `loading` / `error` | Initialization state, shared with the provider |

::: info Result shape
The update / confirm methods resolve to Stripe's discriminated result: `{ type: 'success'; session }` on success or `{ type: 'error'; error }` on failure — always branch on `result.type`.
:::

## Building the form

`useCheckoutSession` manages session **state and actions**. The input fields themselves are Checkout Elements created from the `checkout` instance (e.g. `checkout.createPaymentElement()`), which you can reach via the provider's default slot or `checkout.value`. See the [Custom Checkout guide](https://docs.stripe.com/checkout/custom/quickstart) for the full element set.

## See Also

- [VueStripeCheckoutProvider](/api/components/stripe-checkout-provider) — required parent
