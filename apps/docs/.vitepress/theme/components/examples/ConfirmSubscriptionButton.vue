<script setup lang="ts">
// Rendered inside VueStripeElements so useStripe/useStripeElements can inject the Stripe context.
import { computed } from 'vue'
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  canConfirm: boolean
  confirming: boolean
}>()

const emit = defineEmits<{
  'confirm-start': []
  'confirm-end': []
  success: []
  error: [message: string | null]
}>()

const { stripe } = useStripe()
const { elements } = useStripeElements()

const disabled = computed(() => !props.canConfirm || props.confirming)

async function confirmPayment() {
  emit('confirm-start')
  emit('error', null)
  try {
    if (!stripe.value || !elements.value) {
      throw new Error('Stripe not initialized')
    }

    // First submit the elements form
    const { error: submitError } = await elements.value.submit()
    if (submitError) {
      throw new Error(submitError.message)
    }

    // Then confirm the payment
    const { error } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: window.location.href
      },
      redirect: 'if_required'
    })

    if (error) {
      throw new Error(error.message)
    }

    // Payment succeeded
    emit('success')
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Payment failed')
  } finally {
    emit('confirm-end')
  }
}
</script>

<template>
  <button :class="['confirm-btn', { disabled }]" :disabled="disabled" @click="confirmPayment">
    {{ confirming ? 'Processing...' : 'Start Subscription' }}
  </button>
</template>
