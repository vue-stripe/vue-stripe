<script setup lang="ts">
/**
 * Documentation Verification View
 *
 * This component tests code examples directly from the documentation
 * to ensure they work correctly when users copy them.
 */
import { ref } from 'vue'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  VueStripeCardElement,
  VueStripeAddressElement,
  VueStripeExpressCheckoutElement
} from '@vue-stripe/vue-stripe'

const publishableKey = 'pk_test_51OIHqMIx2Vb66eaKneiRI89KWckP2FB7c75OLUZGezoXDiCHlIXMh6dBkTyWRe8oz77CO6B0udvWS6yWWdDaiwS800oW2Na8mk'

// Available test examples
const examples = [
  { id: 'first-payment', name: 'First Payment (Complete Example)' },
  { id: 'payment-element', name: 'Payment Element' },
  { id: 'card-element', name: 'Card Element' },
  { id: 'address-element', name: 'Address Element' },
  { id: 'express-checkout', name: 'Express Checkout' },
] as const

const selectedExample = ref<string>('first-payment')
const clientSecretInput = ref('')
const clientSecret = ref('')

// State for examples
const loading = ref(false)
const errorMessage = ref('')
const stripeInstance = ref<Stripe | null>(null)
const elementsInstance = ref<StripeElements | null>(null)
const addressComplete = ref(false)

const setClientSecret = () => {
  clientSecret.value = clientSecretInput.value.trim()
}

const resetExample = () => {
  clientSecret.value = ''
  clientSecretInput.value = ''
  stripeInstance.value = null
  elementsInstance.value = null
  loading.value = false
  errorMessage.value = ''
  addressComplete.value = false
}

// Event handlers - exact pattern from documentation
const onStripeLoad = (stripe: Stripe) => {
  stripeInstance.value = stripe
  console.info(`[${selectedExample.value}] Stripe loaded:`, !!stripe)
}

const onElementsReady = (elements: StripeElements) => {
  elementsInstance.value = elements
  console.info(`[${selectedExample.value}] Elements ready:`, !!elements)
}

