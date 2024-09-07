<script setup>
import LinkAuthenticationElementDemo from '../demo/LinkAuthenticationElementDemo.vue';
import PaymentElementDemo from '../demo/PaymentElementDemo.vue';
</script>

# The Link Authentication Element Component

The Link Authentication Element is an embeddable UI component that allows you to accept a payment with Stripe Link Payment.

## Demo

<LinkAuthenticationElementDemo />

The Link Authentication Element only interacts with the Payment Element by prefilling payment information for returning Link users. However, it can still be displayed with other elements as well, like the following example with the Link Authentication Element, Address Element, and Payment Element. Read more [here](https://docs.stripe.com/payments/elements/link-authentication-element).

## Link Authentication Element and Payment Element Demo

<LinkAuthenticationElementDemo />
<PaymentElementDemo />

## Usage 

```vue
<script setup>
import { ref } from 'vue';
import { useStripe, LinkAuthenticationElement, PaymentElement } from '@vue-stripe/vue-stripe';

const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

const linkOptions = {};
const paymentOptions = {};
</script>

<template>
  <template>
    <div>
      <LinkAuthenticationElement 
        :elements="elements" 
        :options="linkOptions"
      />
      <PaymentElement 
        :elements="elements" 
        :options="paymentOptions"
      />
    </div>
  </template>
</template>
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `elements` | `Elements` | `null` | `true` | The Elements instance |
| `options` | `Object` | `{}` | `false` | Options for creating the Link Authentication Element. Read more [here](https://docs.stripe.com/js/elements_object/create_link_authentication_element?link_authentication_element_create-options#link_authentication_element_create-options). |

## Events

> There are no events for this component.

## Methods

| Method | Description |
|--------|-------------|
| `getElement` | Get the Payment Element instance. |

## Slots

> No slots are exposed by this component.