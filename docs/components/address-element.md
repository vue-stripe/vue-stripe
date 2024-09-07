<script setup>
import AddressElementDemo from '../demo/AddressElementDemo.vue';
</script>

# The Address Element Component

The Address Element is an embeddable component for collecting local and international billing and shipping addresses.

## Shipping Address Demo

<AddressElementDemo mode="shipping"/>

## Billing Address Demo

<AddressElementDemo mode="billing"/>

The shipping and billing address elements are identical in appearance and behavior. However they differ in the `mode` they are initialized with.

## Usage

```vue
<script setup>
import { ref } from 'vue';
import { AddressElement, useStripe } from '@vue-stripe/vue-stripe';

const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

const options = {
  mode: 'shipping', // or 'billing'
};

const addressElementRef = ref(null);

function getAddressValue () {
  const addressValue = addressElementRef.value.getValue();
  console.log(addressValue); // The address value
};
</script>

<template>
  <AddressElement
    ref="addressElementRef"
    :elements="elements"
    :options="options"
  />
  <button @click="getAddressValue">Get Address</button>
</template>
```

To get the value of the address you may use the `getValue` method of the Address Element component via a ref.

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `elements` | `Elements` | `null` | `true` | The Elements instance |
| `options` | `Object` | `{}` | `false` | Options for creating the Address Element. Read more [here](https://docs.stripe.com/js/elements_object/create_address_element?link_authentication_element_create-options#address_element_create-options). |

## Events

> No events are emitted by the Address Element component.

## Methods

| Event | Description |
|-------|-------------|
| `getElement` | Returns the element instance |
| `updateElement` | Updates the element with new options |
| `getValue` | Returns the value of the address element |
