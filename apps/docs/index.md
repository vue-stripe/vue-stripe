---
layout: page
title: Vue Stripe
titleTemplate: Stripe Elements and Checkout for Vue
description: Vue components and composables for every Stripe.js 10 element and method. Vue 3 and Vue 2.7, typed, Stripe Verified Partner.
---

<HomeHero>

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
      <PayButton :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

</HomeHero>

<HomeFeatures />

<HomeIntegrations />

<HomeSection id="quick-example" title="A payment form in two files" lede="The page renders the providers and the Payment Element; a child component confirms the payment with usePaymentIntent.">

::: code-group

```vue [CheckoutPage.vue]
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

```vue [PayButton.vue]
<!-- Rendered inside VueStripeElements, so usePaymentIntent can reach the Elements group -->
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

:::

</HomeSection>

<HomeSection id="try-it" title="Try it with a test card" lede="This live demo runs in Stripe test mode against our demo backend. Pay with 4242 4242 4242 4242, any future expiry date and any CVC.">

<PaymentElementExample />

</HomeSection>

<HomeCoverage />
