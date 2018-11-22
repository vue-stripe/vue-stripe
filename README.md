[![CircleCI](https://circleci.com/gh/jofftiquez/vue-stripe-checkout.svg?style=shield)](https://circleci.com/gh/jofftiquez/vue-stripe-checkout) <span class="badge-buymeacoffee"><a href="https://www.buymeacoffee.com/jofftiquez" title="Donate to this project using Buy Me A Coffee"><img src="https://img.shields.io/badge/buy%20me%20a%20coffee-donate-green.svg" alt="Buy Me A Coffee donate button" /></a></span>

# Vue Stripe Checkout

**Shut up and clone my repo!**

A Vue plugin for Stripe checkout. I sh\*t you not, this plugin is the easiest to use. 

### Demo

[Shut up and see the demo!](https://jofftiquez.github.io/vue-stripe-checkout/)

If you liked this repo then leave a :star:, if not, I don't care. *(Seriously leave a :star: please)*

![Screen Shot](https://i.imgur.com/XZgLVwT.png)

## Install

*NPM* or *Yarn*

`npm install vue-stripe-checkout --save`

`yarn add vue-stripe-checkout`

*CDN*

`https://unpkg.com/vue-stripe-checkout/build/vue-stripe-checkout.js`

*Usage*

```javascript
import Vue from 'vue';
import VueStripeCheckout from 'vue-stripe-checkout';

Vue.use(VueStripeCheckout, process.env.PUBLISHABLE_KEY);
```

Just see the [stripe docu](https://stripe.com/docs/checkout#integration-simple-options) for all of the available options.

### Sample

```vue
<template>
  <div>
    <vue-stripe-checkout
      ref="checkoutRef"
      :image="image"
      :name="name"
      :description="description"
      :currency="currency"
      :amount="amount"
      :allow-remember-me="false"
      @done="done"
      @opened="opened"
      @closed="closed"
    ></vue-stripe-checkout>
    <button @click="checkout">Checkout</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      image: 'https://i.imgur.com/HhqxVCW.jpg',
      name: 'Shut up and take my money!',
      description: 'Cats are the best dog!',
      currency: 'PHP',
      amount: 99999
    }
  },
  methods: {
    async checkout () {
      const token = await this.$refs.checkoutRef.open();
    },
    done (token) {
      // do stuff
    },
    opened () {
      // do stuff 
    }
    closed () {
      // do stuff 
    }
  }
}
</script>
```

### Props

See property description from official [Stripe Documentation](https://stripe.com/docs/checkout#highly-recommended)

- `publishable-key`: `String`
- `image`: `String`
- `name`: `String`
- `description`: `String`
- `amount`: `Number`
- `locale`: `String`
- `zip-code`: `Boolean`
- `billing-address`: `Boolean`
- `currency`: `String`
- `panelLabel`: `String`
- `shipping-address`: `Boolean`
- `email`: `String`
- `label`: `String`
- `allow-remember-me`: `Boolean`

### Events

- `done` - Emits the stripe token.
- `opened` - Called when the stripe checkout dialog has been opened.
- `closed` - Called when the stripe checkout dialog has been closed.

**Usage**

```vue
<vue-stripe-checkout
  @done="done"
  @opened="opened"
  @closed="closed"
></vue-stripe-checkout>
```

**SPECIAL THANKS TO THE FOLLOWING SPONSOR(S):**

[MYCURE INC.](https://www.mycure.md)

[TEAM O.P.S. INC.](http://myteamops.com/)

Made with :heart: by Jofferson Ramirez Tiquez
