<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()
</script>

<template>
  <h1>Payment</h1>
  <VueStripeProvider :publishable-key="config.public.stripePublishableKey">
    <PaymentStatus />
  </VueStripeProvider>
  <NuxtLink to="/">Make another payment</NuxtLink>
</template>
