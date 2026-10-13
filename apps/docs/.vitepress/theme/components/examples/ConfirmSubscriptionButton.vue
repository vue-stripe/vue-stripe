<script setup lang="ts">
// Rendered inside VueStripeElements so usePaymentIntent can inject the Stripe and Elements context.
import { computed } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  canConfirm: boolean
  confirming: boolean
  clientSecret: string
}>()

const emit = defineEmits<{
  'confirm-start': []
  'confirm-end': []
  success: []
  error: [message: string | null]
}>()

const { confirmPayment: confirm } = usePaymentIntent()

const disabled = computed(() => !props.canConfirm || props.confirming)

async function confirmPayment() {
  emit('confirm-start')
  emit('error', null)
  try {
    // usePaymentIntent submits the elements form, then confirms the payment
    const { error } = await confirm({
      clientSecret: props.clientSecret,
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
