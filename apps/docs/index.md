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
  - title: Vue 3 and Vue 2.7
    details: One build for both, with the Composition API and render-function components, tested on each in CI.
  - title: All Stripe Elements
    details: Payment, Express Checkout, Card, Address, Link, IBAN, BECS, Tax ID, Currency Selector, Contact Details, Issuing and more - all wrapped in Vue components.
  - title: Every Checkout
    details: Hosted Checkout, Embedded Checkout, Custom Checkout on a Checkout Session, the Checkout Form and the Pricing Table.
    link: /guide/approaches
    linkText: Choose your approach
  - title: Composables for Every Method
    details: usePaymentIntent, a useConfirm composable per payment method, tokens, Financial Connections, Identity and more. Your code never needs the raw stripe object.
  - title: Type-Safe
    details: Full TypeScript support with proper type definitions for all components and composables.
  - title: 100% Stripe.js Coverage
    details: Every Stripe.js 10 element and method has a wrapper, tracked on the coverage page.
    link: /coverage
    linkText: See the coverage
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
