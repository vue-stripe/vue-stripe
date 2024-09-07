<script setup>
import PaymentElementDemo from '../demo/PaymentElementDemo.vue'

const members = [
  {
    avatar: 'https://www.github.com/jofftiquez.png',
    name: 'Joff Tiquez',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/jofftiquez' },
      { icon: 'x', link: 'https://twitter.com/jrtiquez' }
    ]
  },
  {
    avatar: 'https://www.github.com/mahomuri.png',
    name: 'Paolo Santos',
    title: 'Contributor',
    links: [
      { icon: 'github', link: 'https://github.com/mahomuri' },
      { icon: 'x', link: 'https://twitter.com/mahomuri' }
    ]
  },
];
</script>

# The Payment Element Component

The Payment Element component is used to create a payment form using the Stripe Payment Element. It is used in combination with `useStripe` composable. So make sure to read the documentation for the `useStripe` composable first.

## Demo

<PaymentElementDemo/>

<!-- <button class="btn" @click="onSubmit">Submit</button> -->

## Usage

```vue
<script setup>
import { ref } from 'vue';
import { useStripe, PaymentElement } from '@vue-stripe/vue-stripe';

const pk = ref(process.env.PUBLISHABLE_KEY);
const clientSecret = ref('client_secret'); // This should be the client secret from the server

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

async function onSubmit () {
  try {
    stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: 'https://...', // The URL to redirect to after the payment is successful
      },
    });
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <PaymentElement
    :stripe="stripe"
    :elements="elements"
  />
  <button class="btn" @click="onSubmit">Submit</button>
</template>
```

Using the `stripe` object, you can also call the `confirmPayment` method to confirm a payment, and more methods provided by the Stripe object as seen in the [Stripe.js documentation](https://stripe.com/docs/js?ref=https://vuestripe.com).

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `stripe` | `Stripe` | `true` | `null` | The Stripe instance |
| `elements` | `Elements` | `true` | `null` | The Elements instance |
| `options` | `Object` | `false` | `{}` | Options to pass to the Stripe Payment Element instance. Read more [here](https://docs.stripe.com/js/elements_object/create_payment_element#payment_element_create-options). |

## Slots 

> No slots are exposed by this component.

## Events

| Event | Description |
|-------|-------------|
| `error` | Emitted when an error occurs during the payment process. |
| `loading` | Emitted when the payment process is loading. |

## Methods

> No methods are exposed by this component.

