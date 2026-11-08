<script setup lang="ts">
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()

// server: false fetches in the browser, so a server render does not create a PaymentIntent.
const { data, error } = await useFetch('/api/payment-intent', {
  method: 'POST',
  baseURL: config.public.apiBase,
  server: false
})
</script>

<template>
  <h1>Pay $10.00</h1>
  <p v-if="error" class="error">Could not start the payment: {{ error.message }}</p>
  <VueStripeProvider v-else :publishable-key="config.public.stripePublishableKey">
    <VueStripeElements v-if="data?.clientSecret" :client-secret="data.clientSecret">
      <PaymentForm :client-secret="data.clientSecret" />
    </VueStripeElements>
    <p v-else>Loading…</p>
  </VueStripeProvider>
</template>
