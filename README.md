
# Vue Stripe Checkout 3 Beta

Welcome to the Vue Stripe Checkout 3 Beta! This version is still incomplete, but please let me know what's missing or what you're expecting from this version by [creating an issue](https://github.com/jofftiquez/vue-stripe-checkout/issues/new). Every feedback helps.

Note: Not all Stripe Checkout options are available yet.

### IMPORTANT

To be able to start using Stripe Checkout version 3, kindly follow [these instructions](https://stripe.com/docs/payments/checkout/client) first.

### Sample

Direct import the checkout component into your component.

```html
<template>
  <vue-stripe-checkout
    ref="checkoutRef"
    publishableKey="YOUR_PUBLISHABLE_KEY_HERE"
    :items="items"
  >
    <template slot="checkout-button">
      <button @click="checkout">Shutup and take my money!</button>
    </template>
  </vue-stripe-checkout>
</template>

<script>
import { VueStripeCheckout } from 'vue-stripe-checkout';
export default {
  components: {
    VueStripeCheckout
  },
  data: () => ({
    loading: false,
    items: [
      {
        sku: 'sku_FdQKocNoVzznpJ', 
        quantity: 1
      }
    ],
    successUrl: 'your-success-url',
    cancelUrl: 'your-cancel-url',
  }),
  methods: {
    checkout () {
      this.$refs.checkoutRef.redirectToCheckout();
    }
  }
}
</script>
```

**SPECIAL THANKS TO THE FOLLOWING SPONSOR(S):**

[MYCURE INC.](https://www.mycure.md)

[TEAM O.P.S. INC.](http://myteamops.com/)

Made with :heart: by Jofferson Ramirez Tiquez
