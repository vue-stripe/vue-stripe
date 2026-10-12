<script setup lang="ts">
// Rendered inside VueStripeCheckoutElementsProvider so useCheckoutSession can inject the session.
import { computed, ref } from 'vue'
import {
  VueStripePaymentElement,
  VueStripeAddressElement,
  VueStripeCurrencySelectorElement,
  useCheckoutSession
} from '@vue-stripe/vue-stripe'

const emit = defineEmits<{
  success: [sessionId: string]
}>()

const { session, loading, confirm } = useCheckoutSession()

const email = ref('')
const paymentReady = ref(false)
const confirming = ref(false)
const confirmError = ref<string | null>(null)

const total = computed(() => session.value?.total.total.amount ?? '')
// The Currency Selector only has something to show when Adaptive Pricing offers other currencies.
const hasCurrencyOptions = computed(() => (session.value?.currencyOptions?.length ?? 0) > 1)
const canConfirm = computed(
  () => !loading.value && paymentReady.value && email.value.includes('@') && !confirming.value
)

async function pay() {
  confirming.value = true
  confirmError.value = null
  // No returnUrl here: the session was created with one, and Stripe rejects a second.
  // redirect: 'if_required' keeps card payments on this page; redirect-based methods still leave.
  const result = await confirm({ email: email.value, redirect: 'if_required' })
  confirming.value = false
  if (result.type === 'error') {
    confirmError.value = result.error.message
    return
  }
  emit('success', result.session.id)
}
</script>

<template>
  <div class="checkout-form">
    <label class="field">
      <span>Email</span>
      <input v-model="email" type="email" placeholder="you@example.com" autocomplete="email" />
    </label>

    <div v-if="hasCurrencyOptions" class="field">
      <span>Currency</span>
      <VueStripeCurrencySelectorElement />
    </div>

    <div class="field">
      <span>Payment</span>
      <VueStripePaymentElement @ready="paymentReady = true" />
    </div>

    <div class="field">
      <span>Billing address</span>
      <VueStripeAddressElement :options="{ mode: 'billing' }" />
    </div>

    <button
      :class="['confirm-btn', { disabled: !canConfirm }]"
      :disabled="!canConfirm"
      data-test="pay"
      @click="pay"
    >
      {{ confirming ? 'Processing...' : `Pay ${total}` }}
    </button>

    <div v-if="confirmError" class="error-box">
      <strong>Payment Error:</strong> {{ confirmError }}
    </div>
  </div>
</template>

<style scoped>
.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.field > span {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.field input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9375rem;
}
.field input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
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
.confirm-btn:hover:not(.disabled) {
  opacity: 0.9;
}
.confirm-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
