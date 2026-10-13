<script setup lang="ts">
// Rendered inside VueStripeElements so useStripeElements/useConfirmAuBecsDebitPayment can inject the Stripe context.
import { computed } from 'vue'
import { useConfirmAuBecsDebitPayment, useStripeElements } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  canConfirm: boolean
  confirming: boolean
  clientSecret: string
  amount?: number | null | undefined
  customerName?: string | undefined
  customerEmail?: string | undefined
}>()

const emit = defineEmits<{
  'confirm-start': []
  'confirm-end': []
  success: []
  error: [message: string | null]
}>()

const { getElement } = useStripeElements()
const { confirmAuBecsDebitPayment } = useConfirmAuBecsDebitPayment()

function formatPrice(amount: number | null | undefined) {
  if (!amount) return ''
  return `AUD ${(amount / 100).toFixed(2)}`
}

const disabled = computed(() => !props.canConfirm || props.confirming)

async function confirmPayment() {
  emit('confirm-start')
  emit('error', null)
  try {
    const auBankElement = getElement('auBankAccount')
    if (!auBankElement) throw new Error('AU Bank Account element not found')

    const { error, paymentIntent } = await confirmAuBecsDebitPayment(props.clientSecret, {
      payment_method: {
        au_becs_debit: auBankElement,
        billing_details: {
          name: props.customerName || '',
          email: props.customerEmail || ''
        }
      }
    })
    if (error) throw new Error(error.message)
    if (paymentIntent?.status === 'processing') emit('success')
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Payment failed')
  } finally {
    emit('confirm-end')
  }
}
</script>

<template>
  <button :class="['confirm-btn', { disabled }]" :disabled="disabled" @click="confirmPayment">
    {{ confirming ? 'Processing...' : `Pay ${formatPrice(amount)} with BECS` }}
  </button>
</template>
