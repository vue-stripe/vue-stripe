<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  VueStripeLinkAuthenticationElement,
  useStripe,
  useStripeElements,
} from '@vue-stripe/vue-stripe'
import ProductSelector from './ProductSelector.vue'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi, type Product } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()
const { createPaymentIntent, formatPrice, loading, error } = useBackendApi()

// Step management: Product → Payment → Complete
const step = ref<'select' | 'payment' | 'complete'>('select')

// State
const selectedProduct = ref<Product | null>(null)
const clientSecret = ref<string | null>(null)
const paymentIntentId = ref<string | null>(null)
const linkReady = ref(false)
const paymentReady = ref(false)
const email = ref<string | null>(null)
const confirming = ref(false)
const confirmError = ref<string | null>(null)

const canConfirm = computed(() => linkReady.value && paymentReady.value && !confirming.value)

// Auto-create intent on product select
async function onProductSelected(product: Product) {
  selectedProduct.value = product
  confirmError.value = null

  try {
    const result = await createPaymentIntent({
      priceId: product.price.id,
      amount: product.price.amount,
      currency: product.price.currency,
    })
    clientSecret.value = result.clientSecret
    paymentIntentId.value = result.paymentIntentId
    step.value = 'payment'
  } catch (err) {
    confirmError.value = err instanceof Error ? err.message : 'Failed to create payment intent'
  }
}

function reset() {
  step.value = 'select'
  selectedProduct.value = null
  clientSecret.value = null
  paymentIntentId.value = null
  linkReady.value = false
  paymentReady.value = false
  email.value = null
  confirmError.value = null
}
</script>

<template>
  <div class="link-auth-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <PaymentStatus />

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="progress-step" :class="{ active: step === 'select', completed: step !== 'select' }">
          <span class="step-dot">1</span>
          <span class="step-label">Product</span>
        </div>
        <div class="progress-line" :class="{ completed: step !== 'select' }"></div>
        <div class="progress-step" :class="{ active: step === 'payment', completed: step === 'complete' }">
          <span class="step-dot">2</span>
          <span class="step-label">Payment</span>
        </div>
        <div class="progress-line" :class="{ completed: step === 'complete' }"></div>
        <div class="progress-step" :class="{ active: step === 'complete' }">
          <span class="step-dot">✓</span>
          <span class="step-label">Complete</span>
        </div>
      </div>

      <!-- Step 1: Select Product -->
      <div v-if="step === 'select'" class="step-content">
        <ProductSelector filter="one_time" @select="onProductSelected" />
        <div v-if="loading" class="loading-state">
          <span class="spinner"></span> Creating payment intent...
        </div>
        <div v-if="confirmError || error" class="error-box">
          <strong>Error:</strong> {{ confirmError || error }}
        </div>
      </div>

      <!-- Step 2: Payment -->
      <div v-else-if="step === 'payment'" class="step-content">
        <div class="step-section">
          <div class="step-header">
            <h4>Enter Email & Payment Details</h4>
            <button class="change-btn" @click="reset">Change Product</button>
          </div>

          <div class="product-summary">
            <span>{{ selectedProduct?.name }}</span>
            <span class="price">{{ formatPrice(selectedProduct?.price.amount || 0, selectedProduct?.price.currency || 'usd') }}</span>
          </div>

          <div class="stripe-container">
            <VueStripeProvider :publishable-key="publishableKey">
              <VueStripeElements :client-secret="clientSecret!">
                <div class="elements-form">
                  <div class="form-field">
                    <label>Email</label>
                    <div class="element-wrapper link-element">
                      <VueStripeLinkAuthenticationElement
                        @ready="linkReady = true"
                        @change="(e) => email = e.value?.email || null"
                      />
                    </div>
                    <div v-if="email" class="email-detected">
                      <span class="icon">✓</span> Email: {{ email }}
                    </div>
                  </div>

                  <div class="form-field">
                    <label>Payment Method</label>
                    <div class="element-wrapper payment-element">
                      <VueStripePaymentElement @ready="paymentReady = true" />
                    </div>
                  </div>
                </div>

                <div class="ready-indicators">
                  <span :class="['indicator', { ready: linkReady }]">{{ linkReady ? '✓' : '○' }} Link Auth</span>
                  <span :class="['indicator', { ready: paymentReady }]">{{ paymentReady ? '✓' : '○' }} Payment</span>
                </div>

                <ConfirmLinkButton
                  :can-confirm="canConfirm"
                  :confirming="confirming"
                  :amount="selectedProduct?.price?.amount"
                  :currency="selectedProduct?.price?.currency"
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
      </div>

      <!-- Step 3: Complete -->
      <div v-else-if="step === 'complete'" class="step-content">
        <div class="success-state">
          <span class="success-icon">✓</span>
          <h4>Payment Successful!</h4>
          <p>Thank you for your purchase of {{ selectedProduct?.name }}.</p>
          <p v-if="paymentIntentId" class="payment-id">Payment ID: <code>{{ paymentIntentId }}</code></p>
          <button class="reset-btn" @click="reset">Start Over</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'

