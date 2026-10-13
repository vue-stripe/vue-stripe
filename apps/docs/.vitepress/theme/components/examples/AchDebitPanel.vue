<script setup lang="ts">
// Rendered inside VueStripeProvider: both composables inject the Stripe instance.
// No VueStripeElements is needed, Stripe's Financial Connections modal collects the account.
import { computed, ref } from 'vue'
import { useFinancialConnections, useConfirmUsBankAccountPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  clientSecret: string
  amountLabel: string
}>()

const emit = defineEmits<{
  success: [paymentIntentId: string, status: string]
}>()

const {
  collectBankAccountForPayment,
  loading: collecting,
  error: collectError
} = useFinancialConnections()
const {
  confirmUsBankAccountPayment,
  loading: confirming,
  error: confirmError
} = useConfirmUsBankAccountPayment()

const name = ref('Jenny Rosen')
const email = ref('jenny@example.com')
const linked = ref(false)
const cancelled = ref(false)

const canLink = computed(
  () => name.value.trim() !== '' && email.value.includes('@') && !collecting.value
)

// Step 1: Stripe's modal links a bank account and attaches it to the PaymentIntent.
async function linkBankAccount() {
  cancelled.value = false
  const result = await collectBankAccountForPayment({
    clientSecret: props.clientSecret,
    params: {
      payment_method_type: 'us_bank_account',
      payment_method_data: { billing_details: { name: name.value, email: email.value } }
    }
  })
  if (result.error) return
  // Closing the modal resolves without an error, but the PaymentIntent still needs a payment method.
  if (result.paymentIntent?.status === 'requires_payment_method') {
    cancelled.value = true
    return
  }
  linked.value = result.paymentIntent?.status === 'requires_confirmation'
}

// Step 2: the customer accepts the mandate; confirming records it and starts the debit.
async function confirm() {
  const { paymentIntent } = await confirmUsBankAccountPayment(props.clientSecret)
  if (paymentIntent) emit('success', paymentIntent.id, paymentIntent.status)
}
</script>

<template>
  <div class="ach-panel">
    <template v-if="!linked">
      <label class="field">
        <span>Account holder name</span>
        <input v-model="name" type="text" autocomplete="name" data-test="ach-name" />
      </label>
      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="email" data-test="ach-email" />
      </label>

      <button
        :class="['confirm-btn', { disabled: !canLink }]"
        :disabled="!canLink"
        data-test="ach-link"
        @click="linkBankAccount"
      >
        {{ collecting ? 'Waiting for the bank modal...' : 'Link bank account' }}
      </button>

      <p v-if="cancelled" class="hint" data-test="ach-cancelled">
        No account was linked. Open the modal again to choose a bank.
      </p>
    </template>

    <template v-else>
      <div class="linked-box" data-test="ach-linked">Bank account linked to the PaymentIntent.</div>

      <p class="mandate">
        By clicking Pay, you authorize Vue Stripe Demo to debit the bank account above for
        {{ amountLabel }} through ACH Direct Debit, in accordance with these terms. You can revoke
        this authorization by contacting us.
      </p>

      <button
        :class="['confirm-btn', { disabled: confirming }]"
        :disabled="confirming"
        data-test="ach-confirm"
        @click="confirm"
      >
        {{ confirming ? 'Processing...' : `Pay ${amountLabel}` }}
      </button>
    </template>

    <div v-if="collectError || confirmError" class="error-box" data-test="ach-error">
      <strong>Error:</strong> {{ collectError || confirmError }}
    </div>
  </div>
</template>

<style scoped>
.ach-panel {
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
.linked-box {
  padding: 0.75rem 1rem;
  background: var(--vp-c-green-soft);
  border: 1px solid var(--vp-c-green-1);
  border-radius: 6px;
  font-size: 0.875rem;
}
.mandate,
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
