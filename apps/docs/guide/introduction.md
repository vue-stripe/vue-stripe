# Introduction

Vue Stripe is a Vue.js library that wraps [Stripe.js](https://stripe.com/docs/js) and [Stripe Elements](https://stripe.com/docs/payments/elements) into Vue components and composables.

## What is Stripe Elements?

Stripe Elements are pre-built UI components that help you collect payment information securely. Instead of building payment forms from scratch, you use Stripe's components that:

- **Handle sensitive data securely** - Card numbers never touch your servers
- **Support 100+ payment methods** - Cards, wallets, bank transfers, and more
- **Adapt to your customer's location** - Show relevant payment methods automatically
- **Look professional** - Pre-styled and customizable

## What does Vue Stripe provide?

Vue Stripe bridges the gap between Stripe.js and Vue.js by providing:

### 1. Vue Components
Instead of manually creating and mounting Stripe elements, you use Vue components:

```vue
<!-- Without Vue Stripe -->
<script>
const stripe = await loadStripe('pk_test_...')
const elements = stripe.elements()
const paymentElement = elements.create('payment')
paymentElement.mount('#payment-element')
</script>
<template>
  <div id="payment-element"></div>
</template>

<!-- With Vue Stripe -->
<template>
  <VueStripeProvider :publishable-key="pk">
    <VueStripeElements :client-secret="secret">
      <VueStripePaymentElement />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

### 2. Reactive Composables
Access Stripe instances with Vue's reactivity:

```js
import { watch } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading, error } = useStripe()

// stripe.value is reactive - use in templates or watchers
watch(stripe, (newStripe) => {
  if (newStripe) {
    console.log('Stripe ready!')
  }
})
```

### 3. Vue 2 & Vue 3 Support
Built with [vue-demi](https://github.com/vueuse/vue-demi), the library works identically in both Vue versions.

## How this guide is structured

This documentation is organized to build your knowledge progressively:

1. **Installation** - Set up the library in your project
2. **Your First Payment** - Build a working payment form
3. **Understanding the Architecture** - Learn how components work together
4. **Choosing Your Approach** - Pick the right elements for your use case
5. **Building Payment Forms** - Deep dive into each component
6. **Advanced Topics** - Error handling, TypeScript, SSR, and more

## Prerequisites

Before you begin, you should:

- Have a [Stripe account](https://dashboard.stripe.com/register) (test mode is fine)
- Know the basics of Vue.js (components, props, events)
- Have a Vue 2 or Vue 3 project set up

Ready? Let's [install the library](/guide/installation).
