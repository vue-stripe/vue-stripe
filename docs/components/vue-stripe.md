# The Vue Stripe Component

The Vue Stripe Component is the main component of the Vue Stripe library. It is used to initialize Stripe and Elements, and to create various Stripe Elements like PaymentIntent, LinkAuthentication, and more.

## Syntax

```html
<VueStripe ...> <- emits stripe intance

  <Elements ...> <-- emits elements instance

    <PaymentIntent ... /> <-- requires stripe and elements instances, renders the payment intent form

    <LinkAuthentication ... /> <-- requires stripe and elements instances, renders the link authentication field

    <!-- and more -->
    
  </Elements>
</VueStripe>
```


## Usage

```vue
<script setup>
import { useStripe, useElements } from 'vue-stripe';
</script>
```