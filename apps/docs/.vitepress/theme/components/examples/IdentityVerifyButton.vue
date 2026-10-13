<script setup lang="ts">
// Rendered inside VueStripeProvider so useIdentity can inject the Stripe instance.
import { ref } from 'vue'
import { useIdentity } from '@vue-stripe/vue-stripe'
import { useBackendApi } from '../../composables/useBackendApi'

const emit = defineEmits<{
  submitted: [verificationSessionId: string]
}>()

const { verifyIdentity, loading, error } = useIdentity()
const { createIdentitySession, loading: creating } = useBackendApi()

const sessionError = ref<string | null>(null)
const cancelled = ref(false)

async function verify() {
  sessionError.value = null
  cancelled.value = false
  let session
  try {
    // A new VerificationSession per attempt: the server keeps the secret key.
    session = await createIdentitySession()
  } catch (err) {
    sessionError.value =
      err instanceof Error ? err.message : 'Failed to create verification session'
    return
  }
  const result = await verifyIdentity(session.clientSecret)
  if (!result.error) {
    emit('submitted', session.verificationSessionId)
    return
  }
  // Closing the modal is not a failure worth an error box.
  if ('code' in result.error && result.error.code === 'session_cancelled') cancelled.value = true
}
</script>

<template>
  <div class="identity-verify">
    <button
      :class="['confirm-btn', { disabled: loading || creating }]"
      :disabled="loading || creating"
      data-test="identity-verify"
      @click="verify"
    >
      {{
        creating
          ? 'Creating verification session...'
          : loading
            ? 'Verification in progress...'
            : 'Verify my identity'
      }}
    </button>

    <p v-if="cancelled" class="hint" data-test="identity-cancelled">
      You closed the verification modal. Start again whenever you are ready.
    </p>
    <div v-else-if="sessionError || error" class="error-box" data-test="identity-error">
      <strong>Error:</strong> {{ sessionError || error }}
    </div>
  </div>
</template>

<style scoped>
.identity-verify {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
