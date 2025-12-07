<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  useStripe,
  useStripeElements,
} from '@vue-stripe/vue-stripe'
import ProductSelector from './ProductSelector.vue'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi, type Product, type SubscriptionResult } from '../../composables/useBackendApi'

// Get publishable key from env
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

const { createSubscription, formatPrice, loading, error } = useBackendApi()

// State
const selectedProduct = ref<Product | null>(null)
const customerEmail = ref('')
const subscriptionResult = ref<SubscriptionResult | null>(null)
const clientSecret = ref('')
const elementsReady = ref(false)
const paymentReady = ref(false)
const confirming = ref(false)
const confirmError = ref<string | null>(null)
const step = ref<'select' | 'email' | 'payment' | 'complete'>('select')

// Computed
const isValidEmail = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value)
})

const canProceedToPayment = computed(() => {
  return selectedProduct.value && isValidEmail.value
})

const canConfirm = computed(() => {
  return clientSecret.value && elementsReady.value && paymentReady.value && !confirming.value
})

// Handlers
function onProductSelected(product: Product) {
  selectedProduct.value = product
  step.value = 'email'
}

async function proceedToPayment() {
  if (!selectedProduct.value || !isValidEmail.value) return

  try {
    confirmError.value = null

    // Create subscription (this returns a client secret for confirming the payment)
    const result = await createSubscription({
      priceId: selectedProduct.value.price.id,
      customerEmail: customerEmail.value,
    })

    subscriptionResult.value = result

    if (result.clientSecret) {
      clientSecret.value = result.clientSecret
      step.value = 'payment'
    } else {
      // Subscription was created without requiring payment (e.g., trial)
      step.value = 'complete'
    }
  } catch (err) {
    confirmError.value = err instanceof Error ? err.message : 'Failed to create subscription'
  }
}

function onElementsReady() {
  elementsReady.value = true
}

function onPaymentReady() {
  paymentReady.value = true
}

function reset() {
  selectedProduct.value = null
  customerEmail.value = ''
  subscriptionResult.value = null
  clientSecret.value = ''
  step.value = 'select'
  confirmError.value = null
}
</script>

<template>
  <div class="subscription-embedded-example">
    <!-- Check for publishable key -->
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>
        Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.
      </p>
    </div>

    <template v-else>
      <!-- Payment Status (shows after redirect) -->
      <PaymentStatus />

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="progress-step" :class="{ active: step === 'select', completed: step !== 'select' }">
          <span class="step-dot">1</span>
          <span class="step-label">Select Plan</span>
        </div>
        <div class="progress-line" :class="{ completed: step !== 'select' }"></div>
        <div class="progress-step" :class="{ active: step === 'email', completed: step === 'payment' || step === 'complete' }">
          <span class="step-dot">2</span>
          <span class="step-label">Email</span>
        </div>
        <div class="progress-line" :class="{ completed: step === 'payment' || step === 'complete' }"></div>
        <div class="progress-step" :class="{ active: step === 'payment', completed: step === 'complete' }">
          <span class="step-dot">3</span>
          <span class="step-label">Payment</span>
        </div>
      </div>

      <!-- Step 1: Select Subscription Product -->
      <div v-if="step === 'select'" class="step-content">
        <ProductSelector
          filter="recurring"
          @select="onProductSelected"
        />
      </div>

      <!-- Step 2: Enter Email -->
      <div v-else-if="step === 'email'" class="step-content">
        <div class="step-header">
          <span class="step-number">2</span>
          <h4>Enter Your Email</h4>
        </div>

        <div class="selected-plan">
          <span class="plan-label">Selected plan:</span>
          <strong>{{ selectedProduct?.name }}</strong>
          <span class="plan-price">
            {{ formatPrice(selectedProduct?.price.amount || 0, selectedProduct?.price.currency || 'usd') }}/{{ selectedProduct?.price.interval }}
          </span>
          <button class="change-btn" @click="step = 'select'">Change</button>
        </div>

        <div class="email-form">
          <label for="customer-email">Email Address</label>
          <input
            id="customer-email"
            v-model="customerEmail"
            type="email"
            placeholder="you@example.com"
            :class="{ valid: isValidEmail, invalid: customerEmail && !isValidEmail }"
          />

          <button
            class="continue-btn"
            :disabled="!canProceedToPayment || loading"
            @click="proceedToPayment"
          >
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Creating subscription...' : 'Continue to Payment' }}
          </button>
        </div>

        <div v-if="confirmError || error" class="error-box">
          <strong>Error:</strong> {{ confirmError || error }}
        </div>
      </div>

      <!-- Step 3: Payment -->
      <div v-else-if="step === 'payment'" class="step-content">
        <div class="step-header">
          <span class="step-number">3</span>
          <h4>Complete Payment</h4>
          <span class="badge frontend">Frontend</span>
        </div>

        <div class="subscription-summary">
          <div class="summary-row">
            <span>Plan:</span>
            <strong>{{ selectedProduct?.name }}</strong>
          </div>
          <div class="summary-row">
            <span>Email:</span>
            <span>{{ customerEmail }}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <strong>{{ formatPrice(selectedProduct?.price.amount || 0, selectedProduct?.price.currency || 'usd') }}/{{ selectedProduct?.price.interval }}</strong>
          </div>
        </div>

        <div class="stripe-container">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements
              :client-secret="clientSecret"
              @ready="onElementsReady"
            >
              <VueStripePaymentElement @ready="onPaymentReady" />

              <ConfirmSubscriptionButton
                :can-confirm="canConfirm"
                :confirming="confirming"
                @confirm-start="confirming = true"
                @confirm-end="confirming = false"
                @success="step = 'complete'"
                @error="(e) => confirmError = e"
              />
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <div v-if="confirmError" class="error-box">
          <strong>Payment Error:</strong> {{ confirmError }}
        </div>
      </div>

      <!-- Step 4: Complete -->
      <div v-else-if="step === 'complete'" class="step-content">
        <div class="success-state">
          <span class="success-icon">✓</span>
          <h4>Subscription Active!</h4>
          <p>Thank you for subscribing to {{ selectedProduct?.name }}.</p>
          <p class="subscription-id" v-if="subscriptionResult">
            Subscription ID: <code>{{ subscriptionResult.subscriptionId }}</code>
          </p>
          <button class="reset-btn" @click="reset">Start Over</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
