# Payment Method Messaging

The Payment Method Messaging Element tells customers which Buy Now, Pay Later (BNPL) options they can use for the current price, for example "4 interest-free payments of $30.00 with Klarna". It covers Affirm, Klarna and Afterpay/Clearpay, and shows only the ones that apply to the amount, currency and country you pass.

It is **display-only**: it collects nothing and cannot confirm a payment. Put it on product, cart and pricing pages, and collect the payment later with the [Payment Element](/guide/payment-element) or [Stripe Checkout](/guide/checkout).

## When to Use

| Page | Why |
|------|-----|
| Product page | Shows the installment price next to the full price |
| Cart | Updates as the cart total changes |
| Pricing page | Makes higher-priced plans easier to accept |

Stripe removed the older `affirmMessage` and `afterpayClearpayMessage` elements in Stripe.js Clover (8.0). This element replaces both.

## Basic Usage

The element needs `VueStripeElements`, but no client secret: it does not take part in a payment.

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement
} from '@vue-stripe/vue-stripe'

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

## Keeping the Amount in Sync

The component calls `element.update()` whenever `options` changes, so pass a computed value and the message follows the price:

```vue
<script setup>
import { computed, ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const unitPrice = 4000 // $40.00
const quantity = ref(1)

const messagingOptions = computed(() => ({
  amount: unitPrice * quantity.value,
  currency: 'USD',
  countryCode: 'US'
}))
</script>

<template>
  <label>
    Quantity
    <input v-model.number="quantity" type="number" min="1" />
  </label>

  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripePaymentMethodMessagingElement :options="messagingOptions" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `amount` | `number` | Required. Price in the smallest currency unit. |
| `currency` | `'USD' \| 'EUR' \| 'GBP' \| ...` | Required. Upper-case ISO currency code. |
| `countryCode` | `'US' \| 'GB' \| 'DE' \| ...` | The customer's country. Decides which providers can be offered. |
| `paymentMethodTypes` | `Array<'affirm' \| 'klarna' \| 'afterpay_clearpay'>` | Limit the providers shown. Replaces the deprecated `paymentMethods`. |
| `paymentMethodOrder` | same as above | Fixed display order. By default Stripe orders them per customer. |
| `logoColor` | `'black' \| 'white' \| 'color'` | Provider logo color. Defaults to black. |

See [Stripe's reference](https://docs.stripe.com/js/element/payment_method_messaging_element) for the supported currency and country combinations.

## Events

The element emits only `@ready`. There is no `change` event because there is no input.

## Requirements

- Turn on the BNPL methods you advertise in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). A provider that is not enabled is never shown.
- Each provider has its own amount limits and supported countries. Outside them, the element shows nothing for that provider.
- Advertise only methods the customer can actually choose at checkout, so the Payment Element or Checkout Session should allow the same methods.

## Next Steps

- [Payment Element Guide](/guide/payment-element) collects the BNPL payment.
- [Live Demo](/live-demo/payment-method-messaging) lets you change the amount, currency and country.
- [API Reference](/api/components/stripe-payment-method-messaging-element)
