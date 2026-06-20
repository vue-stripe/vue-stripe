<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeFpxBankElement as StripeFpxBankElementType,
  StripeFpxBankElementOptions,
  StripeFpxBankElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  /**
   * The type of the FPX account holder. This is required by Stripe.
   * @default 'individual'
   */
  accountHolderType?: 'individual' | 'company'
  /**
   * Additional options for the FPX Bank Element
   */
  options?: Omit<StripeFpxBankElementOptions, 'accountHolderType'>
}

interface Emits {
  (e: 'ready', element: StripeFpxBankElementType): void
  (e: 'change', event: StripeFpxBankElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const fpxBankElement = ref<StripeFpxBankElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeFpxBankElement must be used within VueStripeElements'
  )
}

// Named handlers so listeners can be detached with .off() on teardown.
const handleReady = () => {
  loading.value = false
  emit('ready', fpxBankElement.value!)
}
const handleChange = (event: StripeFpxBankElementChangeEvent) => {
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

const createFpxBankElement = () => {
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

    // Create FPX bank element with required accountHolderType
    const fpxOptions: StripeFpxBankElementOptions = {
      ...props.options,
      accountHolderType: props.accountHolderType ?? 'individual'
    }
    fpxBankElement.value = elementsInstance.elements.value.create('fpxBank', fpxOptions)

    // Set up event listeners (named handlers, removed in onUnmounted)
    fpxBankElement.value.on('ready', handleReady)
    fpxBankElement.value.on('change', handleChange)
    fpxBankElement.value.on('focus', handleFocus)
    fpxBankElement.value.on('blur', handleBlur)
    fpxBankElement.value.on('escape', handleEscape)

    // Mount the element
    fpxBankElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create FPX bank element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] FPX bank element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  [() => props.options, () => props.accountHolderType],
  ([newOptions, newAccountHolderType]) => {
    if (fpxBankElement.value) {
      fpxBankElement.value.update({
        ...newOptions,
        accountHolderType: newAccountHolderType ?? 'individual'
      })
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !fpxBankElement.value) {
      createFpxBankElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !fpxBankElement.value) {
    createFpxBankElement()
  }
})

onUnmounted(() => {
  if (fpxBankElement.value) {
    fpxBankElement.value.off('ready', handleReady)
    fpxBankElement.value.off('change', handleChange)
    fpxBankElement.value.off('focus', handleFocus)
    fpxBankElement.value.off('blur', handleBlur)
    fpxBankElement.value.off('escape', handleEscape)
    fpxBankElement.value.destroy()
    fpxBankElement.value = null
  }
})

// Expose element and methods for parent access
defineExpose({
  element: fpxBankElement,
  loading,
  error,
  focus: () => fpxBankElement.value?.focus(),
  blur: () => fpxBankElement.value?.blur(),
  clear: () => fpxBankElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-fpx-bank-element">
    <div
      v-if="error"
      class="vue-stripe-fpx-bank-element-error"
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
      class="vue-stripe-fpx-bank-element-mount"
      :class="{ 'vue-stripe-fpx-bank-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-fpx-bank-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading FPX bank selector...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-fpx-bank-element {
  position: relative;
}

.vue-stripe-fpx-bank-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-fpx-bank-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-fpx-bank-element-loading {
  opacity: 0.5;
}

.vue-stripe-fpx-bank-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-fpx-bank-element-loader {
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
