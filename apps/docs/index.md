---
layout: home

hero:
  name: Vue Stripe
  text: Stripe Elements for Vue.js
  tagline: Build beautiful payment forms with Vue.js
  image:
    src: /vue-stripe-logo-variant-1.png
    alt: Vue Stripe
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/vue-stripe/vue-stripe

features:
  - icon: 🔄
    title: Vue 3 Ready
    details: Built for Vue 3 with full Composition API support and modern Vue patterns.
  - icon: 💳
    title: All Stripe Elements
    details: Payment Element, Card Element, Express Checkout, and more - all wrapped in Vue components.
  - icon: 🎯
    title: Type-Safe
    details: Full TypeScript support with proper type definitions for all components and composables.
  - icon: ⚡
    title: Reactive by Design
    details: Leverage Vue's reactivity system with composables like useStripe() and useStripeElements().
---

<div class="vp-doc">

## Quick Example

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
      <button @click="handleSubmit">Pay</button>
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = 'pk_test_...'
const clientSecret = 'pi_..._secret_...'

const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  const result = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: 'https://example.com/complete'
    }
  })
}
</script>
```

</div>
