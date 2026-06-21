<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeExpressCheckoutElement,
  useStripe,
  useStripeElements,
} from '@vue-stripe/vue-stripe'
import ProductSelector from './ProductSelector.vue'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi, type Product } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()
const { createPaymentIntent, formatPrice, loading, error } = useBackendApi()

const step = ref<'select' | 'pay' | 'done'>('select')
const product = ref<Product | null>(null)
const clientSecret = ref<string | null>(null)
const confirmError = ref<string | null>(null)

async function onProductSelected(p: Product) {
  product.value = p
  confirmError.value = null
  try {
    const res = await createPaymentIntent({ priceId: p.price.id, amount: p.price.amount, currency: p.price.currency })
    clientSecret.value = res.clientSecret
    step.value = 'pay'
  } catch (err) {
    confirmError.value = err instanceof Error ? err.message : 'Failed to create payment intent'
  }
}

function reset() {
  step.value = 'select'
  product.value = null
  clientSecret.value = null
  confirmError.value = null
}

const ExpressForm = defineComponent({
  name: 'ExpressForm',
  props: { clientSecret: { type: String, required: true } },
  emits: ['done', 'error'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const { elements } = useStripeElements()
    const available = ref<boolean | null>(null)

    // The element only renders wallets the browser/device supports.
    function onReady(ev: any) {
      available.value = !!(ev?.availablePaymentMethods)
    }

    async function onConfirm() {
      try {
        if (!stripe.value || !elements.value) throw new Error('Stripe not initialized')
        const { error: err, paymentIntent } = await stripe.value.confirmPayment({
          elements: elements.value,
          clientSecret: props.clientSecret,
          confirmParams: { return_url: window.location.href },
          redirect: 'if_required',
        })
        if (err) throw new Error(err.message)
        if (paymentIntent?.status === 'succeeded') emit('done')
      } catch (e) {
        emit('error', e instanceof Error ? e.message : 'Payment failed')
      }
    }

    return () =>
      h('div', { class: 'express-form' }, [
        h(VueStripeExpressCheckoutElement, { onReady, onConfirm }),
        available.value === false
          ? h('p', { class: 'hint' }, 'No express wallets are available in this browser. Try Safari (Apple Pay) or Chrome with Google Pay / a saved Link account.')
          : null,
      ])
  },
})
</script>

<template>
  <div class="express-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <PaymentStatus />
      <p class="intro">
        The Express Checkout Element renders one-click wallet buttons — Apple Pay, Google Pay, Link,
        PayPal — depending on what the customer's browser and your Dashboard support. Buttons that
        aren't available simply don't render.
      </p>

      <div v-if="step === 'select'" class="step">
        <ProductSelector filter="one_time" @select="onProductSelected" />
        <div v-if="loading" class="loading-state"><span class="spinner"></span> Creating payment intent…</div>
        <div v-if="confirmError || error" class="error-box"><strong>Error:</strong> {{ confirmError || error }}</div>
      </div>

      <div v-else-if="step === 'pay'" class="step">
        <div class="summary">
          <span>{{ product?.name }}</span>
          <span class="price">{{ formatPrice(product?.price.amount || 0, product?.price.currency || 'usd') }}</span>
        </div>
        <div class="stripe-container">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements :client-secret="clientSecret!">
              <ExpressForm :client-secret="clientSecret!" @done="step = 'done'" @error="(e) => confirmError = e" />
            </VueStripeElements>
          </VueStripeProvider>
        </div>
        <button class="link-btn" @click="reset">Change product</button>
        <div v-if="confirmError" class="error-box"><strong>Error:</strong> {{ confirmError }}</div>
      </div>

      <div v-else class="step success">
        <span class="success-icon">✓</span>
        <h4>Payment successful!</h4>
        <button class="link-btn" @click="reset">Start over</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.express-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }
.intro { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--vp-c-text-2); }
.step { display: flex; flex-direction: column; gap: 1rem; align-items: flex-start; }
.summary { display: flex; justify-content: space-between; width: 100%; padding: 0.75rem 1rem; background: var(--vp-c-bg-soft); border-radius: 6px; }
.summary .price { font-weight: 700; color: var(--vp-c-brand-1); }
.stripe-container { width: 100%; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.express-form { width: 100%; }
/* .hint is rendered by the inner ExpressForm component; scope it through
   .express-form so :deep() reaches it without leaking into ProductSelector's
   own .hint (which also lives in this component's subtree). */
.express-form :deep(.hint) { margin: 0.75rem 0 0; font-size: 0.8rem; color: var(--vp-c-text-3); }
.loading-state { display: flex; align-items: center; gap: 0.5rem; color: var(--vp-c-text-2); }
.link-btn { background: none; border: none; color: var(--vp-c-brand-1); font-size: 0.85rem; cursor: pointer; padding: 0; }
.error-box { width: 100%; padding: 0.75rem 1rem; background: var(--vp-c-danger-soft); border: 1px solid var(--vp-c-danger-1); border-radius: 6px; color: var(--vp-c-danger-1); font-size: 0.875rem; }
.success { align-items: center; text-align: center; padding: 1.5rem; }
.success-icon { display: inline-flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; background: var(--vp-c-green-1); color: white; border-radius: 50%; font-size: 1.75rem; }
.success h4 { margin: 0.5rem 0 0; }
.spinner { width: 1rem; height: 1rem; border: 2px solid var(--vp-c-divider); border-top-color: var(--vp-c-brand-1); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
