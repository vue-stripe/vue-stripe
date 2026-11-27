<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { retrievePaymentIntent } = usePaymentIntent()
const status = ref('')

onMounted(async () => {
  const { paymentIntent } = await retrievePaymentIntent(props.clientSecret)
  status.value = paymentIntent?.status ?? 'unknown'
})
</script>

<template>
  <p v-if="status === 'succeeded'">Payment succeeded. Thank you!</p>
  <p v-else-if="status === 'processing'">Your payment is processing.</p>
  <p v-else-if="status" class="error">The payment did not complete ({{ status }}).</p>
  <p v-else>Checking the payment…</p>
  <a href="/">Make another payment</a>
</template>
