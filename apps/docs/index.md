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

features:
  - title: Vue 3 Ready
    details: Built for Vue 3 with full Composition API support and modern Vue patterns.
  - title: All Stripe Elements
    details: Payment Element, Card Element, Express Checkout, and more - all wrapped in Vue components.
  - title: Type-Safe
    details: Full TypeScript support with proper type definitions for all components and composables.
  - title: Reactive by Design
    details: Leverage Vue's reactivity system with composables like useStripe() and useStripeElements().
---

<div class="vp-doc">

## Quick Example

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements
      v-if="clientSecret"
      :client-secret="clientSecret"
      @ready="elementsReady = true"
    >
      <VueStripePaymentElement @ready="paymentReady = true" />
      <PayButton :client-secret="clientSecret" :disabled="!canConfirm" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import PayButton from './PayButton.vue'

const publishableKey = 'pk_test_...'
const clientSecret = ref(null)
const elementsReady = ref(false)
const paymentReady = ref(false)

const canConfirm = computed(() => elementsReady.value && paymentReady.value)

// Create the PaymentIntent on your server, then set clientSecret
onMounted(async () => {
  const response = await fetch('/api/create-payment-intent', { method: 'POST' })
  const data = await response.json()
  clientSecret.value = data.clientSecret
})
</script>
```

```vue
<!-- PayButton.vue - Must be inside VueStripeElements -->
<script setup>
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({
  clientSecret: { type: String, required: true },
  disabled: Boolean
})

// Call composables at setup scope, not inside functions
const { confirmPayment, loading, error } = usePaymentIntent()

async function pay() {
  // Validates the Payment Element (elements.submit()), then confirms the PaymentIntent
  const { paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: window.location.href },
    redirect: 'if_required'
  })

  if (paymentIntent?.status === 'succeeded') {
    console.log('Payment successful!')
  }
}
</script>

<template>
  <button :disabled="disabled || loading" @click="pay">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## See In Action

<PaymentElementExample />

::: tip
This is a live demo using Stripe's test mode. Use card number `4242 4242 4242 4242` with any future date and CVC.
:::

</div>