// First Payment / Payment Element submit handler
const handleSubmit = async () => {
  if (!stripeInstance.value || !elementsInstance.value) return

  loading.value = true
  errorMessage.value = ''

  const { error } = await stripeInstance.value.confirmPayment({
    elements: elementsInstance.value,
    confirmParams: {
      return_url: `${window.location.origin}/docs-verification`
    },
    redirect: 'if_required'
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
    loading.value = false
  }
}

// Card Element submit handler
const handleCardSubmit = async () => {
  if (!stripeInstance.value || !elementsInstance.value) return

  loading.value = true
  errorMessage.value = ''

  const cardElement = elementsInstance.value.getElement('card')

  if (!cardElement) {
    errorMessage.value = 'Card element not found'
    loading.value = false
    return
  }

  // For card element, we'd normally call confirmCardPayment with a clientSecret
  // For this test, we just verify the element loaded
  console.info('[CardElement] Card element retrieved successfully')
  loading.value = false
}

// Address Element change handler
const onAddressChange = (event: any) => {
  addressComplete.value = event.complete
  if (event.complete) {
    console.info('[AddressElement] Address complete:', event.value)
  }
}

// Express Checkout confirm handler
const handleExpressConfirm = async (event: any) => {
  if (!stripeInstance.value) return

  const { error } = await stripeInstance.value.confirmPayment({
    elements: event.elements,
    confirmParams: {
      return_url: `${window.location.origin}/docs-verification`
    }
  })

  if (error) {
    console.error(error.message)
  }
}

// Address element options - from guide/address-element.md
const addressOptions = {
  mode: 'shipping' as const,
  autocomplete: { mode: 'automatic' as const }
}
</script>

<template>
  <div class="docs-verification">
    <h2>📚 Documentation Code Verification</h2>
    <p class="subtitle">Testing exact code examples from the documentation</p>

    <!-- Example Selector -->
    <div class="example-selector">
      <label>Select Example:</label>
      <select v-model="selectedExample" @change="resetExample">
        <option v-for="ex in examples" :key="ex.id" :value="ex.id">
          {{ ex.name }}
        </option>
      </select>
    </div>

    <!-- Client Secret Input (for examples that need it) -->
    <div v-if="!clientSecret && selectedExample !== 'address-element' && selectedExample !== 'card-element'" class="secret-input">
      <label>Client Secret:</label>
      <input
        v-model="clientSecretInput"
        type="text"
        placeholder="pi_xxx_secret_xxx"
      />
      <button @click="setClientSecret" :disabled="!clientSecretInput.trim()">
        Load Example
      </button>
      <p class="hint">
        Get a client secret from
        <a href="https://dashboard.stripe.com/test/payments" target="_blank">Stripe Dashboard</a>
      </p>
    </div>

    <!-- Example Components -->
    <div class="example-container">

      <!-- ============================================================
           FIRST PAYMENT EXAMPLE
           From: guide/first-payment.md - Complete Example section
           ============================================================ -->
      <div v-if="selectedExample === 'first-payment' && clientSecret" class="example-box">
        <h3>✅ First Payment Example</h3>
        <p class="source">Source: guide/first-payment.md - Complete Example</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements
            :client-secret="clientSecret"
            @ready="onElementsReady"
          >
            <form @submit.prevent="handleSubmit">
              <VueStripePaymentElement />

              <div v-if="errorMessage" class="error">
                {{ errorMessage }}
              </div>

              <button type="submit" :disabled="loading">
                {{ loading ? 'Processing...' : 'Pay $10.00' }}
              </button>
            </form>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeInstance ? 'success' : 'pending'">
            Stripe: {{ stripeInstance ? '✅ Loaded' : '⏳ Loading...' }}
          </span>
          <span :class="elementsInstance ? 'success' : 'pending'">
            Elements: {{ elementsInstance ? '✅ Ready' : '⏳ Loading...' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           PAYMENT ELEMENT EXAMPLE
           From: guide/payment-element.md - Basic Setup
           ============================================================ -->
      <div v-if="selectedExample === 'payment-element' && clientSecret" class="example-box">
        <h3>✅ Payment Element Example</h3>
        <p class="source">Source: guide/payment-element.md - Basic Setup</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements :client-secret="clientSecret" @ready="onElementsReady">
            <form @submit.prevent="handleSubmit">
              <VueStripePaymentElement />
              <button type="submit" :disabled="loading">
                {{ loading ? 'Processing...' : 'Pay' }}
              </button>
            </form>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeInstance ? 'success' : 'pending'">
            Stripe: {{ stripeInstance ? '✅ Loaded' : '⏳ Loading...' }}
          </span>
          <span :class="elementsInstance ? 'success' : 'pending'">
            Elements: {{ elementsInstance ? '✅ Ready' : '⏳ Loading...' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           CARD ELEMENT EXAMPLE
           From: guide/card-element.md - Single Card Element
           ============================================================ -->
      <div v-if="selectedExample === 'card-element'" class="example-box">
        <h3>✅ Card Element Example</h3>
        <p class="source">Source: guide/card-element.md - Single Card Element</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements @ready="onElementsReady">
            <form @submit.prevent="handleCardSubmit">
              <VueStripeCardElement />
              <button type="submit" :disabled="loading">
                {{ loading ? 'Processing...' : 'Pay' }}
              </button>
            </form>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeInstance ? 'success' : 'pending'">
            Stripe: {{ stripeInstance ? '✅ Loaded' : '⏳ Loading...' }}
          </span>
          <span :class="elementsInstance ? 'success' : 'pending'">
            Elements: {{ elementsInstance ? '✅ Ready' : '⏳ Loading...' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           ADDRESS ELEMENT EXAMPLE
           From: guide/address-element.md - Basic Usage
           ============================================================ -->
      <div v-if="selectedExample === 'address-element'" class="example-box">
        <h3>✅ Address Element Example</h3>
        <p class="source">Source: guide/address-element.md - Basic Usage</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements @ready="onElementsReady">
            <VueStripeAddressElement
              :options="addressOptions"
              @change="onAddressChange"
            />
            <button type="button">Continue</button>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeInstance ? 'success' : 'pending'">
            Stripe: {{ stripeInstance ? '✅ Loaded' : '⏳ Loading...' }}
          </span>
          <span :class="elementsInstance ? 'success' : 'pending'">
            Elements: {{ elementsInstance ? '✅ Ready' : '⏳ Loading...' }}
          </span>
          <span :class="addressComplete ? 'success' : 'pending'">
            Address: {{ addressComplete ? '✅ Complete' : '⏳ Incomplete' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           EXPRESS CHECKOUT EXAMPLE
           From: guide/express-checkout.md - Basic Setup
           ============================================================ -->
      <div v-if="selectedExample === 'express-checkout' && clientSecret" class="example-box">
        <h3>✅ Express Checkout Example</h3>
        <p class="source">Source: guide/express-checkout.md - Basic Setup</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements :client-secret="clientSecret" @ready="onElementsReady">
            <VueStripeExpressCheckoutElement @confirm="handleExpressConfirm" />
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeInstance ? 'success' : 'pending'">
            Stripe: {{ stripeInstance ? '✅ Loaded' : '⏳ Loading...' }}
          </span>
          <span :class="elementsInstance ? 'success' : 'pending'">
            Elements: {{ elementsInstance ? '✅ Ready' : '⏳ Loading...' }}
          </span>
        </div>

        <p class="note">Note: Express Checkout buttons only appear on HTTPS with saved payment methods.</p>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug-panel">
      <h4>🔍 Debug Info</h4>
      <ul>
        <li>Selected: {{ selectedExample }}</li>
        <li>Client Secret Set: {{ !!clientSecret }}</li>
        <li>Stripe Loaded: {{ !!stripeInstance }}</li>
        <li>Elements Ready: {{ !!elementsInstance }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.docs-verification {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
}

h2 {
  margin-bottom: 4px;
}

.subtitle {
  color: #666;
  margin-bottom: 24px;
}

.example-selector {
  margin-bottom: 20px;
}

.example-selector label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.example-selector select {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.secret-input {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.secret-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.secret-input input {
  width: 100%;
  padding: 10px;
  font-family: monospace;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.secret-input button {
  background: #635bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.secret-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
}

.hint a {
  color: #635bff;
}

.example-container {
  margin-bottom: 24px;
}

.example-box {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.example-box h3 {
  margin: 0 0 4px 0;
}

.example-box .source {
  font-size: 12px;
  color: #888;
  margin-bottom: 16px;
}

.example-box form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.example-box button {
  background: #635bff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.example-box button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.example-box .error {
  color: #dc3545;
  font-size: 14px;
}

.example-box .note {
  font-size: 12px;
  color: #888;
  margin-top: 12px;
}

.status {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  font-size: 13px;
}

.status .success {
  color: #28a745;
}

.status .pending {
  color: #ffc107;
}

.debug-panel {
  padding: 16px;
  background: #f1f3f4;
  border-radius: 8px;
  font-size: 13px;
}

.debug-panel h4 {
  margin: 0 0 8px 0;
}

.debug-panel ul {
  margin: 0;
  padding-left: 20px;
}
</style>
