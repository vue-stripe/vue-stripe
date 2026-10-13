<script setup lang="ts">
// Rendered inside VueStripeProvider: usePaymentRequest and useConfirmCardPayment only need
// the Stripe instance. The browser's own payment sheet collects the card or wallet.
import { computed, ref } from 'vue'
import { usePaymentRequest, useConfirmCardPayment } from '@vue-stripe/vue-stripe'
import { useBackendApi } from '../../composables/useBackendApi'

const AMOUNT = 1099

const emit = defineEmits<{
  success: [paymentIntentId: string]
}>()

const { createPaymentIntent } = useBackendApi()
const { confirmCardPayment } = useConfirmCardPayment()
const { canMakePayment, loading, error, show, on } = usePaymentRequest({
  country: 'US',
  currency: 'usd',
  total: { label: 'Vue Stripe demo', amount: AMOUNT },
  requestPayerName: true,
  requestPayerEmail: true
})

const payError = ref<string | null>(null)

// Which wallets the browser offers, e.g. "googlePay, link".
const wallets = computed(() =>
  canMakePayment.value
    ? Object.entries(canMakePayment.value)
        .filter(([, available]) => available)
        .map(([name]) => name)
        .join(', ')
    : ''
)

on('paymentmethod', async (event) => {
  payError.value = null
  try {
    const { clientSecret } = await createPaymentIntent({ amount: AMOUNT, currency: 'usd' })
    // Confirm without handling actions so the browser sheet can close first.
    const { paymentIntent, error: confirmError } = await confirmCardPayment(
      clientSecret,
      { payment_method: event.paymentMethod.id },
      { handleActions: false }
    )
    event.complete(confirmError ? 'fail' : 'success')
    if (confirmError || !paymentIntent) {
      payError.value = confirmError?.message ?? 'Payment failed'
      return
    }
    // 3D Secure and other next actions run after the sheet has closed.
    const final =
      paymentIntent.status === 'requires_action'
        ? (await confirmCardPayment(clientSecret)).paymentIntent
        : paymentIntent
    if (final?.status === 'succeeded') emit('success', final.id)
  } catch (err) {
    event.complete('fail')
    payError.value = err instanceof Error ? err.message : 'Payment failed'
  }
})
</script>

<template>
  <div class="payment-request-panel">
    <dl class="wallet-state" data-test="can-make-payment">
      <dt>canMakePayment</dt>
      <dd>
        <template v-if="loading">Checking for a wallet...</template>
        <template v-else-if="canMakePayment">{{ wallets || 'a browser-saved card' }}</template>
        <template v-else>No wallet in this browser</template>
      </dd>
    </dl>

    <button v-if="canMakePayment" class="confirm-btn" data-test="payment-request-pay" @click="show">
      Pay $10.99
    </button>
    <p v-else-if="!loading" class="hint">
      The Payment Request API needs HTTPS, a wallet (Apple Pay, Google Pay or Link) or a saved card
      in this browser. Headless and private windows usually have none. Try the
      <a href="/live-demo/express-checkout">Express Checkout Element</a> demo for wallet buttons.
    </p>

    <div v-if="error || payError" class="error-box">
      <strong>Error:</strong> {{ error || payError }}
    </div>
  </div>
</template>

<style scoped>
.payment-request-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.wallet-state {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  font-size: 0.875rem;
}
.wallet-state dt {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
}
.wallet-state dd {
  margin: 0;
  font-weight: 600;
}
.hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
}
.confirm-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #635bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.confirm-btn:hover {
  opacity: 0.9;
}
.error-box {
  padding: 0.75rem 1rem;
  background: var(--vp-c-danger-soft);
  border: 1px solid var(--vp-c-danger-1);
  border-radius: 6px;
  color: var(--vp-c-danger-1);
  font-size: 0.875rem;
}
</style>
