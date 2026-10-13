<script setup lang="ts">
/**
 * Documentation Verification View
 *
 * This component tests code examples directly from the documentation
 * to ensure they work correctly when users copy them.
 */
import { ref, computed, inject } from 'vue'
import { BookOpen, CircleCheck, Hourglass, Search } from 'lucide-vue-next'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  VueStripeCardElement,
  VueStripeAddressElement,
  VueStripeExpressCheckoutElement,
  type ConfirmPaymentResult,
  type StripeAddressElementChangeEvent,
  type StripeCardElement
} from '@vue-stripe/vue-stripe'
import PaymentActions from '@/components/docs/PaymentActions.vue'

// Publishable key comes from the shared playground config (set via the header
// "Add Key" dialog / localStorage) — never hardcode a key in source.
const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
const publishableKey = computed(() => stripeConfig?.publishableKey ?? '')

// Available test examples
const examples = [
  { id: 'first-payment', name: 'First Payment (Complete Example)' },
  { id: 'payment-element', name: 'Payment Element' },
  { id: 'card-element', name: 'Card Element' },
  { id: 'address-element', name: 'Address Element' },
  { id: 'express-checkout', name: 'Express Checkout' }
] as const

const selectedExample = ref<string>('first-payment')
const clientSecretInput = ref('')
const clientSecret = ref('')

// State for examples. The components' events only drive the status badges; confirming and
// element lookups go through PaymentActions (usePaymentIntent / useStripeElements).
const errorMessage = ref('')
const stripeLoaded = ref(false)
const elementsReady = ref(false)
const addressComplete = ref(false)

const setClientSecret = () => {
  clientSecret.value = clientSecretInput.value.trim()
}

const resetExample = () => {
  clientSecret.value = ''
  clientSecretInput.value = ''
  stripeLoaded.value = false
  elementsReady.value = false
  errorMessage.value = ''
  addressComplete.value = false
}

const onStripeLoad = () => {
  stripeLoaded.value = true
}

const onElementsReady = () => {
  elementsReady.value = true
}

// PaymentActions' slot `confirm`: usePaymentIntent().confirmPayment for a return URL.
type Confirm = (
  returnUrl: string,
  redirect?: 'if_required' | 'always'
) => Promise<ConfirmPaymentResult>

const returnUrl = () => `${window.location.origin}/docs-verification`

// First Payment / Payment Element submit handler (errors show through the slot's `error`)
const handleSubmit = async (confirm: Confirm) => {
  await confirm(returnUrl())
}

// Card Element submit handler: look the element up with useStripeElements().getElement().
// For card element, we'd normally call useConfirmCardPayment() with a clientSecret;
// for this test, we just verify the element loaded.
const handleCardSubmit = (getElement: (type: 'card') => StripeCardElement | null) => {
  errorMessage.value = getElement('card') ? '' : 'Card element not found'
}

// Address Element change handler
const onAddressChange = (event: StripeAddressElementChangeEvent) => {
  addressComplete.value = event.complete
}

