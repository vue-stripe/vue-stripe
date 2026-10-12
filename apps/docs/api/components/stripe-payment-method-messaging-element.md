# VueStripePaymentMethodMessagingElement

Displays promotional Buy Now, Pay Later (BNPL) messaging — Affirm, Klarna, Afterpay/Clearpay — based on the order amount and currency. Wraps [`elements.create('paymentMethodMessaging')`](https://docs.stripe.com/js/element/payment_method_messaging_element).

Must be used within `<VueStripeElements>`. This is a **display-only** element.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripePaymentMethodMessagingElement
        :options="{
          amount: 1099,
          currency: 'usd',
          paymentMethodTypes: ['klarna', 'afterpay_clearpay', 'affirm'],
          countryCode: 'US'
        }"
        @ready="onReady"
      />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement
} from '@vue-stripe/vue-stripe'

const publishableKey = 'pk_test_...'
const onReady = () => console.log('messaging ready')
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | No | Element options: `amount`, `currency`, `paymentMethodTypes`, `countryCode`. See the [Stripe docs](https://docs.stripe.com/js/element/payment_method_messaging_element). |

`paymentMethodTypes` here is this element's own option (which BNPL messages to show). It is unrelated to the `paymentMethodTypes` prop that was removed from `VueStripeElements` in v6.

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripePaymentMethodMessagingElement` | Emitted when the element is mounted and ready. |

This is the only event: the Payment Method Messaging Element is display-only, so it has no `@change`, `@focus`, `@blur` or `@escape`.

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading paymentMethodMessaging...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: a creation error |

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
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

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

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-paymentMethodMessaging-element*` for this one.
