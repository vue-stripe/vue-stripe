
# Vue Stripe Checkout

![npm bundle size](https://img.shields.io/bundlephobia/min/vue-stripe-checkout?style=flat-square) ![npm](https://img.shields.io/npm/dw/vue-stripe-checkout?style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/jofftiquez/vue-stripe-checkout/Deploy?style=flat-square) [![saythanks](https://img.shields.io/badge/say-thanks-ff69b4.svg)](https://paypal.me/jofftiquez)

Welcome to the Vue Stripe Checkout 3!

This project is now available in [Open Collective](https://opencollective.com/vue-stripe-checkout#section-contribute). I would really appreciate if you guys would check it out. Also, if you like this project kindly give it a star, or consider following me on [GitHub](https://github.com/jofftiquez). Thanks! :heart:

![Screen Shot](https://i.imgur.com/JVAdRza.png)

### LEGACY

Old version (version 2) is still available [here](https://github.com/jofftiquez/vue-stripe-checkout/tree/v2).

### Table of Contents

- [Demo (*Now with recurring payment subscription)](#demo)
- [Install](#install)
- [Usage](#usage)
- [Vue Stripe Checkout V3](#vue-stripe-checkout)
- [Vue Stripe Elements (Custom charge)](#vue-stripe-elements)
- [FAQs](#faqs)


### Demo

[Live Demo](https://jofftiquez.github.io/vue-stripe-checkout)

### Install

```bash
yarn add vue-stripe-checkout
```

```bash
npm install vue-stripe-checkout
```

### Vue Stripe Checkout

Stripe's new [Checkout](https://stripe.com/docs/payments/checkout).

**Props**

```html
<template>
  <stripe-checkout
    ref="checkoutRef"
    :pk="publishableKey"
    :items="items"
    :successUrl="successUrl"
    :cancelUrl="cancelUrl"
  >
    <template slot="checkout-button">
      <button @click="checkout">Shutup and take my money!</button>
    </template>
  </stripe-checkout>
</template>

<script>
import { StripeCheckout } from 'vue-stripe-checkout';
export default {
  components: {
    StripeCheckout
  },
  data: () => ({
    loading: false,
    publishableKey: process.env.PUBLISHABLE_KEY,
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

Docs for additional Stripe Charge Object [options](https://stripe.com/docs/api/charges/object) like `amount`, `description`, `currenct`, etc.

```html
<template>
  <div>
    <stripe-elements
      ref="elementsRef"
      :pk="publishableKey"
      :amount="amount"
      @token="tokenCreated"
      @loading="loading = $event"
    >
    </stripe-elements>
    <button @click="submit">Pay ${{amount / 100}}</button>
  </div>
</template>

<script>
import { StripeElements } from 'vue-stripe-checkout';
export default {
  components: {
    StripeElements
  },
  data: () => ({
    loading: false,
    amount: 1000,
    publishableKey: process.env.PUBLISHABLE_KEY, 
    token: null,
    charge: null
  }),
  methods: {
    submit () {
      this.$refs.elementsRef.submit();
    },
    tokenCreated (token) {
      this.token = token;
      // for additional charge objects go to https://stripe.com/docs/api/charges/object
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

- **How to create SKUs**
  - [Create SKU](https://stripe.com/docs/api/skus/create)

- **How to create one-time and recurring payments?**
  - [One-time Payments](https://stripe.com/docs/payments/checkout/one-time).
  - [Recurring Payments](https://stripe.com/docs/payments/checkout/subscriptions).

When the SKU items has been created, you can now use the [`vue-stripe-checkout`](#vue-stripe-checkout) component to create a client-only one-time payment.


**SPECIAL THANKS TO THE FOLLOWING SPONSOR(S):**

[<img src="https://i.imgur.com/Ttv4fMw.png" width="200px">](https://mightyminds.org)
[<img src="https://i.imgur.com/x0SERyj.png" width="200px">](https://mycure.md)
[<img src="https://i.imgur.com/4jF5M4A.png">](http://myteamops.com)

Made with :heart: by Jofferson Ramirez Tiquez
