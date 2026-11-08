<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

// confirmPayment() validates the form (elements.submit()) and confirms with the injected Elements.
const { confirmPayment, loading, error } = usePaymentIntent()
const status = ref('')

async function pay() {
  const { paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    // Only payment methods that need a redirect leave the page; cards stay here.
    confirmParams: { return_url: window.location.origin + window.location.pathname },
    redirect: 'if_required'
  })
  if (paymentIntent) status.value = paymentIntent.status
}
</script>

<template>
  <p v-if="status === 'succeeded'">Payment succeeded. Thank you!</p>
  <form v-else @submit.prevent="pay">
    <VueStripePaymentElement />
    <button type="submit" :disabled="loading">{{ loading ? 'Paying…' : 'Pay $10.00' }}</button>
    <p v-if="status">Payment status: {{ status }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
