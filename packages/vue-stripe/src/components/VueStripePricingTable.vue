<script setup lang="ts">
import { ref, onMounted, inject } from 'vue-demi'
import { stripeConfigInjectionKey, type VueStripeConfig } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'
import type { VueStripePricingTableProps } from '../types'

const PRICING_TABLE_SCRIPT_URL = 'https://js.stripe.com/v3/pricing-table.js'

const props = defineProps<VueStripePricingTableProps>()

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error', error: Error): void
}>()

// Inject config from VueStripeProvider
const config = inject<VueStripeConfig>(stripeConfigInjectionKey)

if (!config?.publishableKey) {
  throw new VueStripeProviderError(
    'VueStripePricingTable must be used within a VueStripeProvider component'
  )
}

const publishableKey = config.publishableKey
const loading = ref(true)
const error = ref<string | null>(null)

/**
 * Load the Stripe pricing table script dynamically
 */
const loadPricingTableScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${PRICING_TABLE_SCRIPT_URL}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = PRICING_TABLE_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Stripe pricing table script'))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    await loadPricingTableScript()
    loading.value = false
    emit('load')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load pricing table'
    error.value = errorMessage
    loading.value = false
    emit('error', err instanceof Error ? err : new Error(errorMessage))
    console.error('[Vue Stripe] Pricing table error:', errorMessage)
  }
})

// Expose state for parent components
defineExpose({
  loading,
  error
})
</script>

<template>
  <div class="vue-stripe-pricing-table">
    <slot
      v-if="loading"
      name="loading"
    >
      <div class="vue-stripe-pricing-table-loading">
        Loading pricing table...
      </div>
    </slot>
    <slot
      v-else-if="error"
      name="error"
      :error="error"
    >
      <div class="vue-stripe-pricing-table-error">
        {{ error }}
      </div>
    </slot>
    <stripe-pricing-table
      v-show="!loading && !error"
      :pricing-table-id="props.pricingTableId"
      :publishable-key="publishableKey"
      :customer-email="props.customerEmail"
      :customer-session-client-secret="props.customerSessionClientSecret"
      :client-reference-id="props.clientReferenceId"
    />
  </div>
</template>

<style scoped>
.vue-stripe-pricing-table {
  width: 100%;
}

.vue-stripe-pricing-table-loading {
  color: #6c757d;
  padding: 1rem;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.vue-stripe-pricing-table-error {
  color: #dc3545;
  padding: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
