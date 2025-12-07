<script setup lang="ts">
import { ref } from 'vue'
import ProductSelector from './ProductSelector.vue'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi, type Product, type CheckoutSessionResult } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()

const { createCheckoutSession, formatPrice, loading, error } = useBackendApi()

// Step management
const step = ref<'select' | 'checkout' | 'complete'>('select')

// State
const selectedProduct = ref<Product | null>(null)
const sessionResult = ref<CheckoutSessionResult | null>(null)
const redirecting = ref(false)
const sessionError = ref<string | null>(null)

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

async function startCheckout() {
  if (!selectedProduct.value) return

  try {
    sessionError.value = null
    redirecting.value = true

    // Create checkout session
    const result = await createCheckoutSession({
      priceId: selectedProduct.value.price.id,
      mode: 'subscription',
      successUrl: `${window.location.href}?result=success`,
      cancelUrl: `${window.location.href}?result=cancel`,
    })

    sessionResult.value = result

    // Redirect to Stripe Checkout
    if (result.url) {
      window.location.href = result.url
    }
  } catch (err) {
    sessionError.value = err instanceof Error ? err.message : 'Failed to create checkout session'
    redirecting.value = false
  }
}
</script>

<template>
  <div class="subscription-checkout-example">
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
          <span class="step-label">Plan</span>
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

      <!-- Step 1: Select Subscription Product -->
      <div v-if="step === 'select'" class="step-content">
        <ProductSelector
          filter="recurring"
          @select="onProductSelected"
        />
      </div>

      <!-- Step 2: Start Checkout -->
      <div v-else-if="step === 'checkout'" class="step-content">
        <div class="step-section">
          <div class="step-header">
            <h4>Start Stripe Checkout</h4>
            <button class="change-btn" @click="step = 'select'">Change Plan</button>
          </div>

          <div class="checkout-content">
            <div class="product-summary">
              <div class="product-info">
                <h5>{{ selectedProduct?.name }}</h5>
                <p v-if="selectedProduct?.description">{{ selectedProduct.description }}</p>
              </div>
              <div class="product-price">
                {{ formatPrice(selectedProduct?.price.amount || 0, selectedProduct?.price.currency || 'usd') }}
                <span class="interval">/{{ selectedProduct?.price.interval }}</span>
              </div>
            </div>

            <button
              class="checkout-btn"
              :disabled="loading || redirecting"
              @click="startCheckout"
            >
              <span v-if="loading || redirecting" class="spinner"></span>
              {{ redirecting ? 'Redirecting to Stripe...' : 'Subscribe with Stripe Checkout' }}
            </button>

            <p class="checkout-note">
              You'll be redirected to Stripe's secure checkout page.
            </p>
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
          <h4>Subscription Created!</h4>
          <p v-if="sessionResult">Session ID: {{ sessionResult.sessionId }}</p>
          <button class="reset-btn" @click="reset">Start Over</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.subscription-checkout-example {
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

.product-price .interval {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
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

.checkout-note {
  margin: 0.75rem 0 0 0;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
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
