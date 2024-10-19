# The Issuing Element Component

Issuing Elements allows you to display the sensitive data of your Issuing cards in a PCI-compliant manner.

## Demo

Demo coming soon.

The issuing element uses a the Issuing API which can be seen [here](https://docs.stripe.com/js/issuing_elements/create?link_authentication_element_create-options=&type=issuingCardNumberDisplay). Take note that each type of Issuing Element has its own options.

## Usage

```vue
<script setup>
import { ref } from 'vue';
import { IssuingElement, useStripe } from '@vue-stripe/vue-stripe';

const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

const options = {};

// Can be one of:
// issuingCardNumberDisplay
// issuingCardCvcDisplay
// issuingCardExpiryDisplay
// issuingCardPinDisplay
// issuingCardCopyButton
const elementType = 'issuingCardNumberDisplay';
</script>

<template>
  <IssuingElement
    :elements="elements"
    :element-type="elementType"
    :options="options"
  />
</template>
```

To get the value of the address you may use the `getValue` method of the Address Element component via a ref.

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `element-type` | `String` | `null` | `true` | The type of Issuing Element to create. Can be one of: `issuingCardNumberDisplay`, `issuingCardCvcDisplay`, `issuingCardExpiryDisplay`, `issuingCardPinDisplay`, `issuingCardCopyButton` |
| `elements` | `Elements` | `null` | `true` | The Elements instance |
| `options` | `Object` | `{}` | `false` | Options for creating the Issuing Element. Read more [here](https://docs.stripe.com/js/issuing_elements/create?link_authentication_element_create-options=&type=issuingCardNumberDisplay#issuing_elements_create-options). |

## Events

> No events are emitted by the Address Element component.

## Methods

> No methods are available for the Issuing Element component.

## Slots

> No slots are available for the Issuing Element component.
