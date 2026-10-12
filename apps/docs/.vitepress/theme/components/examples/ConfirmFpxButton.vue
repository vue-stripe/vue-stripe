<script setup lang="ts">
// Rendered inside VueStripeElements so useStripe/useStripeElements can inject the Stripe context.
import { computed } from 'vue'
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  canConfirm: boolean
  confirming: boolean
  clientSecret: string
  amount?: number | null | undefined
}>()

const emit = defineEmits<{
  'confirm-start': []
  'confirm-end': []
  success: []
  error: [message: string | null]
}>()

const { stripe } = useStripe()
const { elements } = useStripeElements()

function formatPrice(amount: number | null | undefined) {
  if (!amount) return ''
  return `MYR ${(amount / 100).toFixed(2)}`
}

const disabled = computed(() => !props.canConfirm || props.confirming)

async function confirmPayment() {
  emit('confirm-start')
  emit('error', null)
  try {
    if (!stripe.value || !elements.value) throw new Error('Stripe not initialized')

    const fpxBankElement = elements.value.getElement('fpxBank')
    if (!fpxBankElement) throw new Error('FPX element not found')

    const { error, paymentIntent } = await stripe.value.confirmFpxPayment(props.clientSecret, {
      payment_method: { fpx: fpxBankElement },
      return_url: window.location.href
    })
    if (error) throw new Error(error.message)
    // FPX always redirects the browser to `return_url`, so on the happy path
    // this code doesn't run; the outcome is read back after the redirect.
    // This only fires for non-redirect outcomes (e.g. an immediate failure
    // that still resolves a paymentIntent).
    if (paymentIntent) emit('success')
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Payment failed')
  } finally {
    emit('confirm-end')
  }
}
</script>

<template>
  <button :class="['confirm-btn', { disabled }]" :disabled="disabled" @click="confirmPayment">
    {{ confirming ? 'Redirecting to bank...' : `Pay ${formatPrice(amount)} with FPX` }}
  </button>
</template>
