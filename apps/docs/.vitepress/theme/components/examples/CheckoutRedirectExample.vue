<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeProvider, VueStripeCheckout } from '@vue-stripe/vue-stripe'
import ProductSelector from './ProductSelector.vue'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi, type Product, type CheckoutSessionResult } from '../../composables/useBackendApi'

// Get publishable key from env
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

const { createCheckoutSession, formatPrice, loading, error } = useBackendApi()

// Step management
const step = ref<'select' | 'checkout' | 'complete'>('select')

// State
const selectedProduct = ref<Product | null>(null)
const sessionResult = ref<CheckoutSessionResult | null>(null)
const redirecting = ref(false)
const sessionError = ref<string | null>(null)
const useComponent = ref(true) // Toggle between direct redirect and VueStripeCheckout component

// Reset function
function reset() {
  step.value = 'select'
  selectedProduct.value = null
  sessionResult.value = null
  redirecting.value = false
  sessionError.value = null
}

// Handlers
function onProductSelected(product: Product) {
  selectedProduct.value = product
  sessionResult.value = null
  sessionError.value = null
  step.value = 'checkout'
}

async function createSession() {
  if (!selectedProduct.value) return

  try {
    sessionError.value = null

    // Create checkout session
    const result = await createCheckoutSession({
      priceId: selectedProduct.value.price.id,
      mode: 'payment',
      successUrl: `${window.location.href}?result=success`,
      cancelUrl: `${window.location.href}?result=cancel`,
    })

    sessionResult.value = result
    return result
  } catch (err) {
    sessionError.value = err instanceof Error ? err.message : 'Failed to create checkout session'
    throw err
  }
}

// Direct redirect approach (works without Vue Stripe components)
async function startCheckoutDirect() {
  redirecting.value = true
  try {
    const result = await createSession()
    if (result?.url) {
      window.location.href = result.url
    }
  } catch {
    redirecting.value = false
  }
}

// For VueStripeCheckout component - create session and let component handle redirect
async function prepareCheckout() {
  redirecting.value = true
  try {
    await createSession()
  } catch {
    redirecting.value = false
  }
}

function onCheckoutError(err: Error) {
  sessionError.value = err.message
  redirecting.value = false
}

function onBeforeRedirect() {
  redirecting.value = true
}
</script>

