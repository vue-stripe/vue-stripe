<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeP24BankElement as StripeP24BankElementType,
  StripeP24BankElementOptions,
  StripeP24BankElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeP24BankElementOptions
}

interface Emits {
  (e: 'ready', element: StripeP24BankElementType): void
  (e: 'change', event: StripeP24BankElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const p24BankElement = ref<StripeP24BankElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeP24BankElement must be used within VueStripeElements'
  )
}

const createP24BankElement = () => {
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

    // Create P24 bank element (options are required for p24Bank)
    p24BankElement.value = elementsInstance.elements.value.create('p24Bank', props.options || {})

    // Set up event listeners
    p24BankElement.value.on('ready', () => {
      loading.value = false
      emit('ready', p24BankElement.value!)
    })

    p24BankElement.value.on('change', (event) => {
      // Update error state from Stripe
      if (event.error) {
        error.value = event.error.message
      } else {
        error.value = null
      }
      emit('change', event)
    })

    p24BankElement.value.on('focus', () => {
      emit('focus')
    })

    p24BankElement.value.on('blur', () => {
      emit('blur')
    })

    p24BankElement.value.on('escape', () => {
      emit('escape')
    })

    // Mount the element
    p24BankElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create P24 bank element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] P24 bank element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (p24BankElement.value && newOptions) {
      p24BankElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !p24BankElement.value) {
      createP24BankElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !p24BankElement.value) {
    createP24BankElement()
  }
})

onUnmounted(() => {
  if (p24BankElement.value) {
    p24BankElement.value.destroy()
  }
})

// Expose element and methods for parent access
defineExpose({
  element: p24BankElement,
  loading,
  error,
  focus: () => p24BankElement.value?.focus(),
  blur: () => p24BankElement.value?.blur(),
  clear: () => p24BankElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-p24-bank-element">
    <div
      v-if="error"
      class="vue-stripe-p24-bank-element-error"
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
      class="vue-stripe-p24-bank-element-mount"
      :class="{ 'vue-stripe-p24-bank-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-p24-bank-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading Przelewy24 bank selector...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-p24-bank-element {
  position: relative;
}

.vue-stripe-p24-bank-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-p24-bank-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-p24-bank-element-loading {
  opacity: 0.5;
}

.vue-stripe-p24-bank-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-p24-bank-element-loader {
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
