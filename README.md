# Vue Stipe Checkout

A vue plugin for Stripe checkout.

**Install**

`npm install vue-stripe-checkout --save`

`yarn add vue-stripe-checkout`

**Usage**

```
import VueStripeCheckout from 'vue-stripe-checkout';

// base/global options
// these options can be overridden 
// by the options in the .open(options) 
// function.
const options = {
  key: 'you_publishable_key',
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

Checkout will be available in the `vm` or `this` if you are using `.vue`.

```
<template lang="pug">
	div
		button(@click="checkout")
</template>

export default {
	methods: {
		checkout() {
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