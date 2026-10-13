<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeProvider, VueStripeCheckoutElementsProvider } from '@vue-stripe/vue-stripe'
import ProductSelector from './ProductSelector.vue'
import PaymentStatus from './PaymentStatus.vue'
import CustomCheckoutForm from './CustomCheckoutForm.vue'
import { useBackendApi, type Product } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'
import DocIcon from '../DocIcon.vue'

const { publishableKey } = useStripeConfig()
const { createCheckoutSession, formatPrice, loading, error } = useBackendApi()

// Step management: Product -> Checkout -> Complete
const step = ref<'select' | 'checkout' | 'complete'>('select')

const selectedProduct = ref<Product | null>(null)
// The provider accepts the Promise directly, so the elements can mount while the session is created.
const clientSecret = ref<Promise<string> | null>(null)
const sessionId = ref<string | null>(null)
const providerError = ref<string | null>(null)

function onProductSelected(product: Product) {
  selectedProduct.value = product
  providerError.value = null
  // Redirect-based payment methods come back here; PaymentStatus reads `?result=success`.
  const returnUrl = `${window.location.origin}${window.location.pathname}?result=success&session_id={CHECKOUT_SESSION_ID}`
  clientSecret.value = createCheckoutSession({
    priceId: product.price.id,
    uiMode: 'elements',
    returnUrl
  }).then((result) => {
    if (!result.clientSecret) throw new Error('The backend did not return a client secret')
    return result.clientSecret
  })
  // Surface a failed request here instead of only inside the provider.
  clientSecret.value.catch((err: unknown) => {
    providerError.value = err instanceof Error ? err.message : 'Failed to create checkout session'
  })
  step.value = 'checkout'
}

function onSuccess(id: string) {
  sessionId.value = id
  step.value = 'complete'
}

function reset() {
  step.value = 'select'
  selectedProduct.value = null
  clientSecret.value = null
  sessionId.value = null
  providerError.value = null
}
</script>

<template>
  <div class="custom-checkout-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong><DocIcon name="warning" /> Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <PaymentStatus />

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div
          class="progress-step"
          :class="{ active: step === 'select', completed: step !== 'select' }"
        >
          <span class="step-dot">1</span>
          <span class="step-label">Product</span>
        </div>
        <div class="progress-line" :class="{ completed: step !== 'select' }"></div>
        <div
          class="progress-step"
          :class="{ active: step === 'checkout', completed: step === 'complete' }"
        >
          <span class="step-dot">2</span>
          <span class="step-label">Checkout</span>
        </div>
        <div class="progress-line" :class="{ completed: step === 'complete' }"></div>
        <div class="progress-step" :class="{ active: step === 'complete' }">
          <span class="step-dot">3</span>
          <span class="step-label">Complete</span>
        </div>
      </div>

      <!-- Step 1: Select Product -->
      <div v-if="step === 'select'" class="step-content">
        <ProductSelector filter="one_time" @select="onProductSelected" />
      </div>

      <!-- Step 2: Checkout -->
      <div v-else-if="step === 'checkout'" class="step-content">
        <div class="step-section">
          <div class="step-header">
            <h4>Checkout</h4>
            <button class="change-btn" @click="reset">Change Product</button>
          </div>

          <div class="product-summary">
            <span>{{ selectedProduct?.name }}</span>
            <span class="price">{{
              formatPrice(
                selectedProduct?.price.amount || 0,
                selectedProduct?.price.currency || 'usd'
              )
            }}</span>
          </div>

          <div v-if="loading" class="loading-state">
            <span class="spinner"></span> Creating checkout session...
          </div>

          <div v-if="providerError || error" class="error-box">
            <strong>Error:</strong> {{ providerError || error }}
          </div>

          <div v-else class="stripe-container">
            <VueStripeProvider :publishable-key="publishableKey">
              <VueStripeCheckoutElementsProvider
                :client-secret="clientSecret!"
                :adaptive-pricing="{ allowed: true }"
                @error="(e: string) => (providerError = e)"
              >
                <CustomCheckoutForm @success="onSuccess" />
              </VueStripeCheckoutElementsProvider>
            </VueStripeProvider>
          </div>
        </div>
      </div>

      <!-- Step 3: Complete -->
      <div v-else-if="step === 'complete'" class="step-content">
        <div class="success-state">
          <span class="success-icon"><DocIcon name="check" :size="32" :stroke-width="2.5" /></span>
          <h4>Payment Successful</h4>
          <p>Thank you for your purchase of {{ selectedProduct?.name }}.</p>
          <p v-if="sessionId" class="payment-id">
            Checkout Session: <code>{{ sessionId }}</code>
          </p>
          <button class="reset-btn" @click="reset">Start Over</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.custom-checkout-example {
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

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem 0;
}
.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
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
}
.progress-step.active .step-label {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
.progress-step.completed .step-label {
  color: var(--vp-c-green-1);
}
.progress-line {
  width: 4rem;
  height: 2px;
  background: var(--vp-c-divider);
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
  transition: background 0.2s;
}
.progress-line.completed {
  background: var(--vp-c-green-1);
}

.step-content {
  min-height: 200px;
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
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
}
.change-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.product-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
}
.product-summary .price {
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stripe-container {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
}

.ready-indicators {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}
.indicator {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}
.indicator.ready {
  color: var(--vp-c-green-1);
}

.confirm-btn {
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
.confirm-btn:hover:not(.disabled) {
  opacity: 0.9;
}
.confirm-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.payment-id {
  margin-top: 1rem;
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

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
