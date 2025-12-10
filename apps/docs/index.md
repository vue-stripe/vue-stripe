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
    <VueStripeElements :client-secret="clientSecret" @ready="elementsReady = true">
      <VueStripePaymentElement @ready="paymentReady = true" />
      <PayButton :disabled="!canConfirm" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import PayButton from './PayButton.vue'

const publishableKey = 'pk_test_...'
const clientSecret = ref(null)
const elementsReady = ref(false)
const paymentReady = ref(false)

const canConfirm = computed(() => elementsReady.value && paymentReady.value)

// Create PaymentIntent on your server, then set clientSecret
async function createPaymentIntent(productId) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ productId })
  })
  const data = await response.json()
  clientSecret.value = data.clientSecret
}
</script>
```

```vue
<!-- PayButton.vue - Must be inside VueStripeElements -->
<script setup>
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

// Call composables at setup scope, not inside functions
const { stripe } = useStripe()
const { elements } = useStripeElements()

async function confirmPayment() {
  const { error, paymentIntent } = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: { return_url: window.location.href },
    redirect: 'if_required'
  })

  if (error) {
    console.error(error.message)
  } else if (paymentIntent.status === 'succeeded') {
    console.log('Payment successful!')
  }
}
</script>

<template>
  <button @click="confirmPayment">Pay</button>
</template>
```

## See In Action

<PaymentElementExample />

::: tip
This is a live demo using Stripe's test mode. Use card number `4242 4242 4242 4242` with any future date and CVC.
:::

</div>
