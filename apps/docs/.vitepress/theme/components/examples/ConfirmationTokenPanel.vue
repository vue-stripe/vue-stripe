<script setup lang="ts">
// Rendered inside VueStripeElements (deferred intent: mode, amount, currency) so
// useCreateConfirmationToken can submit the Payment Element and read it.
import { ref } from 'vue'
import { VueStripePaymentElement, useCreateConfirmationToken } from '@vue-stripe/vue-stripe'

const { createConfirmationToken, loading, error } = useCreateConfirmationToken()

const ready = ref(false)
const result = ref<{ id: string; type: string; detail: string } | null>(null)

async function create() {
  result.value = null
  // Runs elements.submit() first, so validation errors land on `error` without a token.
  const { confirmationToken } = await createConfirmationToken({
    params: { return_url: window.location.href }
  })
  if (!confirmationToken) return
  const preview = confirmationToken.payment_method_preview
  result.value = {
    id: confirmationToken.id,
    type: preview.type,
    detail: preview.card ? `${preview.card.brand} ending ${preview.card.last4}` : ''
  }
}
</script>

<template>
  <div class="token-panel">
    <VueStripePaymentElement @ready="ready = true" />
    <button
      :class="['action-btn', { disabled: !ready || loading }]"
      :disabled="!ready || loading"
      data-test="create-confirmation-token"
      @click="create"
    >
      {{ loading ? 'Creating...' : 'Create ConfirmationToken' }}
    </button>
    <dl v-if="result" class="result" data-test="confirmation-token-result">
      <dt>ConfirmationToken</dt>
      <dd>
        <code>{{ result.id }}</code>
      </dd>
      <dt>Payment method</dt>
      <dd>
        {{ result.type }}<template v-if="result.detail">, {{ result.detail }}</template>
      </dd>
    </dl>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<style scoped src="./token-panel.css"></style>
