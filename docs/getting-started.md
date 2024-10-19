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


## Usage

This is an example of how you can use the `useStripe` composable to initialize Stripe.js.

```vue
<script setup>
import { ref } from 'vue';
import { useStripe } from '@vue-stripe/vue-stripe';

const pk = ref(process.env.PUBLISHABLE_KEY);
const clientSecret = ref('client_secret'); // This should be the client secret from the server

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);
</script>
```

Vue Stripe have a new composable called `useStripe`. You can use it to initialize Stripe.js, and initialize the Elements intance.

This will give you access to the `stripe` object, the `elements` object, and the `initializeElements` function. You can use the `stripe` object to call the `confirmPayment` method to confirm a payment, and more methods provided by the Stripe object as seen in the [Stripe.js documentation](https://stripe.com/docs/js?ref=https://vuestripe.com).

This allows you to implement your own UI components without the hassle of managing the Stripe.js library.

## Components

Learn more about the other components available in Vue Stripe in the next section. But here are the main components available in Vue Stripe:

*Elements Components*

- [`Payment`](https://docs.stripe.com/js/element/payment_element) - The Payment Element is an embeddable component for securely collecting payment details. The Payment Element supports dozens of payment methods with a single integration.
- [`ExpressCheckout`](https://docs.stripe.com/js/element/express_checkout_element) - The Express Checkout Element is an embeddable component for accepting payments through one-click payment buttons.
- [`LinkAuthentication`](https://docs.stripe.com/js/element/link_authentication_element) - The Link Authentication Element is an embeddable component for collecting email addresses and allow users to log into Link on your checkout page.
- [`Address`](https://docs.stripe.com/js/element/address_element) - The Address Element is an embeddable component for collecting local and international billing and shipping addresses.
- [`Issuing`](https://docs.stripe.com/js/element/issuing) - Issuing Elements allows you to display the sensitive data of your Issuing cards in a PCI-compliant manner.
- [`Other`](https://docs.stripe.com/js/element/other_element) - Stripe also offers a set of Elements for individual payment methods that you can use in your payment flows.