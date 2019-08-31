
# Vue Stripe Checkout 3 Beta

Welcome to the Vue Stripe Checkout 3 Beta! This version is still incomplete, but please let me know what's missing or what you're expecting from this version by [creating an issue](https://github.com/jofftiquez/vue-stripe-checkout/issues/new). Every feedback helps.

### IMPORTANT

To be able to start using Stripe Checkout version 3, kindly follow [these instructions](https://stripe.com/docs/payments/checkout/client) first.

### Table of Contents

- [Demo](#demo)
- [Install Beta](#install-beta)
- [Usage](#usage)
- [Vue Stripe Checkout V3](#vue-stripe-checkout)
- [Vue Stripe Elements (Custom charge)](#vue-stripe-elements)
- [FAQs](#faqs)


### Demo

[Live Demo](https://vue-stripe-checkout-v3.surge.sh/vue-stripe-checkout)

### Install Beta

```bash
yarn add vue-stripe-checkout@beta
```

```bash
npm install vue-stripe-checkout@beta
```

### Usage

Add the stripe js link in your `index.html` just before the `</head>` closing tag.

```html
<script id="stripe-js" src="https://js.stripe.com/v3/" async></script>
```

```javascript
import Vue from 'vue';
import VueStripeCheckout from 'vue-stripe-checkout';
Vue.use(VueStripeCheckout, {
  publishableKey: 'your-publishable-key'
});
```

### Vue Stripe Checkout

Stripe's new [Checkout](https://stripe.com/docs/payments/checkout).

**Props**

```html
<template>
  <vue-stripe-checkout
    ref="checkoutRef"
    :items="items"
    :successUrl="successUrl"
    :cancelUrl="cancelUrl"
  >
    <template slot="checkout-button">
      <button @click="checkout">Shutup and take my money!</button>
    </template>
  </vue-stripe-checkout>
</template>

<script>
export default {
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

### Vue Stripe Elements

Create custom Stripe form using [Stripe Elements](https://stripe.com/docs/stripe-js).

```html
<template>
  <vue-stripe-elements
    ref="elementsRef"
    @token="tokenCreated"
    @loading="loading = $event"
  >
  </vue-stripe-elements>
  <button @click="submit">Pay ${{amount / 100}}</button>
</template>

<script>
export default {
  data: () => ({
    loading: false,
    amount: 1000,
    token: null,
    charge: null
  }),
  methods: {
    submit () {
      this.$refs.elementsRef.submit();
    },
    tokenCreated (token) {
      this.token = token;
      this.charge = {
        source: token.card,
        amount: this.amount,
        description: this.description
      }
      this.sendTokenToServer(this.charge);
    },
    sendTokenToServer (charge) {
      // Send to server
    }
  }
}
</script>
```

### FAQs

- **How to create SKUs for one-time and recurring payments?**
  - [One-time Payments](https://stripe.com/docs/payments/checkout/one-time).
  - [Recurring Payments](https://stripe.com/docs/payments/checkout/subscriptions).

When the SKU items has been created, you can now use the [`vue-stripe-checkout`](#vue-stripe-checkout) component.


**SPECIAL THANKS TO THE FOLLOWING SPONSOR(S):**

[MYCURE INC.](https://www.mycure.md)

[TEAM O.P.S. INC.](http://myteamops.com/)

Made with :heart: by Jofferson Ramirez Tiquez
