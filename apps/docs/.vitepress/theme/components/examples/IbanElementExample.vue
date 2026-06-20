<script setup lang="ts">
import { defineComponent, h, ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeIbanElement,
  useStripe,
  useStripeElements,
} from '@vue-stripe/vue-stripe'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()
const { createSepaIntent, formatPrice, loading, error } = useBackendApi()

const AMOUNT = 2000 // €20.00

const step = ref<'start' | 'pay' | 'done'>('start')
const clientSecret = ref<string | null>(null)
const paymentIntentId = ref<string | null>(null)
const startError = ref<string | null>(null)

async function start() {
  startError.value = null
  try {
    const res = await createSepaIntent({ amount: AMOUNT })
    clientSecret.value = res.clientSecret
    paymentIntentId.value = res.paymentIntentId
    step.value = 'pay'
  } catch (err) {
    startError.value = err instanceof Error ? err.message : 'Failed to create SEPA intent'
  }
}

function reset() {
  step.value = 'start'
  clientSecret.value = null
  paymentIntentId.value = null
  startError.value = null
}

const PayForm = defineComponent({
  name: 'SepaPayForm',
  props: { clientSecret: { type: String, required: true } },
  emits: ['done', 'error'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const { elements } = useStripeElements()
    const name = ref('')
    const email = ref('')
    const ibanReady = ref(false)
    const ibanComplete = ref(false)
    const confirming = ref(false)
    const canPay = computed(() => ibanComplete.value && name.value && email.value && !confirming.value)

    async function pay() {
      confirming.value = true
      try {
        const ibanElement = elements.value?.getElement('iban')
        if (!stripe.value || !ibanElement) throw new Error('Stripe not initialized')
        const { error: err, paymentIntent } = await stripe.value.confirmSepaDebitPayment(props.clientSecret, {
          payment_method: { sepa_debit: ibanElement, billing_details: { name: name.value, email: email.value } },
        })
        if (err) throw new Error(err.message)
        if (paymentIntent) emit('done', paymentIntent.status)
      } catch (e) {
        emit('error', e instanceof Error ? e.message : 'Payment failed')
      } finally {
        confirming.value = false
      }
    }

    return () =>
      h('div', { class: 'pay-form' }, [
        h('input', { class: 'text', placeholder: 'Full name', value: name.value, onInput: (e: any) => (name.value = e.target.value) }),
        h('input', { class: 'text', placeholder: 'Email', value: email.value, onInput: (e: any) => (email.value = e.target.value) }),
        h('div', { class: 'iban-wrap' }, [
          h(VueStripeIbanElement, {
            options: { supportedCountries: ['SEPA'], placeholderCountry: 'DE' },
            onReady: () => (ibanReady.value = true),
            onChange: (ev: any) => (ibanComplete.value = !!ev?.complete),
          }),
        ]),
        h('p', { class: 'hint' }, 'Test IBAN: AT61 1904 3002 3457 3201'),
        h('button', {
          disabled: !canPay.value,
          onClick: pay,
          // Inline style: this button is nested in an inner component, so the
          // parent SFC's scoped `.btn` rule doesn't reach it.
          style: { padding: '0.75rem 1.25rem', background: '#635bff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '600', cursor: canPay.value ? 'pointer' : 'not-allowed', opacity: canPay.value ? '1' : '0.6' },
        }, confirming.value ? 'Processing…' : `Pay ${formatPrice(2000, 'eur')} with SEPA`),
      ])
  },
})
</script>

<template>
  <div class="iban-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <PaymentStatus />
      <p class="intro">
        <strong>SEPA Direct Debit</strong> collects a bank account (IBAN) for euro payments across the
        SEPA region. Payments confirm asynchronously and settle to a <code>processing</code> status.
      </p>

      <div v-if="step === 'start'" class="step">
        <button class="btn" :disabled="loading" @click="start">{{ loading ? 'Preparing…' : 'Start — pay €20 with SEPA' }}</button>
        <div v-if="startError || error" class="error-box"><strong>Error:</strong> {{ startError || error }}</div>
      </div>

      <div v-else-if="step === 'pay'" class="step">
        <div class="stripe-container">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements :client-secret="clientSecret!">
              <PayForm :client-secret="clientSecret!" @done="step = 'done'" @error="(e) => startError = e" />
            </VueStripeElements>
          </VueStripeProvider>
        </div>
        <button class="link-btn" @click="reset">Cancel</button>
        <div v-if="startError" class="error-box"><strong>Error:</strong> {{ startError }}</div>
      </div>

      <div v-else class="step success">
        <span class="success-icon">✓</span>
        <h4>Debit submitted!</h4>
        <p>SEPA payments process asynchronously — the PaymentIntent is now <code>processing</code>.</p>
        <p v-if="paymentIntentId" class="id">Payment: <code>{{ paymentIntentId }}</code></p>
        <button class="link-btn" @click="reset">Start over</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.iban-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }
.intro { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--vp-c-text-2); }
.intro code { padding: 0.125rem 0.375rem; background: var(--vp-c-bg-soft); border-radius: 3px; font-size: 0.85em; }
.step { display: flex; flex-direction: column; gap: 1rem; align-items: flex-start; }
.stripe-container { width: 100%; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.pay-form { display: flex; flex-direction: column; gap: 0.75rem; }
.text { padding: 0.625rem 0.75rem; background: white; border: 1px solid var(--vp-c-divider); border-radius: 6px; color: #1a1a1a; }
.iban-wrap { padding: 0.75rem; background: white; border: 1px solid var(--vp-c-divider); border-radius: 6px; }
.hint { margin: 0; font-size: 0.75rem; color: var(--vp-c-text-3); }
.btn { padding: 0.75rem 1.25rem; background: #635bff; color: white; border: none; border-radius: 6px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn:hover:not(:disabled) { opacity: 0.9; }
.btn:disabled, .btn.disabled { opacity: 0.6; cursor: not-allowed; }
.link-btn { background: none; border: none; color: var(--vp-c-brand-1); font-size: 0.85rem; cursor: pointer; padding: 0; }
.error-box { width: 100%; padding: 0.75rem 1rem; background: var(--vp-c-danger-soft); border: 1px solid var(--vp-c-danger-1); border-radius: 6px; color: var(--vp-c-danger-1); font-size: 0.875rem; }
.success { align-items: center; text-align: center; padding: 1.5rem; }
.success-icon { display: inline-flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; background: var(--vp-c-green-1); color: white; border-radius: 50%; font-size: 1.75rem; }
.success h4 { margin: 0.5rem 0 0; }
.id code, .success code { padding: 0.25rem 0.5rem; background: var(--vp-c-bg-soft); border-radius: 4px; font-size: 0.75rem; }
</style>
