<script setup lang="ts">
import { ref } from 'vue'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

// Using test key provided by user
const publishableKey = 'pk_test_51OIHqMIx2Vb66eaKneiRI89KWckP2FB7c75OLUZGezoXDiCHlIXMh6dBkTyWRe8oz77CO6B0udvWS6yWWdDaiwS800oW2Na8mk'
const clientSecret = ref('')
const clientSecretInput = ref('')
const loading = ref(false)
const errorMessage = ref('')

// Capture instances from component events
const stripeInstance = ref<Stripe | null>(null)
const elementsInstance = ref<StripeElements | null>(null)

const onStripeLoad = (stripe: Stripe) => {
  stripeInstance.value = stripe
  console.info('[DocsExample] Stripe loaded:', !!stripe)
}

const onElementsReady = (elements: StripeElements) => {
  elementsInstance.value = elements
  console.info('[DocsExample] Elements ready:', !!elements)
}

const setClientSecret = () => {
  clientSecret.value = clientSecretInput.value.trim()
}

const handleSubmit = async () => {
  console.info('[DocsExample] handleSubmit called')
  console.info('[DocsExample] stripeInstance:', !!stripeInstance.value)
  console.info('[DocsExample] elementsInstance:', !!elementsInstance.value)

  if (!stripeInstance.value || !elementsInstance.value) {
    errorMessage.value = 'Stripe not ready'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const { error } = await stripeInstance.value.confirmPayment({
    elements: elementsInstance.value,
    confirmParams: {
      return_url: `${window.location.origin}/docs-example`
    },
    redirect: 'if_required'
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
    loading.value = false
  } else {
    errorMessage.value = ''
    alert('Payment succeeded!')
    loading.value = false
  }
}
</script>

<template>
  <div class="payment-form">
    <h2>Docs Example Test</h2>
    <p class="description">Testing the single-file event-based pattern from the documentation.</p>

    <!-- Client Secret Input -->
    <div v-if="!clientSecret" class="secret-form">
      <label for="secret">Client Secret (from PaymentIntent):</label>
      <input
        id="secret"
        v-model="clientSecretInput"
        type="text"
        placeholder="pi_xxx_secret_xxx"
      />
      <button @click="setClientSecret" :disabled="!clientSecretInput.trim()">
        Set Client Secret
      </button>
      <p class="hint">
        Create a PaymentIntent in <a href="https://dashboard.stripe.com/test/payments" target="_blank">Stripe Dashboard</a> and paste the client_secret here.
      </p>
    </div>

    <!-- Payment Form -->
    <VueStripeProvider v-else :publishable-key="publishableKey" @load="onStripeLoad">
      <VueStripeElements
        v-if="clientSecret"
        :client-secret="clientSecret"
        @ready="onElementsReady"
      >
        <form @submit.prevent="handleSubmit">
          <VueStripePaymentElement />

          <div v-if="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="loading">
            {{ loading ? 'Processing...' : 'Pay Now' }}
          </button>
        </form>
      </VueStripeElements>

      <template v-else>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <p v-else>Loading payment form...</p>
      </template>
    </VueStripeProvider>

    <!-- Debug Info -->
    <div class="debug">
      <h4>Debug Info:</h4>
      <ul>
        <li>Stripe loaded: {{ !!stripeInstance }}</li>
        <li>Elements ready: {{ !!elementsInstance }}</li>
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
