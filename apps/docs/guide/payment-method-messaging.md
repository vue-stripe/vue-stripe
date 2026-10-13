# Show buy-now-pay-later messaging

Show customers which buy-now-pay-later (BNPL) options fit the current price, for example "4 interest-free payments of $30.00 with Klarna", with `VueStripePaymentMethodMessagingElement`. It covers Affirm, Klarna and Afterpay/Clearpay and shows only the ones that apply to the amount, currency and country you pass.

The element only displays a message. Put it on product, cart and pricing pages, and collect the payment later with the [Payment Element](/guide/payment-element) or [Stripe Checkout](/guide/checkout).

## Before you begin

- The BNPL methods you advertise are enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). A provider that is not enabled is never shown.
- Your checkout (Payment Element or Checkout Session) allows the same methods, so customers can choose what you advertise.

## 1. Render the element

The element needs `VueStripeElements`, but no client secret: it does not take part in a payment.

```vue
<script setup lang="ts">
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement
} from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripePaymentMethodMessagingElement
        :options="{
          amount: 12000,
          currency: 'USD',
          countryCode: 'US',
          paymentMethodTypes: ['affirm', 'klarna', 'afterpay_clearpay']
        }"
      />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

`amount` is in the smallest currency unit (cents for USD), so `12000` is $120.00. `currency` is an upper-case ISO code.

## 2. Keep the amount in sync with the price

The component calls `element.update()` whenever `options` changes, so pass a computed value and the message follows the price:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueStripePaymentMethodMessagingElement } from '@vue-stripe/vue-stripe'

const unitPrice = 4000 // $40.00
const quantity = ref(1)

const messagingOptions = computed(() => ({
  amount: unitPrice * quantity.value,
  currency: 'USD' as const,
  countryCode: 'US' as const
}))
</script>

<template>
  <label>
    Quantity
    <input v-model.number="quantity" type="number" min="1" />
  </label>
  <!-- Rendered inside VueStripeProvider and VueStripeElements -->
  <VueStripePaymentMethodMessagingElement :options="messagingOptions" />
</template>
```

Each provider has its own amount limits and supported countries; outside them the element shows nothing for that provider. See [Stripe's reference](https://docs.stripe.com/js/element/payment_method_messaging_element) for the supported combinations and every option.

## See also

- [Payment Method Messaging Element API](/api/components/stripe-payment-method-messaging-element): props, events and options
- [Live demo](/live-demo/payment-method-messaging): change the amount, currency and country
