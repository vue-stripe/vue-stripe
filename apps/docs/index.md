---
layout: page
title: Vue Stripe
titleTemplate: Stripe Elements and Checkout for Vue
description: Vue components and composables for every Stripe.js 10 element and method. Vue 3 and Vue 2.7, typed, Stripe Verified Partner.
---

<HomeHero>
<template #checkout>

```vue:line-numbers
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import PayButton from './PayButton.vue'

const clientSecret = ref<string>()

onMounted(async () => {
  // Your server creates the PaymentIntent (server.mjs)
  const response = await fetch('/api/payment-intent', { method: 'POST' })
  clientSecret.value = (await response.json()).clientSecret
})
</script>

<template>
  <VueStripeProvider publishable-key="pk_test_...">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
      <VueStripePaymentElement />
      <PayButton :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

</template>
<template #paybutton>

```vue:line-numbers
<script setup lang="ts">
// Rendered inside VueStripeElements, so usePaymentIntent can reach the Elements group
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmPayment, loading, error } = usePaymentIntent()

async function pay() {
  // Validates the Payment Element, then confirms the PaymentIntent
  // (3D Secure included) and redirects only when the method needs it
  await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${location.origin}/order/complete` },
    redirect: 'if_required'
  })
}
</script>

<template>
  <button :disabled="loading" @click="pay">Pay</button>
  <p v-if="error" role="alert">{{ error }}</p>
</template>
```

</template>
<template #server>

```js:line-numbers
// node --env-file=.env server.mjs
import { createServer } from 'node:http'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/payment-intent') {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500,
      currency: 'usd'
    })
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ clientSecret: paymentIntent.client_secret }))
    return
  }
  res.statusCode = 404
  res.end()
}).listen(3000)
```

</template>
</HomeHero>

<HomeFeatures />

<HomeIntegrations />


<HomeSection id="try-it" title="Try it with a test card" lede="This live demo runs in Stripe test mode against our demo backend. Pay with 4242 4242 4242 4242, any future expiry date and any CVC.">

<PaymentElementExample />

</HomeSection>

