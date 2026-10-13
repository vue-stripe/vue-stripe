<script setup lang="ts">
// Rendered inside VueStripeCheckoutFormProvider so useCheckoutForm can inject the session.
import { computed, ref } from 'vue'
import { VueStripeCheckoutForm, useCheckoutForm } from '@vue-stripe/vue-stripe'
import type {
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent
} from '@vue-stripe/vue-stripe'

const emit = defineEmits<{
  success: [sessionId: string]
}>()

const { session, confirm } = useCheckoutForm()

const complete = ref(false)
const confirming = ref(false)
const confirmError = ref<string | null>(null)

const total = computed(() => session.value?.total.total.amount ?? '')

function onChange(event: StripeCheckoutFormChangeEvent) {
  complete.value = event.complete
}

// The form renders its own Pay button (and wallet buttons); both fire @confirm.
async function onConfirm(event: StripeCheckoutFormConfirmEvent) {
  confirming.value = true
  confirmError.value = null
  // No returnUrl here: the session was created with one.
  // redirect: 'if_required' keeps card payments on this page; redirect-based methods still leave.
  const result = await confirm({ formConfirmEvent: event, redirect: 'if_required' })
  confirming.value = false
  if (result.type === 'error') {
    confirmError.value = result.error.message
    return
  }
  emit('success', result.session.id)
}
</script>

<template>
  <div class="checkout-form-panel">
    <dl class="session-state" data-test="session-state">
      <dt>Session total</dt>
      <dd>{{ total || '-' }}</dd>
      <dt>Form complete</dt>
      <dd data-test="form-complete">{{ complete ? 'Yes' : 'No' }}</dd>
    </dl>

    <div data-test="checkout-form">
      <VueStripeCheckoutForm
        :options="{ layout: 'expanded' }"
        @change="onChange"
        @confirm="onConfirm"
      />
    </div>

    <p v-if="confirming" class="confirming">Processing...</p>
    <div v-if="confirmError" class="error-box">
      <strong>Payment Error:</strong> {{ confirmError }}
    </div>
  </div>
</template>

<style scoped>
/* Rendered on the white .stripe-container, like Stripe's form itself. */
.checkout-form-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.session-state {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background: #f6f8fa;
  border-radius: 6px;
  color: #1f2937;
  font-size: 0.8125rem;
}
.session-state dt {
  color: #6b7280;
}
.session-state dd {
  margin: 0;
  font-weight: 600;
}
.confirming {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
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
