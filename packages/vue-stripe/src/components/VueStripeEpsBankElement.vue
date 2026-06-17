<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeEpsBankElement as StripeEpsBankElementType,
  StripeEpsBankElementOptions,
  StripeEpsBankElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeEpsBankElementOptions
}

interface Emits {
  (e: 'ready', element: StripeEpsBankElementType): void
  (e: 'change', event: StripeEpsBankElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const epsBankElement = ref<StripeEpsBankElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeEpsBankElement must be used within VueStripeElements'
  )
}

// Named handlers so listeners can be detached with .off() on teardown.
const handleReady = () => {
  loading.value = false
  emit('ready', epsBankElement.value!)
}
const handleChange = (event: StripeEpsBankElementChangeEvent) => {
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

const createEpsBankElement = () => {
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

    // Create EPS bank element (options are required for epsBank)
    epsBankElement.value = elementsInstance.elements.value.create('epsBank', props.options || {})

    // Set up event listeners (named handlers, removed in onUnmounted)
    epsBankElement.value.on('ready', handleReady)
    epsBankElement.value.on('change', handleChange)
    epsBankElement.value.on('focus', handleFocus)
    epsBankElement.value.on('blur', handleBlur)
    epsBankElement.value.on('escape', handleEscape)

    // Mount the element
    epsBankElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create EPS bank element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] EPS bank element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (epsBankElement.value && newOptions) {
      epsBankElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !epsBankElement.value) {
      createEpsBankElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !epsBankElement.value) {
    createEpsBankElement()
  }
})

onUnmounted(() => {
  if (epsBankElement.value) {
    epsBankElement.value.off('ready', handleReady)
    epsBankElement.value.off('change', handleChange)
    epsBankElement.value.off('focus', handleFocus)
    epsBankElement.value.off('blur', handleBlur)
    epsBankElement.value.off('escape', handleEscape)
    epsBankElement.value.destroy()
    epsBankElement.value = null
  }
})

// Expose element and methods for parent access
defineExpose({
  element: epsBankElement,
  loading,
  error,
  focus: () => epsBankElement.value?.focus(),
  blur: () => epsBankElement.value?.blur(),
  clear: () => epsBankElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-eps-bank-element">
    <div
      v-if="error"
      class="vue-stripe-eps-bank-element-error"
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
      class="vue-stripe-eps-bank-element-mount"
      :class="{ 'vue-stripe-eps-bank-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-eps-bank-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading EPS bank selector...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-eps-bank-element {
  position: relative;
}

.vue-stripe-eps-bank-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-eps-bank-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-eps-bank-element-loading {
  opacity: 0.5;
}

.vue-stripe-eps-bank-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-eps-bank-element-loader {
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
