# Getting Started

## Installation

### NPM

```bash
npm install @vue-stripe/vue-stripe
```

### Yarn

```bash
yarn add @vue-stripe/vue-stripe
```


### Composable Usage

This is an example of how you can use the `useStripe` composable to initialize Stripe.js.

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { useStripe } from '@vue-stripe/vue-stripe';

const { initStripe } = useStripe();
const stripe = ref(null);

onMounted(async () => {
  // Initialize Stripe.js
  stripe.value = await initStripe('pk_...');
});
</script>
```

Vue Stripe has 3 main composables, `useStripe`, `useElements`, and `useElement`. You can use these composables to initialize Stripe.js, create Elements, and create Elements with options.

**Why are they needed?**

- `useStripe` - Initializes Stripe.js and returns the Stripe instance.
- `useElements` - Creates an Elements instance and returns it.
- `useElement` - Creates an Element with options and returns it.

In case you need the option to create your own UI, you can still Vue Stripe composable to easily create Elements and Elements with options.


### Component Usage

This is an example of how you can use the `VueStripe`, `Elements`, and `Payment` components to create a payment form.

```vue
<script setup>
import { VueStripe, Elements, Payment } from '@vue-stripe/vue-stripe';
const pk = 'pk_...';
</script>

<template>
  <VueStripe 
    :pk="pk"
    v-slot:default="{ stripe }"
  >
    <Elements 
      :stripe="stripe" 
      :client-secret="clientSecret"
      v-slot:default="{ element }"
    >
      <Payment 
        :stripe="stripe" 
        :element="element"
      />
    </Elements>
  </VueStripe>
</template>
```

**What are other components available?**

Learn more about the other components available in Vue Stripe in the next section. But here are the main components available in Vue Stripe:

*Core*

- `VueStripe` - Initializes Stripe.js and returns the Stripe instance.
- `Elements` - Creates an Elements instance and returns it.

*Elements Components*

- [`Payment`](https://docs.stripe.com/js/element/payment_element) - The Payment Element is an embeddable component for securely collecting payment details. The Payment Element supports dozens of payment methods with a single integration.
- [`ExpressCheckout`](https://docs.stripe.com/js/element/express_checkout_element) - The Express Checkout Element is an embeddable component for accepting payments through one-click payment buttons.
- [`LinkAuthentication`](https://docs.stripe.com/js/element/link_authentication_element) - The Link Authentication Element is an embeddable component for collecting email addresses and allow users to log into Link on your checkout page.
- [`Address`](https://docs.stripe.com/js/element/address_element) - The Address Element is an embeddable component for collecting local and international billing and shipping addresses.
- [`Issuing`](https://docs.stripe.com/js/element/issuing) - Issuing Elements allows you to display the sensitive data of your Issuing cards in a PCI-compliant manner.
- [`Other`](https://docs.stripe.com/js/element/other_element) - Stripe also offers a set of Elements for individual payment methods that you can use in your payment flows.