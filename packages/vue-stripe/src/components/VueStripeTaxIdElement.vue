<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeTaxIdElement as StripeTaxIdElementType,
  StripeTaxIdElementOptions,
  StripeTaxIdElementChangeEvent,
  StripeError
} from '@stripe/stripe-js'
import { stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeCheckoutError } from '../utils/errors'

interface Props {
  options?: StripeTaxIdElementOptions
}

interface Emits {
  (e: 'ready', element: StripeTaxIdElementType): void
  (e: 'change', event: StripeTaxIdElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
  (e: 'loaderstart'): void
  (e: 'loaderror', event: { elementType: 'taxId'; error: StripeError }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const taxIdElement = ref<StripeTaxIdElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// The Tax ID element is a Custom Checkout element, created from the `checkout`
// instance rather than from an Elements group.
const checkoutInstance = inject(stripeCheckoutInjectionKey)

if (!checkoutInstance) {
  throw new VueStripeCheckoutError(
    'VueStripeTaxIdElement must be used within VueStripeCheckoutProvider'
  )
}

// Named handlers so listeners can be detached with .off() on teardown.
const handleReady = () => {
  loading.value = false
  emit('ready', taxIdElement.value!)
}
const handleChange = (event: StripeTaxIdElementChangeEvent) => emit('change', event)
const handleFocus = () => emit('focus')
const handleBlur = () => emit('blur')
const handleEscape = () => emit('escape')
const handleLoaderStart = () => emit('loaderstart')
const handleLoaderError = (event: { elementType: 'taxId'; error: StripeError }) => {
  error.value = event.error?.message ?? 'Failed to load tax ID element'
  emit('loaderror', event)
}

const createTaxIdElement = () => {
  const checkout = checkoutInstance.checkout.value

  if (!checkout) {
    error.value = 'Checkout instance not available'
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

    // Reuse an existing element if the checkout already created one — Stripe
    // only allows a single Tax ID element per checkout instance.
    taxIdElement.value =
      checkout.getTaxIdElement() ?? checkout.createTaxIdElement(props.options)

    // Set up event listeners (named handlers, removed in onUnmounted).
    taxIdElement.value.on('ready', handleReady)
    taxIdElement.value.on('change', handleChange)
    taxIdElement.value.on('focus', handleFocus)
    taxIdElement.value.on('blur', handleBlur)
    taxIdElement.value.on('escape', handleEscape)
    taxIdElement.value.on('loaderstart', handleLoaderStart)
    taxIdElement.value.on('loaderror', handleLoaderError)

    // Mount the element.
    taxIdElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to create tax ID element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Tax ID element creation error:', errorMessage)
  }
}

// Watch for options changes.
watch(
  () => props.options,
  (newOptions) => {
    if (taxIdElement.value && newOptions) {
      taxIdElement.value.update(newOptions)
    }
  },
  { deep: true }
)

onMounted(() => {
  if (checkoutInstance.checkout.value && elementRef.value && !taxIdElement.value) {
    createTaxIdElement()
  }
})

onUnmounted(() => {
  if (taxIdElement.value) {
    taxIdElement.value.off('ready', handleReady)
    taxIdElement.value.off('change', handleChange)
    taxIdElement.value.off('focus', handleFocus)
    taxIdElement.value.off('blur', handleBlur)
    taxIdElement.value.off('escape', handleEscape)
    taxIdElement.value.off('loaderstart', handleLoaderStart)
    taxIdElement.value.off('loaderror', handleLoaderError)
    taxIdElement.value.destroy()
    taxIdElement.value = null
  }
})

// Expose element and methods for parent access.
defineExpose({
  element: taxIdElement,
  loading,
  error,
  focus: () => taxIdElement.value?.focus(),
  blur: () => taxIdElement.value?.blur(),
  clear: () => taxIdElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-tax-id-element">
    <div
      v-if="error"
      class="vue-stripe-tax-id-element-error"
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
      class="vue-stripe-tax-id-element-mount"
      :class="{ 'vue-stripe-tax-id-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-tax-id-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading tax ID form...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-tax-id-element {
  position: relative;
}

.vue-stripe-tax-id-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-tax-id-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-tax-id-element-loading {
  opacity: 0.5;
}

.vue-stripe-tax-id-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-tax-id-element-loader {
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
