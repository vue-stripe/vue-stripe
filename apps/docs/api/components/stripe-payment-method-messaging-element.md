---
description: "VueStripePaymentMethodMessagingElement reference: show Affirm, Klarna and Afterpay messaging for an amount and currency on Vue product and cart pages."
---

# VueStripePaymentMethodMessagingElement

Displays buy-now-pay-later messaging (Affirm, Klarna, Afterpay / Clearpay) for an amount and currency. Wraps [`elements.create('paymentMethodMessaging')`](https://docs.stripe.com/js/element/payment_method_messaging_element). Use it inside [VueStripeElements](/api/components/stripe-elements). It is display-only: it collects no payment details. To add it to a product page, see [Show buy-now-pay-later messaging](/guide/payment-method-messaging).

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripePaymentMethodMessagingElement
        :options="{
          amount: 1099,
          currency: 'USD',
          paymentMethodTypes: ['klarna', 'afterpay_clearpay', 'affirm'],
          countryCode: 'US'
        }"
        @ready="onReady"
      />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const onReady = () => console.log('messaging ready')
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripePaymentMethodMessagingElementOptions` | No | Element options. Stripe requires `amount` and `currency`; see [Options](#options) |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`. Bind a computed `amount` to keep the message in step with the price.
:::

### Options

| Option | Type | Description |
|--------|------|-------------|
| `amount` | `number` | Required. Price in the smallest currency unit |
| `currency` | `'USD' \| 'EUR' \| 'GBP' \| ...` | Required. Upper-case ISO currency code (`AUD`, `CAD`, `CHF`, `CZK`, `DKK`, `EUR`, `GBP`, `NOK`, `NZD`, `PLN`, `SEK`, `USD`) |
| `countryCode` | `'US' \| 'GB' \| 'DE' \| ...` | The customer's country. Decides which providers can be offered. Optional, but pass it: without it Stripe uses the visitor's location, and for a country it doesn't support the element fails to load (`@loaderror`) |
| `paymentMethodTypes` | `Array<'affirm' \| 'klarna' \| 'afterpay_clearpay'>` | The providers to show. Optional in Stripe's types, but with Stripe.js Endive the element renders nothing without it |
| `paymentMethodOrder` | `Array<'affirm' \| 'klarna' \| 'afterpay_clearpay'>` | Fixed display order. By default Stripe orders them per customer |
| `paymentMethods` | `Array<'affirm' \| 'klarna' \| 'afterpay_clearpay'>` | Deprecated by Stripe; use `paymentMethodTypes` |
| `metaData` | `{ messagingClientReferenceId: string \| null }` | Reference ID passed to Stripe |

`@stripe/stripe-js` 10 also declares `logoColor`, but Stripe.js Endive rejects it: `elements.create()` and every `update()` log "Unrecognized ... parameter: logoColor is not a recognized parameter" and the logos keep their default look. Leave it out.

`paymentMethodTypes` here is this element's own option (which messages to show). It is unrelated to the `paymentMethodTypes` prop that was removed from `VueStripeElements` in v6. [Stripe's reference](https://docs.stripe.com/js/element/payment_method_messaging_element) lists the supported currency and country combinations.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripePaymentMethodMessagingElement` | Emitted when the element is mounted and ready |
| `@loaderror` | `{ elementType: 'paymentMethodMessaging', error }` | Emitted when the messaging fails to load, for example without `countryCode` for a visitor in a country Stripe doesn't support, or when the element can't be created. Ends the loading state and shows the `#error` slot |

The element is display-only, so it has no `@change`, `@focus`, `@blur` or `@escape`. Stripe.js 10's types declare only `ready` for this element, but Stripe.js emits `loaderror` at runtime and then destroys the element itself; the component listens for it, and unmounts cleanly afterwards. Stripe's load error carries no message, so `error` reads "Element failed to load".

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading payment method messaging...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a creation error or a load error (`@loaderror`) |

```vue
<VueStripePaymentMethodMessagingElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripePaymentMethodMessagingElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripePaymentMethodMessagingElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` or `loaderror` |
| `error` | `Ref<string \| null>` | Current creation or load error message |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `messagingRef.value.element` is a `StripePaymentMethodMessagingElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePaymentMethodMessagingElement } from '@vue-stripe/vue-stripe'
import type { StripePaymentMethodMessagingElement } from '@stripe/stripe-js'

const messagingRef = ref<InstanceType<typeof VueStripePaymentMethodMessagingElement> | null>(null)

const focus = () => messagingRef.value?.focus()
const clear = () => messagingRef.value?.clear()
const stripeElement = (): StripePaymentMethodMessagingElement | null => messagingRef.value?.element ?? null
</script>

<template>
  <VueStripePaymentMethodMessagingElement ref="messagingRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-paymentMethodMessaging-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-paymentMethodMessaging-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-paymentMethodMessaging-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-paymentMethodMessaging-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-paymentMethodMessaging-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-paymentMethodMessaging-element*` for this one. [Style elements](/guide/styling#_4-style-the-wrapper-markup) covers the markup and the Appearance API.

## TypeScript

```ts
import { VueStripePaymentMethodMessagingElement } from '@vue-stripe/vue-stripe'
import type {
  StripePaymentMethodMessagingElement,
  StripePaymentMethodMessagingElementOptions
} from '@stripe/stripe-js'

const options: StripePaymentMethodMessagingElementOptions = {
  amount: 1099,
  currency: 'USD',
  countryCode: 'US'
}
```

## See Also

- [Show buy-now-pay-later messaging](/guide/payment-method-messaging) - Add the element to a product page and keep the amount in sync
- [VueStripeElements](/api/components/stripe-elements) - Parent that provides the Elements group
- [VueStripePaymentElement](/api/components/stripe-payment-element) - Collects the BNPL payment at checkout
- [Live demo](/live-demo/payment-method-messaging)
