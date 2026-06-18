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

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeElement` | Emitted when the element is mounted and ready. |

## Exposed

Via template ref: `element`, `loading`, `error`, and `focus()` / `blur()` / `clear()`.
