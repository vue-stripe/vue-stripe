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

const options = {};

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
    :elements="elements"
    :options="options"
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

## Events

| Event | Description |
|-------|-------------|
| `change` | Emitted when the element changes |
| `ready` | Emitted when the element is ready |
| `focus` | Emitted when the element is focused |
| `blur` | Emitted when the element is blurred |
| `escape` | Emitted when the element is escaped |

## Methods

| Method | Description |
|--------|-------------|
| `getElement` | Get the Payment Element instance. |
| `updateElement` | Update the Payment Element instance. |
| `fetchUpdates` | Fetch updates for the Payment Element instance. |
| `collapse` | Collapse the Payment Element UI. |

## Slots 

> No slots are exposed by this component.