<script setup lang="ts">
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

// Stripe redirects here with payment_intent_client_secret in the query string. This page only
// informs the customer; fulfil orders from the payment_intent.succeeded webhook.
const route = useRoute()
const { retrievePaymentIntent } = usePaymentIntent()
const status = ref('')

onMounted(async () => {
  const clientSecret = route.query.payment_intent_client_secret
  if (typeof clientSecret !== 'string') {
    status.value = 'unknown'
    return
  }
  const { paymentIntent } = await retrievePaymentIntent(clientSecret)
  status.value = paymentIntent?.status ?? 'unknown'
})
</script>

<template>
  <p v-if="status === 'succeeded'">Payment succeeded. Thank you!</p>
  <p v-else-if="status === 'processing'">Your payment is processing.</p>
  <p v-else-if="status" class="error">The payment did not complete ({{ status }}).</p>
  <p v-else>Checking the payment…</p>
</template>
