<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string; label: string }>()

// The first invoice's payment is a PaymentIntent; paying it activates the subscription.
const { confirmPayment, loading, error } = usePaymentIntent()
const status = ref('')

async function pay() {
  const { paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: window.location.origin + window.location.pathname },
    redirect: 'if_required'
  })
  if (paymentIntent) status.value = paymentIntent.status
}
</script>

<template>
  <p v-if="status === 'succeeded'">You are subscribed. Thank you!</p>
  <form v-else @submit.prevent="pay">
    <VueStripePaymentElement />
    <button type="submit" :disabled="loading">{{ loading ? 'Paying…' : label }}</button>
    <p v-if="status">Payment status: {{ status }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
