<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  type ConfirmPaymentResult
} from '@vue-stripe/vue-stripe'
import PaymentActions from '@/components/docs/PaymentActions.vue'

// Publishable key comes from the shared playground config (set via the header
// "Add Key" dialog / localStorage) — never hardcode a key in source.
const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
const publishableKey = computed(() => stripeConfig?.publishableKey ?? '')
const clientSecret = ref('')
const clientSecretInput = ref('')

// The components' events only drive the debug panel; confirming goes through PaymentActions.
const stripeLoaded = ref(false)
const elementsReady = ref(false)

const setClientSecret = () => {
  clientSecret.value = clientSecretInput.value.trim()
}

// PaymentActions' slot `confirm`: usePaymentIntent().confirmPayment for this page's return URL.
type Confirm = (returnUrl: string) => Promise<ConfirmPaymentResult>

const handleSubmit = async (confirm: Confirm) => {
  const { error } = await confirm(`${window.location.origin}/docs-example`)
  if (!error) alert('Payment succeeded!')
}
</script>

<template>
  <div class="payment-form">
    <h2>Docs Example Test</h2>
    <p class="description">
      Testing the Payment Element pattern from the documentation (usePaymentIntent).
    </p>

    <!-- No key configured -->
    <div v-if="!publishableKey" class="error">
      No Stripe publishable key configured. Click <strong>"Add Key"</strong> in the header to add a
      test key.
    </div>

    <template v-else>
      <!-- Client Secret Input -->
      <div v-if="!clientSecret" class="secret-form">
        <label for="secret">Client Secret (from PaymentIntent):</label>
        <input
          id="secret"
          v-model="clientSecretInput"
          type="text"
          placeholder="pi_xxx_secret_xxx"
        />
        <button :disabled="!clientSecretInput.trim()" @click="setClientSecret">
          Set Client Secret
        </button>
        <p class="hint">
          Create a PaymentIntent in
          <a href="https://dashboard.stripe.com/test/payments" target="_blank">Stripe Dashboard</a>
          and paste the client_secret here.
        </p>
      </div>

      <!-- Payment Form -->
      <VueStripeProvider v-else :publishable-key="publishableKey" @load="stripeLoaded = true">
        <VueStripeElements :client-secret="clientSecret" @ready="elementsReady = true">
          <PaymentActions v-slot="{ confirm, loading, error }" :client-secret="clientSecret">
            <form @submit.prevent="handleSubmit(confirm)">
              <VueStripePaymentElement />

              <div v-if="error" class="error">
                {{ error }}
              </div>

              <button type="submit" :disabled="loading">
                {{ loading ? 'Processing...' : 'Pay Now' }}
              </button>
            </form>
          </PaymentActions>
        </VueStripeElements>
      </VueStripeProvider>
    </template>

    <!-- Debug Info -->
    <div class="debug">
      <h4>Debug Info:</h4>
      <ul>
        <li>Stripe loaded: {{ stripeLoaded }}</li>
        <li>Elements ready: {{ elementsReady }}</li>
        <li>Client secret set: {{ !!clientSecret }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.payment-form {
  max-width: 500px;
  margin: 40px auto;
  padding: 20px;
}

h2 {
  margin-bottom: 8px;
}

.description {
  color: #666;
  margin-bottom: 24px;
}

.secret-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.secret-form label {
  font-weight: 500;
}

.secret-form input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
}

.hint {
  font-size: 13px;
  color: #666;
}

.hint a {
  color: #635bff;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

button {
  background: #635bff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  font-size: 14px;
  padding: 12px;
  background: #f8d7da;
  border-radius: 4px;
}

.debug {
  margin-top: 32px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
}

.debug h4 {
  margin: 0 0 8px 0;
}

.debug ul {
  margin: 0;
  padding-left: 20px;
}
</style>