const ConfirmLinkButton = defineComponent({
  name: 'ConfirmLinkButton',
  props: { canConfirm: Boolean, confirming: Boolean, amount: Number, currency: String },
  emits: ['confirm-start', 'confirm-end', 'success', 'error'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const { elements } = useStripeElements()

    function formatPrice(amount: number | undefined, currency: string | undefined) {
      if (!amount || !currency) return ''
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)
    }

    async function confirmPayment() {
      emit('confirm-start')
      emit('error', null)
      try {
        if (!stripe.value || !elements.value) throw new Error('Stripe not initialized')

        const { error, paymentIntent } = await stripe.value.confirmPayment({
          elements: elements.value,
          confirmParams: { return_url: window.location.href },
          redirect: 'if_required',
        })
        if (error) throw new Error(error.message)
        if (paymentIntent?.status === 'succeeded') emit('success')
      } catch (err) {
        emit('error', err instanceof Error ? err.message : 'Payment failed')
      } finally {
        emit('confirm-end')
      }
    }

    return () => h('button', {
      class: ['confirm-btn', { disabled: !props.canConfirm || props.confirming }],
      disabled: !props.canConfirm || props.confirming,
      onClick: confirmPayment,
    }, props.confirming ? 'Processing...' : `Pay ${formatPrice(props.amount, props.currency)}`)
  },
})

export default { components: { ConfirmLinkButton } }
</script>

<style scoped>
.link-auth-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }

.progress-steps { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1rem 0; }
.progress-step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.step-dot { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; background: var(--vp-c-bg-soft); border: 2px solid var(--vp-c-divider); border-radius: 50%; font-size: 0.875rem; font-weight: 600; color: var(--vp-c-text-2); transition: all 0.2s; }
.progress-step.active .step-dot { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: white; }
.progress-step.completed .step-dot { background: var(--vp-c-green-1); border-color: var(--vp-c-green-1); color: white; }
.step-label { font-size: 0.75rem; color: var(--vp-c-text-2); }
.progress-step.active .step-label { color: var(--vp-c-brand-1); font-weight: 500; }
.progress-step.completed .step-label { color: var(--vp-c-green-1); }
.progress-line { width: 4rem; height: 2px; background: var(--vp-c-divider); margin: 0 0.5rem; margin-bottom: 1.5rem; transition: background 0.2s; }
.progress-line.completed { background: var(--vp-c-green-1); }

.step-content { min-height: 200px; }
.loading-state { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; padding: 1rem; background: var(--vp-c-bg-soft); border-radius: 8px; color: var(--vp-c-text-2); }

.step-section { padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.step-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.step-header h4 { margin: 0; font-size: 1rem; font-weight: 600; }
.change-btn { padding: 0.25rem 0.75rem; background: transparent; border: 1px solid var(--vp-c-divider); border-radius: 4px; font-size: 0.75rem; color: var(--vp-c-text-2); cursor: pointer; }
.change-btn:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

.product-summary { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; margin-bottom: 1rem; background: var(--vp-c-bg); border-radius: 6px; }
.product-summary .price { font-weight: 700; color: var(--vp-c-brand-1); }

.stripe-container { padding: 1.5rem; background: var(--vp-c-bg); border-radius: 8px; }

.elements-form { margin-bottom: 1rem; }
.form-field { margin-bottom: 1rem; }
.form-field label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: var(--vp-c-text-1); }
.element-wrapper { padding: 0.75rem; background: white; border: 1px solid var(--vp-c-divider); border-radius: 6px; transition: border-color 0.2s; }
.element-wrapper:focus-within { border-color: var(--vp-c-brand-1); }
:root.dark .element-wrapper { background: #1a1a1a; }
.link-element { border-color: var(--vp-c-green-1); }
.payment-element { min-height: 200px; }

.email-detected { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.5rem; padding: 0.375rem 0.5rem; background: var(--vp-c-green-soft); border-radius: 4px; font-size: 0.75rem; color: var(--vp-c-green-darker); }
.email-detected .icon { font-weight: bold; }

.ready-indicators { display: flex; gap: 1rem; margin-bottom: 1rem; padding: 0.5rem 0.75rem; background: var(--vp-c-bg-soft); border-radius: 6px; }
.indicator { font-size: 0.75rem; color: var(--vp-c-text-3); }
.indicator.ready { color: var(--vp-c-green-1); }

.confirm-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.875rem 1.5rem; background: #635bff; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.confirm-btn:hover:not(.disabled) { opacity: 0.9; }
.confirm-btn.disabled { opacity: 0.6; cursor: not-allowed; }

.error-box { margin-top: 1rem; padding: 0.75rem 1rem; background: var(--vp-c-danger-soft); border: 1px solid var(--vp-c-danger-1); border-radius: 6px; color: var(--vp-c-danger-1); font-size: 0.875rem; }

.success-state { text-align: center; padding: 2rem; }
.success-icon { display: inline-flex; align-items: center; justify-content: center; width: 4rem; height: 4rem; background: var(--vp-c-green-1); color: white; border-radius: 50%; font-size: 2rem; margin-bottom: 1rem; }
.success-state h4 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
.success-state p { margin: 0.5rem 0; color: var(--vp-c-text-2); }
.payment-id { margin-top: 1rem; }
.payment-id code { padding: 0.25rem 0.5rem; background: var(--vp-c-bg-soft); border-radius: 4px; font-size: 0.75rem; }
.reset-btn { margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
.reset-btn:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

.spinner { width: 1rem; height: 1rem; border: 2px solid var(--vp-c-divider); border-top-color: var(--vp-c-brand-1); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