// Express Checkout confirm handler: the confirm event does not carry an `elements` instance;
// usePaymentIntent() confirms with the injected one.
const handleExpressConfirm = async (confirm: Confirm) => {
  const { error } = await confirm(returnUrl(), 'always')
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
    <h2><BookOpen class="icon" /> Documentation Code Verification</h2>
    <p class="subtitle">Testing exact code examples from the documentation</p>

    <!-- No key configured -->
    <div v-if="!publishableKey" class="secret-input">
      No Stripe publishable key configured. Click <strong>"Add Key"</strong> in the header to add a
      test key.
    </div>

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
    <div
      v-if="
        !clientSecret && selectedExample !== 'address-element' && selectedExample !== 'card-element'
      "
      class="secret-input"
    >
      <label>Client Secret:</label>
      <input v-model="clientSecretInput" type="text" placeholder="pi_xxx_secret_xxx" />
      <button :disabled="!clientSecretInput.trim()" @click="setClientSecret">Load Example</button>
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
        <h3><CircleCheck class="icon" /> First Payment Example</h3>
        <p class="source">Source: guide/first-payment.md - Complete Example</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements :client-secret="clientSecret" @ready="onElementsReady">
            <PaymentActions v-slot="{ confirm, loading, error }" :client-secret="clientSecret">
              <form @submit.prevent="handleSubmit(confirm)">
                <VueStripePaymentElement />

                <div v-if="error" class="error">
                  {{ error }}
                </div>

                <button type="submit" :disabled="loading">
                  {{ loading ? 'Processing...' : 'Pay $10.00' }}
                </button>
              </form>
            </PaymentActions>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeLoaded ? 'success' : 'pending'">
            <CircleCheck v-if="stripeLoaded" class="icon" />
            <Hourglass v-else class="icon" />
            Stripe: {{ stripeLoaded ? 'Loaded' : 'Loading...' }}
          </span>
          <span :class="elementsReady ? 'success' : 'pending'">
            <CircleCheck v-if="elementsReady" class="icon" />
            <Hourglass v-else class="icon" />
            Elements: {{ elementsReady ? 'Ready' : 'Loading...' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           PAYMENT ELEMENT EXAMPLE
           From: guide/payment-element.md - Basic Setup
           ============================================================ -->
      <div v-if="selectedExample === 'payment-element' && clientSecret" class="example-box">
        <h3><CircleCheck class="icon" /> Payment Element Example</h3>
        <p class="source">Source: guide/payment-element.md - Basic Setup</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements :client-secret="clientSecret" @ready="onElementsReady">
            <PaymentActions v-slot="{ confirm, loading }" :client-secret="clientSecret">
              <form @submit.prevent="handleSubmit(confirm)">
                <VueStripePaymentElement />
                <button type="submit" :disabled="loading">
                  {{ loading ? 'Processing...' : 'Pay' }}
                </button>
              </form>
            </PaymentActions>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeLoaded ? 'success' : 'pending'">
            <CircleCheck v-if="stripeLoaded" class="icon" />
            <Hourglass v-else class="icon" />
            Stripe: {{ stripeLoaded ? 'Loaded' : 'Loading...' }}
          </span>
          <span :class="elementsReady ? 'success' : 'pending'">
            <CircleCheck v-if="elementsReady" class="icon" />
            <Hourglass v-else class="icon" />
            Elements: {{ elementsReady ? 'Ready' : 'Loading...' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           CARD ELEMENT EXAMPLE
           From: guide/card-element.md - Single Card Element
           ============================================================ -->
      <div v-if="selectedExample === 'card-element'" class="example-box">
        <h3><CircleCheck class="icon" /> Card Element Example</h3>
        <p class="source">Source: guide/card-element.md - Single Card Element</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements @ready="onElementsReady">
            <PaymentActions v-slot="{ getElement, loading }">
              <form @submit.prevent="handleCardSubmit(getElement)">
                <VueStripeCardElement />
                <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
                <button type="submit" :disabled="loading">
                  {{ loading ? 'Processing...' : 'Pay' }}
                </button>
              </form>
            </PaymentActions>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeLoaded ? 'success' : 'pending'">
            <CircleCheck v-if="stripeLoaded" class="icon" />
            <Hourglass v-else class="icon" />
            Stripe: {{ stripeLoaded ? 'Loaded' : 'Loading...' }}
          </span>
          <span :class="elementsReady ? 'success' : 'pending'">
            <CircleCheck v-if="elementsReady" class="icon" />
            <Hourglass v-else class="icon" />
            Elements: {{ elementsReady ? 'Ready' : 'Loading...' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           ADDRESS ELEMENT EXAMPLE
           From: guide/address-element.md - Basic Usage
           ============================================================ -->
      <div v-if="selectedExample === 'address-element'" class="example-box">
        <h3><CircleCheck class="icon" /> Address Element Example</h3>
        <p class="source">Source: guide/address-element.md - Basic Usage</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements mode="payment" currency="usd" :amount="1000" @ready="onElementsReady">
            <VueStripeAddressElement :options="addressOptions" @change="onAddressChange" />
            <button type="button">Continue</button>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeLoaded ? 'success' : 'pending'">
            <CircleCheck v-if="stripeLoaded" class="icon" />
            <Hourglass v-else class="icon" />
            Stripe: {{ stripeLoaded ? 'Loaded' : 'Loading...' }}
          </span>
          <span :class="elementsReady ? 'success' : 'pending'">
            <CircleCheck v-if="elementsReady" class="icon" />
            <Hourglass v-else class="icon" />
            Elements: {{ elementsReady ? 'Ready' : 'Loading...' }}
          </span>
          <span :class="addressComplete ? 'success' : 'pending'">
            <CircleCheck v-if="addressComplete" class="icon" />
            <Hourglass v-else class="icon" />
            Address: {{ addressComplete ? 'Complete' : 'Incomplete' }}
          </span>
        </div>
      </div>

      <!-- ============================================================
           EXPRESS CHECKOUT EXAMPLE
           From: guide/express-checkout.md - Basic Setup
           ============================================================ -->
      <div v-if="selectedExample === 'express-checkout' && clientSecret" class="example-box">
        <h3><CircleCheck class="icon" /> Express Checkout Example</h3>
        <p class="source">Source: guide/express-checkout.md - Basic Setup</p>

        <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
          <VueStripeElements :client-secret="clientSecret" @ready="onElementsReady">
            <PaymentActions v-slot="{ confirm }" :client-secret="clientSecret">
              <VueStripeExpressCheckoutElement @confirm="handleExpressConfirm(confirm)" />
            </PaymentActions>
          </VueStripeElements>
        </VueStripeProvider>

        <div class="status">
          <span :class="stripeLoaded ? 'success' : 'pending'">
            <CircleCheck v-if="stripeLoaded" class="icon" />
            <Hourglass v-else class="icon" />
            Stripe: {{ stripeLoaded ? 'Loaded' : 'Loading...' }}
          </span>
          <span :class="elementsReady ? 'success' : 'pending'">
            <CircleCheck v-if="elementsReady" class="icon" />
            <Hourglass v-else class="icon" />
            Elements: {{ elementsReady ? 'Ready' : 'Loading...' }}
          </span>
        </div>

        <p class="note">
          Note: Express Checkout buttons only appear on HTTPS with saved payment methods.
        </p>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug-panel">
      <h4><Search class="icon" /> Debug Info</h4>
      <ul>
        <li>Selected: {{ selectedExample }}</li>
        <li>Client Secret Set: {{ !!clientSecret }}</li>
        <li>Stripe Loaded: {{ stripeLoaded }}</li>
        <li>Elements Ready: {{ elementsReady }}</li>
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

.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 4px;
  vertical-align: -0.125em;
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
