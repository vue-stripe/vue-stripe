---
layout: home

hero:
  name: Vue Stripe
  text: Stripe Elements for Vue.js
  tagline: Build beautiful payment forms with Vue 2 and Vue 3
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/vue-stripe/vue-stripe

features:
  - icon: 🔄
    title: Vue 2 & 3 Compatible
    details: Built with vue-demi for seamless compatibility with both Vue 2 and Vue 3 projects.
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
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement />
      <button @click="handleSubmit">Pay</button>
    </StripeElements>
  </StripeProvider>
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
