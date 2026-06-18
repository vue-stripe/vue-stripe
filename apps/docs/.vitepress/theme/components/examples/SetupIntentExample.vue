<script setup lang="ts">
import { defineComponent, h, ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  useSetupIntent,
} from '@vue-stripe/vue-stripe'
import PaymentStatus from './PaymentStatus.vue'
import { useBackendApi } from '../../composables/useBackendApi'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()
const { createSetupIntent, loading, error } = useBackendApi()

const step = ref<'start' | 'collect' | 'saved'>('start')
const clientSecret = ref<string | null>(null)
const setupIntentId = ref<string | null>(null)
const startError = ref<string | null>(null)

async function start() {
  startError.value = null
  try {
    const res = await createSetupIntent({})
    clientSecret.value = res.clientSecret
    setupIntentId.value = res.setupIntentId
    step.value = 'collect'
  } catch (err) {
    startError.value = err instanceof Error ? err.message : 'Failed to create setup intent'
  }
}

function reset() {
  step.value = 'start'
  clientSecret.value = null
  setupIntentId.value = null
  startError.value = null
}

// Inner component drives confirmSetup via the composable.
const SaveCardForm = defineComponent({
  name: 'SaveCardForm',
  props: { clientSecret: { type: String, required: true } },
  emits: ['saved', 'error'],
  setup(props, { emit }) {
    const { confirmSetup, loading: confirming } = useSetupIntent()
    const paymentReady = ref(false)
    const canSave = computed(() => paymentReady.value && !confirming.value)

    async function save() {
      const res: any = await confirmSetup({
        clientSecret: props.clientSecret,
        redirect: 'if_required',
      })
      if (res?.error) emit('error', res.error.message)
      else if (res?.setupIntent?.status === 'succeeded') emit('saved')
    }

    return () =>
      h('div', { class: 'save-form' }, [
        h('div', { class: 'pe-wrap' }, [
          h(VueStripePaymentElement, { onReady: () => (paymentReady.value = true) }),
        ]),
        h('button', {
          class: ['btn', { disabled: !canSave.value }],
          disabled: !canSave.value,
          onClick: save,
        }, confirming.value ? 'Saving…' : 'Save card'),
      ])
  },
})
</script>

<template>
  <div class="setup-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <PaymentStatus />
      <p class="intro">
        A <strong>SetupIntent</strong> saves a card for future off-session charges without taking a
        payment now. <code>useSetupIntent()</code> runs <code>elements.submit()</code> then
        <code>confirmSetup()</code> for you.
      </p>

      <!-- Step 1 -->
      <div v-if="step === 'start'" class="step">
        <button class="btn" :disabled="loading" @click="start">
          {{ loading ? 'Preparing…' : 'Start — save a card' }}
        </button>
        <div v-if="startError || error" class="error-box"><strong>Error:</strong> {{ startError || error }}</div>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 'collect'" class="step">
        <div class="stripe-container">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements :client-secret="clientSecret!">
              <SaveCardForm :client-secret="clientSecret!" @saved="step = 'saved'" @error="(e) => startError = e" />
            </VueStripeElements>
          </VueStripeProvider>
        </div>
        <button class="link-btn" @click="reset">Cancel</button>
        <div v-if="startError" class="error-box"><strong>Error:</strong> {{ startError }}</div>
      </div>

      <!-- Step 3 -->
      <div v-else class="step success">
        <span class="success-icon">✓</span>
        <h4>Card saved!</h4>
        <p v-if="setupIntentId" class="id">SetupIntent: <code>{{ setupIntentId }}</code></p>
        <button class="link-btn" @click="reset">Save another</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.setup-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }

.intro { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--vp-c-text-2); }
.intro code { padding: 0.125rem 0.375rem; background: var(--vp-c-bg-soft); border-radius: 3px; font-size: 0.85em; }

.step { display: flex; flex-direction: column; gap: 1rem; align-items: flex-start; }
.stripe-container { width: 100%; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.save-form { display: flex; flex-direction: column; gap: 1rem; }
.pe-wrap { min-height: 180px; padding: 0.75rem; background: white; border: 1px solid var(--vp-c-divider); border-radius: 6px; }
:root.dark .pe-wrap { background: #1a1a1a; }

.btn { padding: 0.75rem 1.25rem; background: #635bff; color: white; border: none; border-radius: 6px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn:hover:not(:disabled) { opacity: 0.9; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.link-btn { background: none; border: none; color: var(--vp-c-brand-1); font-size: 0.85rem; cursor: pointer; padding: 0; }

.error-box { width: 100%; padding: 0.75rem 1rem; background: var(--vp-c-danger-soft); border: 1px solid var(--vp-c-danger-1); border-radius: 6px; color: var(--vp-c-danger-1); font-size: 0.875rem; }

.success { align-items: center; text-align: center; padding: 1.5rem; }
.success-icon { display: inline-flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; background: var(--vp-c-green-1); color: white; border-radius: 50%; font-size: 1.75rem; }
.success h4 { margin: 0.5rem 0 0; }
.id code { padding: 0.25rem 0.5rem; background: var(--vp-c-bg-soft); border-radius: 4px; font-size: 0.75rem; }
</style>
