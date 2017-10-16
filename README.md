# Vue Stripe Checkout

**Shut up and clone my repo!** *(I hope y'all recognize the meme 😂)*

A vue plugin for Stripe checkout. I sh\*t you not, this plugin is the easiest to use. 

**Demo**

[Show me!](https://jofftiquez.github.io/vue-stripe-checkout/)

![Screen Shot](https://i.imgur.com/O1O0kI4.png)

**Install**

`npm install vue-stripe-checkout --save`

`yarn add vue-stripe-checkout`

**Usage**

```javascript
import Vue from 'vue';
import VueStripeCheckout from 'vue-stripe-checkout';

// base/global options
// these options can be overridden 
// by the options in the .open(options) 
// function.
const options = {
  key: 'your-publishable-key',
  image: 'https://cdn.meme.am/images/100x100/15882140.jpg',
  locale: 'auto',
  currency: 'PHP',
  billingAddress: true,
  panelLabel: 'Subscribe {{amount}}'
}

Vue.use(VueStripeCheckout, options);
```

Just see the [stripe docu](https://stripe.com/docs/checkout#integration-simple-options) for all of the available options.

**Sample**

Checkout will be available in the `vm` or `this` if you are using single file template (`.vue` files).

```
<template>
  <div>
    <button @click="checkout">Checkout</button>
  </div>
</template>

export default {
  methods: {
    checkout() {
      // this.$checkout.close() is also available.
      this.$checkout.open({
        name: 'Shut up and take my money!',
        currency: 'USD',
        amount: 99999,
        token(token) {
          console.log(token)
        } 
      });
    }
  }
}
```

Made with :heart: by Jofferson Ramirez Tiquez
