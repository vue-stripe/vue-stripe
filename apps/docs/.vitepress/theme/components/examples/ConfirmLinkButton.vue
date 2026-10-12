<script setup lang="ts">
// Rendered inside VueStripeElements so useStripe/useStripeElements can inject the Stripe context.
import { computed } from 'vue'
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  canConfirm: boolean
  confirming: boolean
  amount?: number | null | undefined
  currency?: string | undefined
}>()

const emit = defineEmits<{
  'confirm-start': []
  'confirm-end': []
  success: []
  error: [message: string | null]
}>()

const { stripe } = useStripe()
const { elements } = useStripeElements()

function formatPrice(amount: number | null | undefined, currency: string | undefined) {
  if (!amount || !currency) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100)
}

const disabled = computed(() => !props.canConfirm || props.confirming)

async function confirmPayment() {
  emit('confirm-start')
  emit('error', null)
  try {
    if (!stripe.value || !elements.value) throw new Error('Stripe not initialized')

    const { error, paymentIntent } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required'
    })
    if (error) throw new Error(error.message)
    if (paymentIntent?.status === 'succeeded') emit('success')
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Payment failed')
  } finally {
    emit('confirm-end')
  }
}
</script>

<template>
  <button :class="['confirm-btn', { disabled }]" :disabled="disabled" @click="confirmPayment">
    {{ confirming ? 'Processing...' : `Pay ${formatPrice(amount, currency)}` }}
  </button>
</template>
