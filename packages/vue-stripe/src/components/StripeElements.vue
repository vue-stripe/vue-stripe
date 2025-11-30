<script setup lang="ts">
import { provide, ref, inject, watch, onMounted } from 'vue-demi'
import type { StripeElements } from '@stripe/stripe-js'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeProviderError } from '../utils/errors'

// Use a looser type for options since Stripe has multiple option shapes
 
type ElementsOptions = Record<string, any>

interface Props {
  clientSecret?: string
  options?: ElementsOptions
}

const props = defineProps<Props>()

const stripeInstance = inject(stripeInjectionKey)

if (!stripeInstance) {
  throw new StripeProviderError(
    'StripeElements must be used within StripeProvider'
  )
}

const elements = ref<StripeElements | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const createElements = () => {
  if (!stripeInstance.stripe.value) {
    error.value = 'Stripe instance not available'
    loading.value = false
    return
  }

  try {
    error.value = null
    loading.value = true

    // Build options object with clientSecret if provided
    const elementsOptions: ElementsOptions = {
      ...props.options
    }

    if (props.clientSecret) {
      elementsOptions['clientSecret'] = props.clientSecret
    }

    // Use type assertion since Stripe has complex overloads
     
    elements.value = (stripeInstance.stripe.value as any).elements(elementsOptions)
    loading.value = false
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create elements'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Elements creation error:', errorMessage)
  }
}

// Watch for Stripe instance to become available
watch(
  () => stripeInstance.stripe.value,
  (newStripe) => {
    if (newStripe && !elements.value) {
      createElements()
    }
  },
  { immediate: true }
)

// Watch for clientSecret changes
watch(
  () => props.clientSecret,
  () => {
    if (stripeInstance.stripe.value) {
      createElements()
    }
  }
)

onMounted(() => {
  if (stripeInstance.stripe.value && !elements.value) {
    createElements()
  }
})

// Provide elements context for child components
provide(stripeElementsInjectionKey, {
  elements,
  loading,
  error
})
</script>

<template>
  <div
    v-if="error"
    class="vue-stripe-elements-error"
  >
    <slot
      name="error"
      :error="error"
    >
      <div class="vue-stripe-error-message">
        {{ error }}
      </div>
    </slot>
  </div>
  <div
    v-else-if="loading"
    class="vue-stripe-elements-loading"
  >
    <slot name="loading">
      <div class="vue-stripe-loading-message">
        Initializing Elements...
      </div>
    </slot>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<style scoped>
.vue-stripe-elements-error {
  color: #dc3545;
  padding: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
}

.vue-stripe-elements-loading {
  color: #6c757d;
  padding: 1rem;
  text-align: center;
}

.vue-stripe-error-message,
.vue-stripe-loading-message {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>