# Vue Stripe Checkout

**Shut up and clone my repo!** *(I hope y'all recognize the meme 😂)*

A Vue plugin for Stripe checkout. I sh\*t you not, this plugin is the easiest to use. 

**Demo**

[SHOW ME!](https://jofftiquez.github.io/vue-stripe-checkout/)

If you liked this repo then leave a :star:, if not, I don't care. *(Seriously leave a :star: please)*

![Screen Shot](https://i.imgur.com/XZgLVwT.png)

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

```vue
<template>
  <div>
    <button @click="checkout">Checkout</button>
  </div>
</template>

<script>
export default {
  methods: {
    checkout() {
      // this.$checkout.close() 
      // is also available.
      this.$checkout.open({
        name: 'Shut up and take my money!',
        currency: 'USD',
        amount: 99999,
        token: (token) => {
          // handle the token
        } 
      });
    }
  }
}
</script>
```

**SPECIAL THANKS TO THE FOLLOWING**

![Sceen Shot](https://i.imgur.com/WlPwOH6m.png)
[MYCURE INC.](https://www.mycure.md)

Made with :heart: by Jofferson Ramirez Tiquez
