<script setup>
import ExpressCheckoutElementDemo from '../demo/ExpressCheckoutElementDemo.vue'
</script>

# The Express Checkout Element Component

The Express Checkout Element is an embeddable component for accepting payments through one-click payment buttons.

## Demo

<ExpressCheckoutElementDemo/>

## Usage

```vue
<script setup>
import { ref } from 'vue';
import { useStripe, ExpressCheckoutElement } from '@vue-stripe/vue-stripe';

const pk = ref(process.env.PUBLISHABLE_KEY);
const clientSecret = ref('client_secret'); // This should be the client secret from the server

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

const options = {};
</script>

<template>
  <ExpressCheckoutElement
    :elements="elements"
    :options="options"
  />
</template>
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `elements` | `Elements` | `null` | `true` | The Elements instance |
| `options` | `Object` | `{}` | `false` | Options for creating the Express Checkout Element. Read more [here](https://docs.stripe.com/js/elements_object/create_express_checkout_element?link_authentication_element_create-options#express_checkout_element_create-options). |

## Events

| Event | Description |
|-------|-------------|
| `click` | Emitted when the element is clicked |
| `confirm` | Emitted when the payment is confirmed |
| `cancel` | Emitted when the payment is canceled |
| `shippingaddresschange` | Emitted when the shipping address changes |
| `shippingratechange` | Emitted when the shipping rate changes |

## Methods

| Method | Description |
|--------|-------------|
| `getElement` | Get the Express Checkout Element instance |
| `updateElement` | Update the Express Checkout Element instance |
| `fetchUpdates` | Fetch the latest updates for the Express Checkout Element instance | 

## Slots

> There are no slots for this component.
