---
description: "VueStripeExpressCheckoutElement reference: Apple Pay, Google Pay, Link, PayPal, Amazon Pay and Klarna buttons in Vue. Props, events and confirming."
---

# VueStripeExpressCheckoutElement

Renders wallet buttons (Apple Pay, Google Pay, Link, PayPal, Amazon Pay, Klarna) that the customer pays with in the wallet's own payment sheet. A button appears only when its wallet is enabled in the Dashboard and available on the customer's device and browser, and the page is served over HTTPS. That includes development: on `http://localhost` Stripe.js logs that Apple Pay and Google Pay will not appear, so [test them through an HTTPS tunnel](/guide/testing#wallets-apple-pay-and-google-pay). Use it inside [VueStripeElements](/api/components/stripe-elements) with a `clientSecret` or a deferred Intent (`mode` / `currency` / `amount`), or inside [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) (see [With Checkout Sessions](#with-checkout-sessions)). For the steps, see [Add Apple Pay, Google Pay and Link buttons](/guide/express-checkout); [Choosing an integration](/guide/approaches#express-checkout-and-the-payment-element) covers pairing it with the Payment Element.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <!-- ExpressButtons calls usePaymentIntent(), so it renders inside VueStripeElements -->
      <ExpressButtons :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import ExpressButtons from './ExpressButtons.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
</script>
```

```vue
<!-- ExpressButtons.vue -->
<script setup>
import { VueStripeExpressCheckoutElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: String })
const { confirmPayment } = usePaymentIntent()

// Stripe waits for resolve() before it opens the payment sheet
const onClick = (event) => event.resolve()

const onConfirm = async (event) => {
  const { error } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: window.location.href },
    redirect: 'if_required'
  })
  if (error) event.paymentFailed({ reason: 'fail' })
}
</script>

<template>
  <VueStripeExpressCheckoutElement
    :options="{ buttonType: { applePay: 'buy', googlePay: 'buy' } }"
    @click="onClick"
    @confirm="onConfirm"
  />
</template>
```

The `@confirm` event does not carry the Elements group. `usePaymentIntent()` confirms with the group provided by `VueStripeElements` and calls `elements.submit()` first.

### With Checkout Sessions

Inside a [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider), the component is created with `checkout.createExpressCheckoutElement()`. The Checkout SDK accepts only `buttonHeight`, `buttonTheme`, `buttonType`, `layout`, `paymentMethods` and `paymentMethodOrder`; other options are dropped.

::: warning Events that never fire with Checkout Sessions
Under Checkout Sessions, `@click`, `@shippingaddresschange` and `@shippingratechange` **never fire**: line items, shipping address and shipping rates come from the session. Listen to `@confirm` and pass the event to `confirm()`.
:::

```vue
<script setup>
import { VueStripeExpressCheckoutElement, useCheckoutSession } from '@vue-stripe/vue-stripe'

const { confirm } = useCheckoutSession()

const onConfirm = async (event) => {
  const result = await confirm({ expressCheckoutConfirmEvent: event })
  if (result.type === 'error') console.error(result.error.message)
}
</script>

<template>
  <VueStripeExpressCheckoutElement @confirm="onConfirm" />
