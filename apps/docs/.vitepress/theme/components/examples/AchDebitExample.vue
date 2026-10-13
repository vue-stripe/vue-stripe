<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import ProductSelector from './ProductSelector.vue'
import AchDebitPanel from './AchDebitPanel.vue'
import { useBackendApi, type Product } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'
import DocIcon from '../DocIcon.vue'

const { publishableKey } = useStripeConfig()
const { createAchIntent, formatPrice, loading } = useBackendApi()

// Step management: Product -> Bank account -> Complete
const step = ref<'select' | 'payment' | 'complete'>('select')

const selectedProduct = ref<Product | null>(null)
const clientSecret = ref<string | null>(null)
const amount = ref(0)
const paymentIntentId = ref<string | null>(null)
const paymentStatus = ref<string | null>(null)
const intentError = ref<string | null>(null)

// ACH Direct Debit charges in USD, so the demo charges the product's amount in USD.
const amountLabel = computed(() => formatPrice(amount.value, 'usd'))

async function onProductSelected(product: Product) {
  selectedProduct.value = product
  intentError.value = null
  try {
    const result = await createAchIntent({
      amount: product.price.amount || 1000,
      description: `Payment for ${product.name}`
    })
    clientSecret.value = result.clientSecret
    amount.value = result.amount
    step.value = 'payment'
  } catch (err) {
    intentError.value = err instanceof Error ? err.message : 'Failed to create payment intent'
  }
}

function onSuccess(id: string, status: string) {
  paymentIntentId.value = id
  paymentStatus.value = status
  step.value = 'complete'
}

function reset() {
  step.value = 'select'
  selectedProduct.value = null
  clientSecret.value = null
  amount.value = 0
  paymentIntentId.value = null
  paymentStatus.value = null
  intentError.value = null
}
</script>

<template>
  <div class="ach-debit-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong><DocIcon name="warning" /> Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
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
          :class="{ active: step === 'payment', completed: step === 'complete' }"
        >
          <span class="step-dot">2</span>
          <span class="step-label">Bank account</span>
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
        <div v-if="loading" class="loading-state">
          <span class="spinner"></span> Creating ACH Direct Debit PaymentIntent...
        </div>
        <div v-if="intentError" class="error-box"><strong>Error:</strong> {{ intentError }}</div>
      </div>

      <!-- Step 2: Link the bank account, then confirm -->
      <div v-else-if="step === 'payment'" class="step-content">
        <div class="step-section">
          <div class="step-header">
            <h4>Pay by bank account</h4>
            <button class="change-btn" @click="reset">Change Product</button>
          </div>

          <div class="product-summary">
            <span>{{ selectedProduct?.name }}</span>
            <span class="price">{{ amountLabel }}</span>
          </div>

          <VueStripeProvider :publishable-key="publishableKey">
            <AchDebitPanel
              :client-secret="clientSecret!"
              :amount-label="amountLabel"
              @success="onSuccess"
            />
          </VueStripeProvider>
        </div>
      </div>

      <!-- Step 3: Complete -->
      <div v-else-if="step === 'complete'" class="step-content">
        <div class="success-state">
          <span class="success-icon"><DocIcon name="check" :size="32" :stroke-width="2.5" /></span>
          <h4>Payment Submitted</h4>
          <p>
            ACH Direct Debit payments take a few business days. The PaymentIntent is
            <strong>{{ paymentStatus }}</strong> until the debit clears.
          </p>
          <p v-if="paymentIntentId" class="payment-id">
            Payment ID: <code>{{ paymentIntentId }}</code>
          </p>
          <button class="reset-btn" @click="reset">Start Over</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ach-debit-example {
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
.progress-line {
  width: 4rem;
  height: 2px;
  background: var(--vp-c-divider);
  margin: 0 0.5rem 1.5rem;
}
.progress-line.completed {
  background: var(--vp-c-green-1);
}

.step-content {
  min-height: 200px;
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
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6b7280;
}
.error-box {
  margin: 1rem 0;
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
  border: 2px solid #e5e7eb;
  border-top-color: #635bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
