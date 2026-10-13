<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import IdentityVerifyButton from './IdentityVerifyButton.vue'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()

const verificationSessionId = ref<string | null>(null)

function reset() {
  verificationSessionId.value = null
}
</script>

<template>
  <div class="identity-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <div v-if="!verificationSessionId" class="step-section">
        <h4>Verify your identity</h4>
        <p class="intro">
          Stripe's modal asks for a photo ID and a selfie. In test mode, pick an outcome under
          Complete with test data and click Submit; no real document is needed.
        </p>
        <VueStripeProvider :publishable-key="publishableKey">
          <IdentityVerifyButton @submitted="(id: string) => (verificationSessionId = id)" />
        </VueStripeProvider>
      </div>

      <div v-else class="success-state" data-test="identity-submitted">
        <span class="success-icon">&#10003;</span>
        <h4>Verification Submitted</h4>
        <p>
          Stripe processes the verification and reports the outcome to the server with the
          <code>identity.verification_session.*</code> webhooks.
        </p>
        <p class="payment-id">
          VerificationSession: <code>{{ verificationSessionId }}</code>
        </p>
        <button class="reset-btn" @click="reset">Start Over</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.identity-example {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}
.warning-box {
  padding: 1rem;
  background: var(--vp-c-yellow-soft);
  border: 1px solid var(--vp-c-yellow-1);
  border-radius: 8px;
  color: var(--vp-c-yellow-darker);
}
.warning-box strong {
  display: block;
  margin-bottom: 0.5rem;
}
.warning-box p {
  margin: 0;
  font-size: 0.875rem;
}
.step-section {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}
.step-section h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.intro {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
.success-state {
  text-align: center;
  padding: 2rem;
}
.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: var(--vp-c-green-1);
  color: white;
  border-radius: 50%;
  font-size: 2rem;
  margin-bottom: 1rem;
}
.success-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}
.success-state p {
  margin: 0.5rem 0;
  color: var(--vp-c-text-2);
}
.payment-id code {
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 0.75rem;
}
.reset-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.reset-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
