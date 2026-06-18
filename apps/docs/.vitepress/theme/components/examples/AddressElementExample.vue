<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeAddressElement,
} from '@vue-stripe/vue-stripe'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()

const mode = ref<'shipping' | 'billing'>('shipping')
const ready = ref(false)
const complete = ref(false)
const captured = ref<Record<string, any> | null>(null)

function onChange(event: any) {
  complete.value = !!event?.complete
  captured.value = event?.value ?? null
}
</script>

<template>
  <div class="address-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <p class="intro">
        The Address Element collects a complete, validated shipping or billing address with built-in
        autocomplete. It emits <code>change</code> events with the structured value.
      </p>

      <div class="controls">
        <span class="label">Mode</span>
        <button class="chip" :class="{ active: mode === 'shipping' }" @click="mode = 'shipping'">Shipping</button>
        <button class="chip" :class="{ active: mode === 'billing' }" @click="mode = 'billing'">Billing</button>
      </div>

      <div class="stripe-container">
        <span :class="['indicator', { ready }]">{{ ready ? '✓' : '○' }} Address element</span>
        <VueStripeProvider :publishable-key="publishableKey">
          <VueStripeElements>
            <VueStripeAddressElement
              :key="mode"
              :options="{ mode }"
              @ready="ready = true"
              @change="onChange"
            />
          </VueStripeElements>
        </VueStripeProvider>
      </div>

      <div v-if="captured" class="captured">
        <div class="captured-header">
          <strong>Captured value</strong>
          <span class="badge" :class="{ ok: complete }">{{ complete ? 'complete' : 'incomplete' }}</span>
        </div>
        <pre>{{ JSON.stringify(captured, null, 2) }}</pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
.address-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }

.intro { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--vp-c-text-2); }
.controls { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; }
.controls .label { font-size: 0.75rem; font-weight: 500; color: var(--vp-c-text-2); margin-right: 0.25rem; }
.chip { padding: 0.375rem 0.875rem; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 999px; font-size: 0.8rem; color: var(--vp-c-text-2); cursor: pointer; transition: all 0.15s; }
.chip.active { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: white; }

.stripe-container { padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.indicator { display: inline-block; margin-bottom: 0.75rem; font-size: 0.75rem; color: var(--vp-c-text-3); }
.indicator.ready { color: var(--vp-c-green-1); }

.captured { margin-top: 1.25rem; padding: 1rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.captured-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.badge { font-size: 0.7rem; padding: 0.125rem 0.5rem; border-radius: 999px; background: var(--vp-c-divider); color: var(--vp-c-text-2); }
.badge.ok { background: var(--vp-c-green-soft); color: var(--vp-c-green-darker); }
.captured pre { margin: 0; padding: 0.75rem; background: var(--vp-c-bg); border-radius: 6px; font-size: 0.75rem; overflow-x: auto; }
</style>
