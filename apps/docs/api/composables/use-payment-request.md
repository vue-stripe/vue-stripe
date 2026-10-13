# usePaymentRequest

Show Apple Pay, Google Pay, Link or a browser-saved card behind your own button with the [Payment Request API](https://docs.stripe.com/js/payment_request). Wraps [`stripe.paymentRequest()`](https://docs.stripe.com/js/payment_request/create): creates the `PaymentRequest` once Stripe.js has loaded, checks for a wallet with `canMakePayment()`, forwards `show`, `update` and `abort`, and detaches your event handlers when the component unmounts.

::: warning Prefer the Express Checkout Element
Stripe recommends the [Express Checkout Element](/api/components/stripe-express-checkout-element) (`VueStripeExpressCheckoutElement`) for new integrations: it renders the wallet buttons for you and supports more payment methods. Stripe.js 10 removed the Payment Request Button element (`elements.create('paymentRequestButton')`), but the `stripe.paymentRequest()` API object remains. Use `usePaymentRequest` to keep an existing custom-button integration working.
:::

Must be called within a `<VueStripeProvider>` (or an app using `createVueStripe()`). No `<VueStripeElements>` is needed.

::: tip Live demo
The [Payment Request demo](/live-demo/payment-request) shows the `canMakePayment` result and pays through the browser sheet when a wallet is available.
:::

## Usage

```vue
<script setup>
import { usePaymentRequest, useConfirmCardPayment } from '@vue-stripe/vue-stripe'

const { confirmCardPayment } = useConfirmCardPayment()
const { canMakePayment, loading, error, show, on } = usePaymentRequest({
  country: 'US',
  currency: 'usd',
  total: { label: 'Order total', amount: 1099 },
  requestPayerName: true,
  requestPayerEmail: true
})

on('paymentmethod', async (event) => {
  // clientSecret of a PaymentIntent created on your server
  const { paymentIntent, error: confirmError } = await confirmCardPayment(
    clientSecret,
    { payment_method: event.paymentMethod.id },
    { handleActions: false }
  )
  // Tell the browser to close its payment interface.
  event.complete(confirmError ? 'fail' : 'success')
  // 3D Secure and other next actions run after the interface has closed.
  if (paymentIntent?.status === 'requires_action') await confirmCardPayment(clientSecret)
})

on('cancel', () => {
  // The customer closed the payment interface.
})
</script>

<template>
  <p v-if="loading">Checking for a wallet...</p>
  <button v-else-if="canMakePayment" @click="show">Pay now</button>
  <p v-else>No wallet is available in this browser.</p>
  <p v-if="error">{{ error }}</p>
</template>
```

`show()` must run inside a user gesture (a click handler). To change the amount right before the sheet opens, call `update()` in the same handler, before `show()`:

```ts
const pay = () => {
  update({ total: { label: 'Order total', amount: cartTotal.value } })
  show()
}
```

### Checking for a wallet

`canMakePayment` starts as `null` and holds the result of `paymentRequest.canMakePayment()` once it settles, for example `{ applePay: false, googlePay: true, link: false }`. Stripe resolves `null` when the browser has no usable wallet, so read it together with `loading`:

| `loading` | `canMakePayment` | Meaning |
|-----------|------------------|---------|
| `true` | `null` | Still checking. |
| `false` | an object | A wallet is ready; show your button. |
| `false` | `null` | No wallet in this browser (or the check failed: see `error`). |

Wallets need HTTPS (or `localhost`), a registered domain for Apple Pay and Google Pay, and a browser with a saved card or a wallet set up. Headless and private browser windows usually resolve `null`.

### Events

Register handlers with `on(event, handler)`. Handlers registered before Stripe.js has loaded are attached as soon as the `PaymentRequest` exists. `on` returns a function that removes the handler; `off(event, handler)` does the same, and `off(event)` removes every handler you registered for that event. `once(event, handler)` works like `on` but removes the handler after its first event (remove it earlier with the function it returns).

| Event | Payload | When |
|-------|---------|------|
| `paymentmethod` | `PaymentRequestPaymentMethodEvent` | The customer authorized the payment; Stripe created a PaymentMethod. Call `event.complete(status)` within 30 seconds. |
| `token` | `PaymentRequestTokenEvent` | The same, with a Token (legacy Charges integrations). |
| `source` | `PaymentRequestSourceEvent` | The same, with a Source (legacy). |
| `cancel` | none | The customer closed the payment interface. Some browsers send it even after a successful authorization. |
| `shippingaddresschange` | `PaymentRequestShippingAddressEvent` | The customer picked a shipping address (with `requestShipping: true`). Call `event.updateWith(details)` within 30 seconds. |
| `shippingoptionchange` | `PaymentRequestShippingOptionEvent` | The customer picked a shipping option. Call `event.updateWith(details)`. |

When the calling component unmounts (or its effect scope stops), every handler registered through `on` is removed with `paymentRequest.off()`. If the payment interface is still showing at that point, it is closed with `abort()`, so a payment cannot reach handlers that no longer exist.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `PaymentRequestOptions` | Passed to `stripe.paymentRequest()`: `country`, `currency`, `total` (required), and optionally `displayItems`, `requestPayerName`, `requestPayerEmail`, `requestPayerPhone`, `requestShipping`, `shippingOptions`, `disableWallets`, `applePay`, `onBehalfOf`. Read once; change the amount later with `update()`. |

## Return Value

```ts
interface UsePaymentRequestReturn {
  paymentRequest: Readonly<Ref<PaymentRequest | null>>
  canMakePayment: Readonly<Ref<CanMakePaymentResult | null>>
  show: () => void
  update: (options: PaymentRequestUpdateOptions) => void
  abort: () => void
  isShowing: () => boolean
  on: <K extends PaymentRequestEventType>(
    event: K,
    handler: PaymentRequestEventHandler<K>
  ) => () => void
  once: <K extends PaymentRequestEventType>(
    event: K,
    handler: PaymentRequestEventHandler<K>
  ) => () => void
  off: <K extends PaymentRequestEventType>(
    event: K,
    handler?: PaymentRequestEventHandler<K>
  ) => void
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `paymentRequest` | `Readonly<Ref<PaymentRequest \| null>>` | The Stripe.js `PaymentRequest`, or `null` until Stripe.js has loaded. Use it for anything not wrapped here. |
| `canMakePayment` | `Readonly<Ref<CanMakePaymentResult \| null>>` | The wallets `canMakePayment()` reported, or `null` (see above). |
| `show` | `() => void` | Opens the browser's payment interface. Call it from a click handler. |
| `update` | `(options: PaymentRequestUpdateOptions) => void` | Updates `currency`, `total`, `displayItems`, `shippingOptions` or `applePay`. Stripe does not allow it while the interface is showing. |
| `abort` | `() => void` | Closes the payment interface. |
| `isShowing` | `() => boolean` | `true` while the payment interface is showing. |
| `on` | `(event, handler) => () => void` | Adds an event handler; returns a function that removes it. |
| `once` | `(event, handler) => () => void` | Like `on`, but the handler is removed after its first event; returns a function that removes it earlier. |
| `off` | `(event, handler?) => void` | Removes a handler added with `on`, or all of them for `event`. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while `canMakePayment()` is pending. |
| `error` | `Readonly<Ref<string \| null>>` | The last error, or `null`. |

`show`, `update` and `abort` never throw. Called before the `PaymentRequest` exists they set `error` to `'PaymentRequest is not ready'`; an error Stripe.js throws lands on `error` too: `show()` without an available wallet gives `'Payment Request is not available in this browser.'` (Stripe.js 10, observed October 2026), and `update()` while the interface is showing is rejected. A successful call clears it. Invalid `options` (Stripe.js throws from `stripe.paymentRequest()`) and a rejected `canMakePayment()` are reported on `error` as well.

If the Stripe instance changes (for example the provider's publishable key changes), the composable creates a new `PaymentRequest` from the new instance, moves your handlers to it and checks for a wallet again.

## TypeScript

```ts
import { usePaymentRequest } from '@vue-stripe/vue-stripe'
import type {
  PaymentRequestOptions,
  PaymentRequestEventHandler,
  PaymentRequestShippingOption
} from '@vue-stripe/vue-stripe'

const shippingOptions: PaymentRequestShippingOption[] = [
  { id: 'standard', label: 'Standard', detail: '3-5 days', amount: 0 }
]

const options: PaymentRequestOptions = {
  country: 'US',
  currency: 'usd',
  total: { label: 'Order total', amount: 1099 },
  requestShipping: true,
  shippingOptions
}

const { on } = usePaymentRequest(options)

const onAddress: PaymentRequestEventHandler<'shippingaddresschange'> = (event) => {
  event.updateWith({ status: 'success', shippingOptions })
}
on('shippingaddresschange', onAddress)
```

The Stripe.js types `PaymentRequest`, `PaymentRequestOptions`, `PaymentRequestUpdateOptions`, `PaymentRequestItem`, `PaymentRequestShippingOption`, `PaymentRequestShippingAddress`, `PaymentRequestWallet`, `PaymentRequestCompleteStatus`, `PaymentRequestUpdateDetails`, `CanMakePaymentResult` and the five event payload types are re-exported from `@vue-stripe/vue-stripe`.
