<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeCardElement,
  useCreatePaymentMethod,
} from '@vue-stripe/vue-stripe'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()

// Inner component (must be inside the provider to use the composable).
const Demo = defineComponent({
  name: 'CreatePmDemo',
  setup() {
    const { createPaymentMethod, loading, error } = useCreatePaymentMethod()
    const cardRef = ref<any>()
    const cardReady = ref(false)
    const result = ref<string | null>(null)

    async function onCreate() {
      result.value = null
      const card = cardRef.value?.element
      const res: any = await createPaymentMethod(card ? { type: 'card', card } : {})
      result.value = res?.paymentMethod
        ? `✓ ${res.paymentMethod.id}`
        : `✗ ${res?.error?.message || 'failed'}`
    }

    return () =>
      h('div', { class: 'cpm-demo' }, [
        h('div', { class: 'card-wrap' }, [
          h(VueStripeCardElement, { ref: cardRef, onReady: () => (cardReady.value = true) }),
        ]),
        h('button', {
          class: ['btn', { disabled: !cardReady.value || loading.value }],
          disabled: !cardReady.value || loading.value,
          onClick: onCreate,
        }, loading.value ? 'Creating…' : 'Create Payment Method'),
        result.value
          ? h('code', { class: ['result', { ok: result.value.startsWith('✓') }] }, result.value)
          : null,
        error.value ? h('p', { class: 'err' }, error.value) : null,
      ])
  },
})
</script>

<template>
  <div class="cpm-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <p class="intro">
        <code>useCreatePaymentMethod()</code> tokenizes card details into a reusable
        <code>PaymentMethod</code> without confirming a payment. Enter a test card
        (<code>4242 4242 4242 4242</code>) and create one.
      </p>

      <div class="stripe-container">
        <VueStripeProvider :publishable-key="publishableKey">
          <VueStripeElements>
            <component :is="Demo" />
          </VueStripeElements>
        </VueStripeProvider>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cpm-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }

.intro { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--vp-c-text-2); }
.intro code { padding: 0.125rem 0.375rem; background: var(--vp-c-bg-soft); border-radius: 3px; font-size: 0.85em; }

.stripe-container { padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.cpm-demo { display: flex; flex-direction: column; gap: 1rem; }
/* Every element below is rendered by the inner Demo component, so this SFC's
   scoped styles only reach them via :deep(). (--vp-c-bg is white in light /
   near-black in dark, replacing the old white + :root.dark override.) */
:deep(.card-wrap) { padding: 0.75rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 6px; }
:deep(.btn) { padding: 0.75rem 1.25rem; background: #635bff; color: white; border: none; border-radius: 6px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
:deep(.btn:hover:not(.disabled)) { opacity: 0.9; }
:deep(.btn.disabled) { opacity: 0.6; cursor: not-allowed; }
:deep(.result) { padding: 0.625rem 0.875rem; background: var(--vp-c-bg); border-radius: 6px; font-size: 0.8rem; color: var(--vp-c-danger-1); }
:deep(.result.ok) { color: var(--vp-c-green-darker); background: var(--vp-c-green-soft); }
:deep(.err) { margin: 0; color: var(--vp-c-danger-1); font-size: 0.85rem; }
</style>
