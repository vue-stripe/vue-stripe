# useStripeElements

Returns the `StripeElements` group created by the nearest [`VueStripeElements`](/api/components/stripe-elements), with `submit`, `fetchUpdates` and `getElement`. Call it in a component rendered inside `VueStripeElements`. To confirm a payment or setup, use [`usePaymentIntent`](/api/composables/use-payment-intent) or [`useSetupIntent`](/api/composables/use-setup-intent): they use the same group and call `submit()` for you.

## Usage

```vue
<!-- PaymentStatus.vue, rendered inside VueStripeElements -->
<script setup>
import { useStripeElements } from '@vue-stripe/vue-stripe'

const { elements, loading, error } = useStripeElements()
</script>

<template>
  <p v-if="loading">Preparing the payment form...</p>
  <p v-else-if="error">{{ error }}</p>
</template>
```

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `elements` | `Readonly<Ref<StripeElements \| null>>` | The Elements instance |
| `submit` | `() => Promise<ElementsSubmitResult>` | Triggers form validation and collects data required for wallets (Apple Pay, Google Pay). Call before `confirmPayment`/`confirmSetup` |
| `fetchUpdates` | `() => Promise<{ error?: { message: string; status?: string } }>` | Re-fetches the Elements' data from Stripe after you updated the Intent on your server (e.g. a new amount). Wraps `elements.fetchUpdates()` |
| `getElement` | `StripeElements['getElement']` | Looks up the element of a type created on this Elements group, e.g. `getElement('payment')`. Typed through Stripe's per-type overloads; returns `null` when there is none |
| `loading` | `Readonly<Ref<boolean>>` | True while Elements is initializing |
| `error` | `Readonly<Ref<string \| null>>` | Error message if initialization failed |

The `elements`, `loading` and `error` return values are **readonly refs**; `submit`, `fetchUpdates` and `getElement` are functions. Called before the Elements group exists, `submit` and `fetchUpdates` resolve to `{ error: { message: 'Elements not initialized' } }` and `getElement` returns `null`, instead of throwing.

### submit

`submit()` wraps `elements.submit()`. It resolves to an `ElementsSubmitResult`: `{ error }` when validation fails, or `{ selectedPaymentMethod }` on success.

```ts
const { submit } = useStripeElements()

const { error } = await submit()
```

`usePaymentIntent`, `useSetupIntent`, `useCreatePaymentMethod` and `useCreateConfirmationToken` call it automatically before they call Stripe (`useCreatePaymentMethod` only in its Elements flow). Call it yourself only when you need to do something between validating and confirming (for example, create the Intent once the form is valid), and then pass `skipSubmit: true` to the confirming composable so it does not submit again. [Collect payment details before creating an Intent](/guide/deferred-intent#_2-validate-create-the-intent-then-confirm) walks through that flow.

### getElement

`getElement(type)` wraps `elements.getElement()`. It has the same overloads as Stripe's method, so the return type follows the element type you pass (`StripePaymentElement | null` for `'payment'`, `StripeCardElement | null` for `'card'`, and so on), and the Address Element's lookup options pass through:

```ts
const { getElement } = useStripeElements()

const payment = getElement('payment') // StripePaymentElement | null
const shipping = getElement('address', { mode: 'shipping' }) // StripeAddressElement | null
payment?.collapse()
```

It reads the current group on every call, so after `VueStripeElements` re-creates the group (a new `clientSecret` or amount) it returns the element remounted on the new group. To know when an `appearance` / `locale` update has been applied, listen to [`@update-end`](/api/components/stripe-elements#update-end) on `VueStripeElements`.

In the component that renders an element, prefer its exposed `element` through a template ref (`paymentRef.value?.element`); every element component exposes it.

### fetchUpdates

When your server changes the PaymentIntent (amount, currency, payment method options, ...) after the Payment Element has mounted, call `fetchUpdates()` so the mounted elements reflect it:

```ts
const { fetchUpdates } = useStripeElements()

const applyCoupon = async (code: string) => {
  // Your server updates the PaymentIntent amount
  await fetch('/api/apply-coupon', { method: 'POST', body: JSON.stringify({ code }) })

  const { error } = await fetchUpdates()
  if (error) console.error(error.message)
}
```

## Behaviour

Called outside `VueStripeElements`, `useStripeElements()` throws a `VueStripeElementsError`: `Elements context not found. Make sure to wrap your component with VueStripeElements.` Calling it in the same component that renders `VueStripeElements` counts as outside: call it in a child component.

## TypeScript

```ts
import { useStripeElements } from '@vue-stripe/vue-stripe'
import type { UseStripeElementsReturn, ElementsSubmitResult } from '@vue-stripe/vue-stripe'
import type { StripePaymentElement } from '@stripe/stripe-js'

const { submit, getElement }: UseStripeElementsReturn = useStripeElements()

const validate = async (): Promise<ElementsSubmitResult> => submit()

// Typed through Stripe's getElement overloads
const paymentElement: StripePaymentElement | null = getElement('payment')
```

## See Also

- [VueStripeElements](/api/components/stripe-elements) - The Elements provider component
- [useStripe](/api/composables/use-stripe) - Access the Stripe instance
- [usePaymentIntent](/api/composables/use-payment-intent) - Confirm a PaymentIntent with this group
- [Accept a payment with the Payment Element](/guide/payment-element)
- [Collect payment details before creating an Intent](/guide/deferred-intent) - `submit()`, then create the Intent, then confirm
- [How confirming works](/guide/confirming-payments#why-the-payment-element-is-submitted-first) - Why the Payment Element is submitted first
