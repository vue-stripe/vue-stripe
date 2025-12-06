<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeIdealBankElement as StripeIdealBankElementType,
  StripeIdealBankElementOptions,
  StripeIdealBankElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeIdealBankElementOptions
}

interface Emits {
  (e: 'ready', element: StripeIdealBankElementType): void
  (e: 'change', event: StripeIdealBankElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const idealBankElement = ref<StripeIdealBankElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeIdealBankElement must be used within VueStripeElements'
  )
}

const createIdealBankElement = () => {
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

    // Create iDEAL bank element
    idealBankElement.value = elementsInstance.elements.value.create('idealBank', props.options)

    // Set up event listeners
    idealBankElement.value.on('ready', () => {
      loading.value = false
      emit('ready', idealBankElement.value!)
    })

    idealBankElement.value.on('change', (event) => {
      // Update error state from Stripe
      if (event.error) {
        error.value = event.error.message
      } else {
        error.value = null
      }
      emit('change', event)
    })

    idealBankElement.value.on('focus', () => {
      emit('focus')
    })

    idealBankElement.value.on('blur', () => {
      emit('blur')
    })

    idealBankElement.value.on('escape', () => {
      emit('escape')
    })

    // Mount the element
    idealBankElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create iDEAL bank element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] iDEAL bank element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (idealBankElement.value && newOptions) {
      idealBankElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !idealBankElement.value) {
      createIdealBankElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !idealBankElement.value) {
    createIdealBankElement()
  }
})

onUnmounted(() => {
  if (idealBankElement.value) {
    idealBankElement.value.destroy()
  }
})

// Expose element and methods for parent access
defineExpose({
  element: idealBankElement,
  loading,
  error,
  focus: () => idealBankElement.value?.focus(),
  blur: () => idealBankElement.value?.blur(),
  clear: () => idealBankElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-ideal-bank-element">
    <div
      v-if="error"
      class="vue-stripe-ideal-bank-element-error"
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
      class="vue-stripe-ideal-bank-element-mount"
      :class="{ 'vue-stripe-ideal-bank-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-ideal-bank-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading iDEAL bank selector...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-ideal-bank-element {
  position: relative;
}

.vue-stripe-ideal-bank-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-ideal-bank-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-ideal-bank-element-loading {
  opacity: 0.5;
}

.vue-stripe-ideal-bank-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-ideal-bank-element-loader {
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