</template>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeExpressCheckoutElementOptions` | No | Element configuration options |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.

`update()` only accepts some options. `applePay`, `business`, `buttonTheme`, `buttonType`, `lineItems`, `paymentMethods`, `shippingRates` and `wallets` are read when the element is created and never passed to `update()`; to change one, re-mount the component (e.g. with a `:key`). `business`, `lineItems`, `shippingRates` and `applePay` can also be set per payment, with `event.resolve()` in `@click`.
:::

### Options Object

Illustrative subset of `StripeExpressCheckoutElementOptions` from `@stripe/stripe-js`:

```ts
interface StripeExpressCheckoutElementOptions {
  buttonHeight?: number
  buttonType?: {
    applePay?: 'plain' | 'buy' | 'check-out' | 'subscribe' | 'add-money' | 'book' | 'contribute' | 'donate' | 'order' | 'reload' | 'rent' | 'support' | 'tip' | 'top-up'
    googlePay?: 'plain' | 'buy' | 'book' | 'checkout' | 'donate' | 'order' | 'pay' | 'subscribe'
  }
  buttonTheme?: {
    applePay?: 'black' | 'white' | 'white-outline'
    googlePay?: 'black' | 'white'
    paypal?: 'gold' | 'blue' | 'silver' | 'white' | 'black'
  }
  layout?: {
    maxColumns?: number  // Max buttons per row
    maxRows?: number     // Max rows to display
    overflow?: 'auto' | 'never'
  }
  paymentMethodOrder?: string[]
  paymentMethods?: {
    applePay?: 'auto' | 'always' | 'never'
    googlePay?: 'auto' | 'always' | 'never'
    link?: 'auto' | 'never'
    paypal?: 'auto' | 'never'
    amazonPay?: 'auto' | 'never'
    klarna?: 'auto' | 'never'
  }
  // Also: emailRequired, phoneNumberRequired, billingAddressRequired,
  // shippingAddressRequired, allowedShippingCountries, shippingRates,
  // lineItems, business, applePay
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeExpressCheckoutElementReadyEvent` | Emitted when mounted, includes available wallets |
| `@click` | `StripeExpressCheckoutElementClickEvent` | Emitted when a wallet button is clicked |
| `@confirm` | `StripeExpressCheckoutElementConfirmEvent` | Emitted when payment is authorized |
| `@cancel` | - | Emitted when customer cancels payment sheet |
| `@shippingaddresschange` | `StripeExpressCheckoutElementShippingAddressChangeEvent` | Emitted when shipping address changes. Call `event.resolve()` with updated line items/shipping rates, or `event.reject()` if the address is unsupported |
| `@shippingratechange` | `StripeExpressCheckoutElementShippingRateChangeEvent` | Emitted when shipping rate changes. Call `event.resolve()` with updated line items, or `event.reject()` if the rate is unsupported |
| `@loaderror` | `{ elementType: 'expressCheckout', error: StripeError }` | Emitted when the element fails to load |
| `@availablepaymentmethodschange` | `StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent` | Emitted when the wallets that can be shown change |
| `@focus` | `{ elementType: 'expressCheckout' }` | Emitted when a button gains focus |
| `@blur` | `{ elementType: 'expressCheckout' }` | Emitted when a button loses focus |
| `@escape` | `{ elementType: 'expressCheckout' }` | Emitted when the escape key is pressed |

Unlike the other element components, `@ready` emits Stripe's ready event (it carries `availablePaymentMethods`), not the element. Use the exposed `element` member to reach the Stripe element.

`@loaderror` also fires when creating the element fails (for example when the surrounding provider does not support it), with the payload `{ elementType: 'expressCheckout', error: { message } }`; the message is also shown through the `#error` slot. Inside a `VueStripeElements` that has neither a `clientSecret` nor a `mode`, the element is not created and `@loaderror` reports `VueStripeExpressCheckoutElement needs a VueStripeElements with a clientSecret or a mode`.

### Ready Event

```ts
interface StripeExpressCheckoutElementReadyEvent {
  availablePaymentMethods?: {
    applePay?: boolean
    googlePay?: boolean
    link?: boolean
  }
}
```

### Click event

`@click` fires when the customer clicks a wallet button. The component subscribes to Stripe's `click` event only when you listen to `@click`; without a listener the sheet opens with the options the element was created with. With a listener, Stripe waits for it: call `event.resolve()` (optionally with details) or `event.reject()` within one second, or the payment sheet does not open. `@shippingaddresschange` and `@shippingratechange` work the same way, with 20 seconds to call `resolve()` or `reject()`.

```ts
interface StripeExpressCheckoutElementClickEvent {
  elementType: 'expressCheckout'
  expressPaymentType: 'apple_pay' | 'google_pay' | 'amazon_pay' | 'link' | 'paypal' | 'klarna'
  resolve: (details?: ClickResolveDetails) => void
  reject: () => void
}

type ClickResolveDetails = {
  lineItems?: Array<{ name: string; amount: number }>
  shippingRates?: Array<{ id: string; amount: number; displayName: string }>
  emailRequired?: boolean
  phoneNumberRequired?: boolean
  billingAddressRequired?: boolean
  shippingAddressRequired?: boolean
  allowedShippingCountries?: string[]
  business?: { name: string }
  applePay?: ApplePayOption
}
```

### Confirm Event

```ts
interface StripeExpressCheckoutElementConfirmEvent {
  expressPaymentType: 'apple_pay' | 'google_pay' | 'amazon_pay' | 'link' | 'paypal' | 'klarna'
  billingDetails?: { name?: string; email?: string; phone?: string; address?: { ... } }
  shippingAddress?: { name: string; address: { ... } }
  shippingRate?: { id: string; amount: number; displayName: string }
  // Tell the wallet sheet the payment failed
  paymentFailed: (payload?: { reason?: 'fail' | 'invalid_shipping_address' | 'invalid_billing_address' | 'invalid_payment_data' | 'address_unserviceable'; message?: string }) => void
}
```

### Shipping events

`@shippingaddresschange` and `@shippingratechange` fire when the customer picks an address or a rate in the sheet. Call `event.resolve({ lineItems?, shippingRates? })` with the updated values, or `event.reject()` if the address or rate is unsupported:

```ts
const onShippingAddressChange = (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
  event.resolve({
    shippingRates: [{ id: 'standard', displayName: 'Standard Shipping', amount: 500 }]
  })
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading express checkout...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a load error or a creation error |

```vue
<VueStripeExpressCheckoutElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeExpressCheckoutElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeExpressCheckoutElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current load or creation error message |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | - | Not supported by this element (Stripe.js throws an `IntegrationError`). It is left out of the component's type, so calling it is a type error; at runtime it does nothing and logs a `[Vue Stripe]` warning |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `expressRef.value.element` is a `StripeExpressCheckoutElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeExpressCheckoutElement } from '@vue-stripe/vue-stripe'
import type { StripeExpressCheckoutElement } from '@stripe/stripe-js'

const expressRef = ref<InstanceType<typeof VueStripeExpressCheckoutElement> | null>(null)

const focus = () => expressRef.value?.focus()
const stripeElement = (): StripeExpressCheckoutElement | null => expressRef.value?.element ?? null
</script>

<template>
  <VueStripeExpressCheckoutElement ref="expressRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-express-checkout-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-express-checkout-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-express-checkout-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-express-checkout-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-express-checkout-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-express-checkout-element*` for this one.

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeExpressCheckoutElement } from '@vue-stripe/vue-stripe'
import type {
  StripeExpressCheckoutElement,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
  StripeError
} from '@stripe/stripe-js'