// Separate component for confirm button (needs stripe context)
import { defineComponent, h } from 'vue'

const ConfirmSubscriptionButton = defineComponent({
  name: 'ConfirmSubscriptionButton',
  props: {
    canConfirm: Boolean,
    confirming: Boolean,
  },
  emits: ['confirm-start', 'confirm-end', 'success', 'error'],
  setup(props, { emit }) {
    // Call composables during setup (required by Vue)
    const { stripe } = useStripe()
    const { elements } = useStripeElements()

    async function confirmPayment() {
      emit('confirm-start')
      emit('error', null)

      try {
        if (!stripe.value || !elements.value) {
          throw new Error('Stripe not initialized')
        }

        // First submit the elements form
        const { error: submitError } = await elements.value.submit()
        if (submitError) {
          throw new Error(submitError.message)
        }

        // Then confirm the payment
        const { error } = await stripe.value.confirmPayment({
          elements: elements.value,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required',
        })

        if (error) {
          throw new Error(error.message)
        }

        // Payment succeeded
        emit('success')
      } catch (err) {
        emit('error', err instanceof Error ? err.message : 'Payment failed')
      } finally {
        emit('confirm-end')
      }
    }

    return () =>
      h(
        'button',
        {
          class: ['confirm-btn', { disabled: !props.canConfirm || props.confirming }],
          disabled: !props.canConfirm || props.confirming,
          onClick: confirmPayment,
        },
        props.confirming ? 'Processing...' : 'Start Subscription'
      )
  },
})

export default {
  components: {
    ConfirmSubscriptionButton,
  },
}
</script>

<style scoped>
.subscription-embedded-example {
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

.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.step-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.badge {
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
}

.badge.frontend {
  background: var(--vp-c-indigo-soft);
  color: var(--vp-c-indigo-1);
}

.selected-plan {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.plan-label {
  color: var(--vp-c-text-2);
}

.plan-price {
  margin-left: auto;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.change-btn {
  padding: 0.25rem 0.5rem;
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

.email-form {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.email-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.email-form input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}

.email-form input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.email-form input.valid {
  border-color: var(--vp-c-green-1);
}

.email-form input.invalid {
  border-color: var(--vp-c-danger-1);
}

.continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.continue-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.continue-btn:disabled {
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

.subscription-summary {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.summary-row:not(:last-child) {
  border-bottom: 1px solid var(--vp-c-divider);
}

.summary-row.total {
  padding-top: 0.75rem;
}

.summary-row.total strong {
  color: var(--vp-c-brand-1);
}

.stripe-container {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.confirm-btn {
  display: block;
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--vp-c-brand-1);
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

.subscription-id {
  margin-top: 1rem;
}

.subscription-id code {
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
