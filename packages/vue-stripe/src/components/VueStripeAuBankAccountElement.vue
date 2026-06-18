<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeAuBankAccountElement as StripeAuBankAccountElementType,
  StripeAuBankAccountElementOptions,
  StripeAuBankAccountElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeAuBankAccountElementOptions
}

interface Emits {
  (e: 'ready', element: StripeAuBankAccountElementType): void
  (e: 'change', event: StripeAuBankAccountElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const auBankAccountElement = ref<StripeAuBankAccountElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeAuBankAccountElement must be used within VueStripeElements'
  )
}

// Named handlers so listeners can be detached with .off() on teardown.
const handleReady = () => {
  loading.value = false
  emit('ready', auBankAccountElement.value!)
}
const handleChange = (event: StripeAuBankAccountElementChangeEvent) => {
  // Update error state from Stripe
  if (event.error) {
    error.value = event.error.message
  } else {
    error.value = null
  }
  emit('change', event)
}
const handleFocus = () => emit('focus')
const handleBlur = () => emit('blur')
const handleEscape = () => emit('escape')

const createAuBankAccountElement = () => {
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

    // Create AU Bank Account element
    auBankAccountElement.value = elementsInstance.elements.value.create('auBankAccount', props.options)

    // Set up event listeners (named handlers, removed in onUnmounted)
    auBankAccountElement.value.on('ready', handleReady)
    auBankAccountElement.value.on('change', handleChange)
    auBankAccountElement.value.on('focus', handleFocus)
    auBankAccountElement.value.on('blur', handleBlur)
    auBankAccountElement.value.on('escape', handleEscape)

    // Mount the element
    auBankAccountElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create AU Bank Account element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] AU Bank Account element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (auBankAccountElement.value && newOptions) {
      auBankAccountElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !auBankAccountElement.value) {
      createAuBankAccountElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !auBankAccountElement.value) {
    createAuBankAccountElement()
  }
})

onUnmounted(() => {
  if (auBankAccountElement.value) {
    auBankAccountElement.value.off('ready', handleReady)
    auBankAccountElement.value.off('change', handleChange)
    auBankAccountElement.value.off('focus', handleFocus)
    auBankAccountElement.value.off('blur', handleBlur)
    auBankAccountElement.value.off('escape', handleEscape)
    auBankAccountElement.value.destroy()
    auBankAccountElement.value = null
  }
})

// Expose element and methods for parent access
defineExpose({
  element: auBankAccountElement,
  loading,
  error,
  focus: () => auBankAccountElement.value?.focus(),
  blur: () => auBankAccountElement.value?.blur(),
  clear: () => auBankAccountElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-au-bank-account-element">
    <div
      v-if="error"
      class="vue-stripe-au-bank-account-element-error"
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
      class="vue-stripe-au-bank-account-element-mount"
      :class="{ 'vue-stripe-au-bank-account-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-au-bank-account-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading BECS Direct Debit form...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-au-bank-account-element {
  position: relative;
}

.vue-stripe-au-bank-account-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-au-bank-account-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-au-bank-account-element-loading {
  opacity: 0.5;
}

.vue-stripe-au-bank-account-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-au-bank-account-element-loader {
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
