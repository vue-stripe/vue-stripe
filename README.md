# Vue Stripe 5

Stripe Checkout and Elements for Vue.js 3

## Early version notes

This version is still under development, use at your own risk.

### Installation 

```sh
yarn add @vue-stripe/vue-stripe
```

```sh
npm install @vue-stripe/vue-stripe
```

### Usage

**Stripe Checkout**

```vue
<template>
<button @click="onCheckout">Checkout</button>
</template>

<script>
import { useVueStripe } from '@vue-stripe/vue-stripe'
export default {
  setup () {
    const { redirectToCheckout } = useVueStripe('pk_test_JKS1.....Ais2Fa9');

    async function onCheckout () {
      await redirectToCheckout({ 
        successUrl: window.location.origin,
        cancelUrl: window.location.origin,
        mode: 'subscription',
        lineItems: [
          {
            price: 'price_XXX...',
            quantity: 1
          }
        ]  
      });
    }

    return {
      onCheckout,
    }
  },
}
</script>
```

## Development logs
- 2023/02/01
  - create vuepress docs https://github.com/vue-stripe/docs

- 2023/01/31
  - rename checkout composable
  - minor validation changes in plugin
  - make plugin injectable
  - make plugin a global mixin
  - convert stripe variable to non ref
  - make vue a peer dependency

- 2023/01/30
  - Update the old branch and add various tooling setup
  - Make checkout a composable instead of a component
