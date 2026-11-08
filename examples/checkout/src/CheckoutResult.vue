<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{ sessionId: string }>()

const apiUrl = import.meta.env.VITE_API_URL ?? ''
const result = ref<{ status: string; paymentStatus: string } | null>(null)
const failed = ref(false)

// Ask the server: the redirect alone does not prove the payment. Fulfil orders from the
// checkout.session.completed webhook, not from this page.
onMounted(async () => {
  try {
    const query = new URLSearchParams({ session_id: props.sessionId })
    const response = await fetch(`${apiUrl}/api/checkout-status?${query}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    result.value = await response.json()
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <p v-if="result?.paymentStatus === 'paid'">Payment received. Thank you!</p>
  <p v-else-if="result?.status === 'complete'">Your payment is processing.</p>
  <p v-else-if="result" class="error">The payment did not complete.</p>
  <p v-else-if="failed">
    Back from Checkout with session <code>{{ sessionId }}</code
    >, but the server's <code>/api/checkout-status</code> route did not answer, so the status is
    unknown.
  </p>
  <p v-else>Checking the payment…</p>
  <a href="/">Start over</a>
</template>
