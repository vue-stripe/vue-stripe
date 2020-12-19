# Announcement

[Read here](https://randomcodetips.com/vue-stripe-checkout-whats-next/)

<p align="center">
  <img src="./vue-stripe-logo-variant-1.png" alt="drawing" width="250"/>
  <h1 align="center">Vue Stripe Checkout 💳</h1>
</p>

[![Financial Contributors on Open Collective](https://opencollective.com/vue-stripe-checkout/all/badge.svg?label=financial+contributors)](https://opencollective.com/vue-stripe-checkout) ![npm bundle size](https://img.shields.io/bundlephobia/min/vue-stripe-checkout?style=flat-square) ![npm](https://img.shields.io/npm/dw/vue-stripe-checkout?style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/jofftiquez/vue-stripe-checkout/Deploy?style=flat-square) [![saythanks](https://img.shields.io/badge/say-thanks-ff69b4.svg)](https://paypal.me/jofftiquez)

Welcome to the Vue Stripe Checkout 3!

This project is now available in [Open Collective](https://opencollective.com/vue-stripe-checkout#section-contribute). I would really appreciate if you guys would check it out. Also, if you like this project kindly give it a star, or consider following me on [GitHub](https://github.com/jofftiquez). Thanks! :heart:

![Screen Shot](https://i.imgur.com/JVAdRza.png)
*This screenshot is an example of Stripe Checkout*

### LEGACY

Old version (version 2) is still available [here](https://github.com/jofftiquez/vue-stripe-checkout/tree/v2).

### Table of Contents

- [Nuxt Demo](#nuxt-demo)
- [Demo (*Now with recurring payment subscription)](#demo)
- [Install](#install)
- [Vue Stripe Checkout V3](#vue-stripe-checkout)
- [Vue Stripe Elements (Custom charge)](#vue-stripe-elements)
- [Stripe Sessions](#stripe-sessions)
- [FAQs](#faqs)
- [Change Log](#change-log)
- [Demos & Examples Using Vue Stripe Checkout](#demos-&-examples)

### Nuxt Demo

- Code - https://github.com/jofftiquez/vue-stripe-checkout-nuxt-demo
- SPA Demo on Firebase Hosting - https://vue-stripe-checkout-nuxt-demo.web.app
- SSR Demo on Heroku - https://vue-stripe-checkout-nuxt-demo.herokuapp.com

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

See [Checkout documentation](https://stripe.com/docs/js/checkout/redirect_to_checkout).

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
      <button @click="checkout">Shut up and take my money!</button>
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

Elements [options](https://stripe.com/docs/js/initializing#init_stripe_js-options).

| Props | Description |
| ---- | ----------- |
| `stripeAccount` | For usage with [Connect](https://stripe.com/docs/connect) only. Specifying a connected account ID (e.g., `acct_24BFMpJ1svR5A89k`) allows you to perform actions on behalf of that account. |
| `apiVersion` | Override your account's [API version](https://stripe.com/docs/api/versioning). |
| `locale` | A [locale](https://stripe.com/docs/js/appendix/supported_locales) used to globally configure localization in Stripe. Setting the locale here will localize error strings for all Stripe.js methods. It will also configure the locale for Elements and Checkout. Default is `auto` (Stripe detects the locale of the browser). |
| `styleObject` | The custom [style object](https://stripe.com/docs/js/appendix/style) |

| Slots | Description |
| ----- | ----------- |
| `card-element` | Slot for mounting custom elements. [See](https://stripe.com/docs/js/element/mount) |
| `card-errors` | Slot for mounting custom errors |

Create custom Stripe form using [Stripe Elements](https://stripe.com/docs/stripe-js).

Docs for additional Stripe Charge Object [options](https://stripe.com/docs/api/charges/object) like `amount`, `description`, `currenct`, etc.

```html
<template>
  <div>
    <stripe-elements
      ref="elementsRef"
      :pk="publishableKey"
      :amount="amount"
      locale="de"
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
        source: token.id,
        amount: this.amount, // the amount you want to charge the customer in cents. $100 is 1000 (it is strongly recommended you use a product id and quantity and get calculate this on the backend to avoid people manipulating the cost)
        description: this.description // optional description that will show up on stripe when looking at payments
      }
      this.sendTokenToServer(this.charge);
    },
    sendTokenToServer (charge) {
      // Send to charge to your backend server to be processed
      // Documentation here: https://stripe.com/docs/api/charges/create
  
    }
  }
}
</script>
```

### Stripe Sessions

This section is only more of a description of how the session flow should go.

The flow: Client -> Backend -> Client for checkout use.

1. On the client side, prepare all the items, or subscription that the user wants to pay.
2. Send these information to your backend to create a stripe `session`. [See doc](https://stripe.com/docs/api/checkout/sessions/create).
3. Return the `session id` you just created to the client.
4. Use that `session id` from your backend and pass it to `stripe-checkout`, like so:

```html
<stripe-checkout
  ref="sessionRef"
  :pk="publishableKey"
  :session-id="sessionId"
>
  <template slot="checkout-button">
    <v-btn 
      @click="$refs.sessionRef.redirectToCheckout()"
      color="#42b883"
      large
      dark
    >Subscribe</v-btn>
  </template>
</stripe-checkout>
```

You'll notice that when using sessions, you'll only need the `session-id`. This is because the session is the representation of all of the information about the payment to done. 

### FAQs

- **How to create SKUs**
  - [Create SKU](https://stripe.com/docs/api/skus/create)

- **How to create one-time and recurring payments?**
  - [One-time Payments](https://stripe.com/docs/payments/checkout/one-time).
  - [Recurring Payments](https://stripe.com/docs/payments/checkout/subscriptions).

### Change Log

`3.5.12`

- Add support for Latin America Spanish locale

### Demos & Examples

- [AWS Quickstart for creating a SaaS with Stripe](https://saas-app.t3chflicks.org/) - [T3ck Flicks](https://github.com/sk-t3ch)

When the SKU items has been created, you can now use the [`vue-stripe-checkout`](#vue-stripe-checkout) component to create a client-only one-time payment.

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/jofftiquez/vue-stripe-checkout/graphs/contributors"><img src="https://opencollective.com/vue-stripe-checkout/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/vue-stripe-checkout/contribute)]

#### Individuals

<a href="https://opencollective.com/vue-stripe-checkout"><img src="https://opencollective.com/vue-stripe-checkout/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/vue-stripe-checkout/contribute)]

<a href="https://opencollective.com/vue-stripe-checkout/organization/0/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/1/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/2/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/3/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/4/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/5/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/6/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/7/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/8/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/9/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/9/avatar.svg"></a>


**SPECIAL THANKS TO THE FOLLOWING SPONSOR(S):**

[<img src="https://i.imgur.com/Ttv4fMw.png" width="200px">](https://mightyminds.org)
[<img src="https://i.imgur.com/x0SERyj.png" width="200px">](https://mycure.md)
[<img src="https://i.imgur.com/4jF5M4A.png">](http://myteamops.com)

Made with :heart: by Jofferson Ramirez Tiquez
