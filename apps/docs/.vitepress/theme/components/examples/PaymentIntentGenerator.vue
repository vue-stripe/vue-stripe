<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBackendApi, type Product, type PaymentIntentResult } from '../../composables/useBackendApi'

const props = defineProps<{
  product?: Product | null
  intentType?: 'payment' | 'ideal' | 'sepa' | 'p24' | 'eps'
  autoGenerate?: boolean
}>()

const emit = defineEmits<{
  generated: [result: PaymentIntentResult]
}>()

const { createPaymentIntent, createIdealIntent, formatPrice, loading, error } = useBackendApi()

const result = ref<PaymentIntentResult | null>(null)
const copied = ref(false)
const generateError = ref<string | null>(null)

const intentTypeLabel = computed(() => {
  switch (props.intentType) {
    case 'ideal':
      return 'iDEAL'
    case 'sepa':
      return 'SEPA Debit'
    case 'p24':
      return 'Przelewy24'
    case 'eps':
      return 'EPS'
    default:
      return 'Payment'
  }
})

async function generate() {
  if (!props.product) return

  try {
    generateError.value = null

    const options = {
      amount: props.product.price.amount || 1000,
      currency: props.product.price.currency,
      description: `Payment for ${props.product.name}`,
      metadata: {
        productId: props.product.id,
        productName: props.product.name,
      },
    }

    let response: PaymentIntentResult

    if (props.intentType === 'ideal') {
      response = await createIdealIntent(options)
    } else {
      response = await createPaymentIntent(options)
    }

    result.value = response
    emit('generated', response)
  } catch (err) {
    generateError.value = err instanceof Error ? err.message : 'Failed to generate payment intent'
  }
}

async function copySecret() {
  if (!result.value?.clientSecret) return

  try {
    await navigator.clipboard.writeText(result.value.clientSecret)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = result.value.clientSecret
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// Auto-generate when product changes and autoGenerate is enabled
watch(
  () => props.product,
  (newProduct) => {
    if (newProduct && props.autoGenerate) {
      // Reset previous result and generate new one
      result.value = null
      generate()
    }
  }
)

defineExpose({
  result,
  generate,
})
</script>

<template>
  <div class="payment-intent-generator">
    <div class="step-header">
      <span class="step-number">1</span>
      <h4>Generate {{ intentTypeLabel }} Payment Intent</h4>
      <span class="badge backend">Backend</span>
    </div>

    <div v-if="!product" class="info-box">
      <span class="icon">ℹ️</span>
      Select a product above to generate a payment intent.
    </div>

    <div v-else class="generator-content">
      <div class="product-summary">
        <p>
          Creating intent for: <strong>{{ product.name }}</strong>
        </p>
        <p class="amount">
          Amount: {{ formatPrice(product.price.amount, product.price.currency) }}
        </p>
      </div>

      <!-- Show auto-generating status when autoGenerate is enabled -->
      <div v-if="autoGenerate && loading" class="auto-generating">
        <span class="spinner"></span>
        Automatically generating {{ intentTypeLabel }} intent...
      </div>

      <!-- Show manual button when autoGenerate is disabled -->
      <button
        v-else-if="!autoGenerate"
        class="generate-btn"
        :disabled="loading || !product"
        @click="generate"
      >
        <span v-if="loading" class="spinner"></span>
        {{ loading ? 'Generating...' : `Generate ${intentTypeLabel} Intent` }}
      </button>

      <div v-if="generateError || error" class="error-box">
        <strong>Error:</strong> {{ generateError || error }}
      </div>

      <div v-if="result" class="result-box">
        <div class="result-field">
          <label>Client Secret:</label>
          <div class="secret-row">
            <code class="secret">{{ result.clientSecret }}</code>
            <button class="copy-btn" @click="copySecret">
              {{ copied ? '✓ Copied' : 'Copy' }}
            </button>
          </div>
        </div>
        <div class="result-field">
          <label>Payment Intent ID:</label>
          <code>{{ result.paymentIntentId }}</code>
        </div>
        <div class="result-field">
          <label>Amount:</label>
          <span>{{ formatPrice(result.amount, result.currency) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-intent-generator {
  margin-bottom: 1.5rem;
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

.badge.backend {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-darker);
}

.info-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.generator-content {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.product-summary {
  margin-bottom: 1rem;
}

.product-summary p {
  margin: 0.25rem 0;
}

.product-summary .amount {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.auto-generating {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.generate-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.generate-btn:disabled {
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

.error-box {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-danger-soft);
  border: 1px solid var(--vp-c-danger-1);
  border-radius: 6px;
  color: var(--vp-c-danger-1);
  font-size: 0.875rem;
}

.result-box {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-green-soft);
  border: 1px solid var(--vp-c-green-1);
  border-radius: 6px;
}

.result-field {
  margin-bottom: 0.75rem;
}

.result-field:last-child {
  margin-bottom: 0;
}

.result-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 0.25rem;
}

.secret-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.secret {
  flex: 1;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-size: 0.75rem;
  word-break: break-all;
}

.copy-btn {
  padding: 0.375rem 0.75rem;
  background: var(--vp-c-green-1);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.copy-btn:hover {
  opacity: 0.9;
}

.result-field code {
  display: block;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
