# The useStripe Composable

The `useStripe` composable is a wrapper around the Stripe.js library. It provides a way to load the Stripe.js library and access the Stripe object.

## Usage

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

Once you've successfully initialized the Stripe object, you can now use the Elements components built into Vue Stripe.

Using the `stripe` object, you can also call the `confirmPayment` method to confirm a payment, and more methods provided by the Stripe object as seen in the [Stripe.js documentation](https://stripe.com/docs/js?ref=https://vuestripe.com).

## Parameters

The `useStripe` composable takes a single parameter, the publishable key.

| Parameter | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `pk` | string | null | true | The publishable key from the Stripe dashboard |
| `options` | object | {} | false | Options to pass to when initializing Stripe. Read more [here](https://docs.stripe.com/js/initializing?ref=https://vuestripe.com). |

## Return Values

The `useStripe` composable returns an object with the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `stripe` | object | The Stripe object |
| `elements` | object | The Elements object. This will remain null if you do not call the `initializeElements` |
| `initializeElements` | function | A function to initialize the Elements object. This function takes a single parameter, the client secret. |
