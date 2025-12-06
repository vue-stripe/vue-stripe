<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeIbanElement as StripeIbanElementType,
  StripeIbanElementOptions,
  StripeIbanElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeIbanElementOptions
}

interface Emits {
  (e: 'ready', element: StripeIbanElementType): void
  (e: 'change', event: StripeIbanElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const ibanElement = ref<StripeIbanElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeIbanElement must be used within VueStripeElements'
  )
}

const createIbanElement = () => {
  if (!elementsInstance.elements.value) {
    error.value = 'Elements instance not available'
    loading.value = false
    return
  }

  if (!elementRef.value) {
    error.value = 'Mount point not available'
    loading.value = false
    return
  }

  try {
    error.value = null
    loading.value = true

    // Default options for IBAN element - SEPA countries
    const defaultOptions: StripeIbanElementOptions = {
      supportedCountries: ['SEPA'],
      ...props.options
    }

    // Create IBAN element
    ibanElement.value = elementsInstance.elements.value.create('iban', defaultOptions)

    // Set up event listeners
    ibanElement.value.on('ready', () => {
      loading.value = false
      emit('ready', ibanElement.value!)
    })

    ibanElement.value.on('change', (event) => {
      // Update error state from Stripe
      if (event.error) {
        error.value = event.error.message
      } else {
        error.value = null
      }
      emit('change', event)
    })

    ibanElement.value.on('focus', () => {
      emit('focus')
    })

    ibanElement.value.on('blur', () => {
      emit('blur')
    })

    ibanElement.value.on('escape', () => {
      emit('escape')
    })

    // Mount the element
    ibanElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create IBAN element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] IBAN element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (ibanElement.value && newOptions) {
      ibanElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !ibanElement.value) {
      createIbanElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !ibanElement.value) {
    createIbanElement()
  }
})

onUnmounted(() => {
  if (ibanElement.value) {
    ibanElement.value.destroy()
  }
})

// Expose element and methods for parent access
defineExpose({
  element: ibanElement,
  loading,
  error,
  focus: () => ibanElement.value?.focus(),
  blur: () => ibanElement.value?.blur(),
  clear: () => ibanElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-iban-element">
    <div
      v-if="error"
      class="vue-stripe-iban-element-error"
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
      ref="elementRef"
      class="vue-stripe-iban-element-mount"
      :class="{ 'vue-stripe-iban-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-iban-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading IBAN form...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-iban-element {
  position: relative;
}

.vue-stripe-iban-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-iban-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-iban-element-loading {
  opacity: 0.5;
}

.vue-stripe-iban-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-iban-element-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #6c757d;
  text-align: center;
}

.vue-stripe-error-message,
.vue-stripe-loading-message {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
