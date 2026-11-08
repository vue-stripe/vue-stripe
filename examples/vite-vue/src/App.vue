<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from './PaymentForm.vue'
import PaymentStatus from './PaymentStatus.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const apiUrl = import.meta.env.VITE_API_URL ?? ''

// Payment methods that leave the page (bank redirects, some 3D Secure flows) come back here
// with the PaymentIntent's client secret in the query string.
const returnedClientSecret = new URLSearchParams(window.location.search).get(
  'payment_intent_client_secret'
)

const clientSecret = ref('')
const loadError = ref('')

onMounted(async () => {
  if (returnedClientSecret) return
  try {
    const response = await fetch(`${apiUrl}/api/payment-intent`, { method: 'POST' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
    clientSecret.value = data.clientSecret
  } catch (error) {
    loadError.value = `Could not start the payment: ${(error as Error).message}`
  }
})
</script>

<template>
  <main>
    <h1>Pay $10.00</h1>
    <VueStripeProvider :publishable-key="publishableKey">
      <PaymentStatus v-if="returnedClientSecret" :client-secret="returnedClientSecret" />
      <VueStripeElements v-else-if="clientSecret" :client-secret="clientSecret">
        <PaymentForm :client-secret="clientSecret" />
      </VueStripeElements>
      <p v-else-if="loadError" class="error">{{ loadError }}</p>
      <p v-else>Loading…</p>
    </VueStripeProvider>
  </main>
</template>
