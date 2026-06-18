<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement,
} from '@vue-stripe/vue-stripe'
import { useStripeConfig } from '../../composables/useStripeConfig'

const { publishableKey } = useStripeConfig()

// Controls
const amountDollars = ref(120)
const currency = ref<'usd' | 'gbp' | 'eur'>('usd')
const countryCode = ref<'US' | 'GB' | 'DE'>('US')

const methods = [
  { id: 'affirm', label: 'Affirm' },
  { id: 'klarna', label: 'Klarna' },
  { id: 'afterpay_clearpay', label: 'Afterpay / Clearpay' },
]
const selectedMethods = ref<string[]>(['affirm', 'klarna', 'afterpay_clearpay'])

function toggleMethod(id: string) {
  selectedMethods.value = selectedMethods.value.includes(id)
    ? selectedMethods.value.filter((m) => m !== id)
    : [...selectedMethods.value, id]
}

const ready = ref(false)

// Options passed to the messaging element. amount is in the smallest currency unit.
const messagingOptions = computed(() => ({
  amount: Math.round(amountDollars.value * 100),
  currency: currency.value.toUpperCase(),
  countryCode: countryCode.value,
  paymentMethodTypes: selectedMethods.value,
}))
</script>

<template>
  <div class="bnpl-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong>Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <template v-else>
      <p class="intro">
        The Payment Method Messaging Element is <strong>display-only</strong> — it promotes
        Buy&nbsp;Now,&nbsp;Pay&nbsp;Later availability (Affirm, Klarna, Afterpay/Clearpay) for a given
        amount. Adjust the controls and the message updates live.
      </p>

      <!-- Controls -->
      <div class="controls">
        <div class="control">
          <label>Amount</label>
          <div class="amount-input">
            <span class="prefix">{{ currency === 'gbp' ? '£' : currency === 'eur' ? '€' : '$' }}</span>
            <input v-model.number="amountDollars" type="number" min="1" step="1" />
          </div>
        </div>

        <div class="control">
          <label>Currency</label>
          <select v-model="currency">
            <option value="usd">USD</option>
            <option value="gbp">GBP</option>
            <option value="eur">EUR</option>
          </select>
        </div>

        <div class="control">
          <label>Country</label>
          <select v-model="countryCode">
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
          </select>
        </div>
      </div>

      <div class="methods">
        <span class="methods-label">Payment methods</span>
        <button
          v-for="m in methods"
          :key="m.id"
          class="chip"
          :class="{ active: selectedMethods.includes(m.id) }"
          @click="toggleMethod(m.id)"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Live element -->
      <div class="stripe-container">
        <span :class="['indicator', { ready }]">{{ ready ? '✓' : '○' }} Messaging element</span>
        <VueStripeProvider :publishable-key="publishableKey">
          <VueStripeElements>
            <VueStripePaymentMethodMessagingElement
              :options="messagingOptions"
              @ready="ready = true"
            />
          </VueStripeElements>
        </VueStripeProvider>
      </div>

      <p class="note">
        The exact message depends on the buyer's country, currency, amount, and which BNPL providers
        are enabled in your Dashboard. Some combinations render nothing if no provider qualifies.
      </p>
    </template>
  </div>
</template>

<style scoped>
.bnpl-example { padding: 1.5rem; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 12px; }
.warning-box { padding: 1rem; background: var(--vp-c-yellow-soft); border: 1px solid var(--vp-c-yellow-1); border-radius: 8px; color: var(--vp-c-yellow-darker); }
.warning-box strong { display: block; margin-bottom: 0.5rem; }
.warning-box p { margin: 0; font-size: 0.875rem; }
.warning-box code { padding: 0.125rem 0.375rem; background: rgba(0,0,0,0.1); border-radius: 3px; }

.intro { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--vp-c-text-2); }

.controls { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
.control { display: flex; flex-direction: column; gap: 0.375rem; }
.control label { font-size: 0.75rem; font-weight: 500; color: var(--vp-c-text-2); }
.amount-input { display: flex; align-items: center; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 6px; padding: 0 0.5rem; }
.amount-input .prefix { color: var(--vp-c-text-3); }
.amount-input input { width: 6rem; padding: 0.5rem; background: transparent; border: none; color: var(--vp-c-text-1); }
.control select { padding: 0.5rem; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 6px; color: var(--vp-c-text-1); }

.methods { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
.methods-label { font-size: 0.75rem; font-weight: 500; color: var(--vp-c-text-2); margin-right: 0.25rem; }
.chip { padding: 0.375rem 0.75rem; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 999px; font-size: 0.8rem; color: var(--vp-c-text-2); cursor: pointer; transition: all 0.15s; }
.chip.active { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: white; }

.stripe-container { padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 8px; }
.indicator { display: inline-block; margin-bottom: 0.75rem; font-size: 0.75rem; color: var(--vp-c-text-3); }
.indicator.ready { color: var(--vp-c-green-1); }

.note { margin: 1rem 0 0; font-size: 0.8rem; color: var(--vp-c-text-3); }
</style>