<template>
  <div class="checkout-redirect-example">
    <!-- Check for publishable key -->
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>
        Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.
      </p>
    </div>

    <template v-else>
      <!-- Payment Status (shows after redirect from Checkout) -->
      <PaymentStatus />

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="progress-step" :class="{ active: step === 'select', completed: step !== 'select' }">
          <span class="step-dot">1</span>
          <span class="step-label">Product</span>
        </div>
        <div class="progress-line" :class="{ completed: step !== 'select' }"></div>
        <div class="progress-step" :class="{ active: step === 'checkout', completed: step === 'complete' }">
          <span class="step-dot">2</span>
          <span class="step-label">Checkout</span>
        </div>
        <div class="progress-line" :class="{ completed: step === 'complete' }"></div>
        <div class="progress-step" :class="{ active: step === 'complete' }">
          <span class="step-dot">✓</span>
          <span class="step-label">Complete</span>
        </div>
      </div>

      <!-- Step 1: Select Product -->
      <div v-if="step === 'select'" class="step-content">
        <ProductSelector
          filter="one_time"
          @select="onProductSelected"
        />
      </div>

      <!-- Step 2: Checkout -->
      <div v-else-if="step === 'checkout'" class="step-content">
        <div class="step-section">
          <div class="step-header">
            <h4>Checkout with Stripe</h4>
            <button class="change-btn" @click="step = 'select'">Change Product</button>
          </div>

          <!-- Toggle between approaches -->
          <div class="approach-toggle">
            <button
              :class="['toggle-btn', { active: useComponent }]"
              @click="useComponent = true"
            >
              VueStripeCheckout Component
            </button>
            <button
              :class="['toggle-btn', { active: !useComponent }]"
              @click="useComponent = false"
            >
              Direct URL Redirect
            </button>
          </div>

          <div class="checkout-content">
            <div class="product-summary">
              <div class="product-info">
                <h5>{{ selectedProduct?.name }}</h5>
                <p v-if="selectedProduct?.description">{{ selectedProduct.description }}</p>
              </div>
              <div class="product-price">
                {{ formatPrice(selectedProduct?.price.amount || 0, selectedProduct?.price.currency || 'usd') }}
              </div>
            </div>

            <!-- VueStripeCheckout Component Approach -->
            <template v-if="useComponent">
              <VueStripeProvider :publishable-key="publishableKey">
                <!-- First create session, then use VueStripeCheckout -->
                <div v-if="!sessionResult">
                  <button
                    class="checkout-btn secondary"
                    :disabled="loading"
                    @click="prepareCheckout"
                  >
                    <span v-if="loading" class="spinner"></span>
                    {{ loading ? 'Creating Session...' : 'Create Checkout Session' }}
                  </button>
                </div>

                <div v-else class="session-ready">
                  <div class="session-info">
                    <span class="check">✓</span>
                    <span>Session created: <code>{{ sessionResult.sessionId.slice(0, 20) }}...</code></span>
                  </div>

                  <VueStripeCheckout
                    :session-url="sessionResult.url"
                    button-text="Pay with Stripe Checkout"
                    loading-text="Redirecting..."
                    button-class="checkout-btn"
                    @checkout="onBeforeRedirect"
                    @error="onCheckoutError"
                  />
                </div>
              </VueStripeProvider>
            </template>

            <!-- Direct Redirect Approach -->
            <template v-else>
              <button
                class="checkout-btn"
                :disabled="loading || redirecting"
                @click="startCheckoutDirect"
              >
                <span v-if="loading || redirecting" class="spinner"></span>
                {{ redirecting ? 'Redirecting to Stripe...' : 'Pay with Stripe Checkout' }}
              </button>
            </template>
          </div>

          <div v-if="sessionError || error" class="error-box">
            <strong>Error:</strong> {{ sessionError || error }}
          </div>
        </div>
      </div>

      <!-- Step 3: Complete -->
      <div v-else-if="step === 'complete'" class="step-content">
        <div class="success-state">
          <div class="success-icon">✓</div>
          <h4>Checkout Session Created!</h4>
          <p v-if="sessionResult">Session ID: {{ sessionResult.sessionId }}</p>
          <button class="reset-btn" @click="reset">Start Over</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.checkout-redirect-example {
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

.warning-box code {
  padding: 0.125rem 0.375rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
  padding: 1rem;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.3s;
}

.progress-step.active .step-dot {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

.progress-step.completed .step-dot {
  background: var(--vp-c-green-1);
  border-color: var(--vp-c-green-1);
  color: white;
}

.step-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.progress-step.active .step-label {
  color: var(--vp-c-brand-1);
}

.progress-step.completed .step-label {
  color: var(--vp-c-green-1);
}

.progress-line {
  width: 3rem;
  height: 2px;
  background: var(--vp-c-divider);
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
  transition: background 0.3s;
}

.progress-line.completed {
  background: var(--vp-c-green-1);
}

/* Step Content */
.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-section {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.step-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.change-btn {
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.change-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.approach-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  border-color: var(--vp-c-brand-1);
}

.toggle-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.checkout-content {
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
}

.product-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.product-info h5 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.product-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.session-ready {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-green-soft);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--vp-c-green-darker);
}

.session-info .check {
  font-weight: bold;
}

.session-info code {
  padding: 0.125rem 0.375rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  font-size: 0.75rem;
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.checkout-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkout-btn.secondary {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
}

.checkout-btn.secondary:hover:not(:disabled) {
  background: var(--vp-c-brand-1);
  color: white;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-box {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-danger-soft);
  border: 1px solid var(--vp-c-danger-1);
  border-radius: 6px;
  color: var(--vp-c-danger-1);
  font-size: 0.875rem;
}

/* Success State */
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
  background: var(--vp-c-green-soft);
  border-radius: 50%;
  font-size: 2rem;
  color: var(--vp-c-green-1);
  margin-bottom: 1rem;
}

.success-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.success-state p {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.reset-btn {
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reset-btn:hover {
  opacity: 0.9;
}
</style>
