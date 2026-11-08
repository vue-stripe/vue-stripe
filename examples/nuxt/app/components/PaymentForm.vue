<script setup lang="ts">
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

// confirmPayment() validates the form (elements.submit()) and confirms with the injected Elements.
const { confirmPayment, loading, error } = usePaymentIntent()

async function pay() {
  // On success Stripe redirects to the return page, which reads the result.
  await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/payment-complete` },
    redirect: 'always'
  })
}
</script>

<template>
  <form @submit.prevent="pay">
    <VueStripePaymentElement />
    <button type="submit" :disabled="loading">{{ loading ? 'Paying…' : 'Pay $10.00' }}</button>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