// Options
const options: StripeExpressCheckoutElementOptions = {
  buttonType: {
    applePay: 'buy',
    googlePay: 'buy'
  },
  buttonTheme: {
    applePay: 'black',
    googlePay: 'black'
  },
  layout: {
    maxColumns: 3,
    maxRows: 1
  }
}

// Event handlers
const handleReady = (event: StripeExpressCheckoutElementReadyEvent) => {
  console.log('Available wallets:', event.availablePaymentMethods)
}

const handleClick = (event: StripeExpressCheckoutElementClickEvent) => {
  event.resolve({})
}

const handleConfirm = (event: StripeExpressCheckoutElementConfirmEvent) => {
  console.log('Payment type:', event.expressPaymentType)
}

const handleShippingAddressChange = (
  event: StripeExpressCheckoutElementShippingAddressChangeEvent
) => {
  // event.resolve({ shippingRates, lineItems }) or event.reject()
  event.resolve({})
}

const handleShippingRateChange = (
  event: StripeExpressCheckoutElementShippingRateChangeEvent
) => {
  // event.resolve({ lineItems }) or event.reject()
  event.resolve({})
}

const handleLoadError = (
  event: { elementType: 'expressCheckout'; error: StripeError }
) => {
  console.error('Express checkout failed to load:', event.error.message)
}

// Template ref: type it with the component; `.element` is the Stripe element
const expressCheckoutRef = ref<InstanceType<typeof VueStripeExpressCheckoutElement> | null>(null)
const stripeElement = (): StripeExpressCheckoutElement | null =>
  expressCheckoutRef.value?.element ?? null
```

## See Also

- [VueStripeElements](/api/components/stripe-elements) - Parent container component
- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Parent for Checkout Sessions
- [VueStripePaymentElement](/api/components/stripe-payment-element) - Full payment form, often placed below the wallet buttons
- [usePaymentIntent](/api/composables/use-payment-intent) - Confirm the payment
- [Add Apple Pay, Google Pay and Link buttons](/guide/express-checkout) - Step-by-step guide
- [Stripe Express Checkout Element docs](https://docs.stripe.com/elements/express-checkout-element) - Official documentation
