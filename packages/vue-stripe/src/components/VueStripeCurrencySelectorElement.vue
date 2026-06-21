<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted } from 'vue-demi'
import type { StripeCurrencySelectorElement as StripeCurrencySelectorElementType, StripeError } from '@stripe/stripe-js'
import { stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeCheckoutError } from '../utils/errors'

interface Emits {
  (e: 'ready', element: StripeCurrencySelectorElementType): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
  (e: 'loaderror', event: { elementType: 'currencySelector'; error: StripeError }): void
}

const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const currencySelectorElement = ref<StripeCurrencySelectorElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// The Currency Selector is a Custom Checkout element, created from the
// `checkout` instance rather than from an Elements group.
const checkoutInstance = inject(stripeCheckoutInjectionKey)

if (!checkoutInstance) {
  throw new VueStripeCheckoutError(
    'VueStripeCurrencySelectorElement must be used within VueStripeCheckoutProvider'
  )
}

// Named handlers so listeners can be detached with .off() on teardown.
const handleReady = () => {
  loading.value = false
  emit('ready', currencySelectorElement.value!)
}
const handleFocus = () => emit('focus')
const handleBlur = () => emit('blur')
const handleEscape = () => emit('escape')
const handleLoaderError = (event: { elementType: 'currencySelector'; error: StripeError }) => {
  error.value = event.error?.message ?? 'Failed to load currency selector'
  emit('loaderror', event)
}

const createCurrencySelectorElement = () => {
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
    // only allows a single Currency Selector element per checkout instance.
    currencySelectorElement.value =
      checkout.getCurrencySelectorElement() ?? checkout.createCurrencySelectorElement()

    // Set up event listeners (named handlers, removed in onUnmounted).
    currencySelectorElement.value.on('ready', handleReady)
    currencySelectorElement.value.on('focus', handleFocus)
    currencySelectorElement.value.on('blur', handleBlur)
    currencySelectorElement.value.on('escape', handleEscape)
    currencySelectorElement.value.on('loaderror', handleLoaderError)

    // Mount the element.
    currencySelectorElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to create currency selector element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Currency selector element creation error:', errorMessage)
  }
}

onMounted(() => {
  if (checkoutInstance.checkout.value && elementRef.value && !currencySelectorElement.value) {
    createCurrencySelectorElement()
  }
})

onUnmounted(() => {
  if (currencySelectorElement.value) {
    currencySelectorElement.value.off('ready', handleReady)
    currencySelectorElement.value.off('focus', handleFocus)
    currencySelectorElement.value.off('blur', handleBlur)
    currencySelectorElement.value.off('escape', handleEscape)
    currencySelectorElement.value.off('loaderror', handleLoaderError)
    currencySelectorElement.value.destroy()
    currencySelectorElement.value = null
  }
})

// Expose element and methods for parent access.
defineExpose({
  element: currencySelectorElement,
  loading,
  error,
  focus: () => currencySelectorElement.value?.focus(),
  blur: () => currencySelectorElement.value?.blur(),
  clear: () => currencySelectorElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-currency-selector-element">
    <div
      v-if="error"
      class="vue-stripe-currency-selector-element-error"
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
      class="vue-stripe-currency-selector-element-mount"
      :class="{ 'vue-stripe-currency-selector-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-currency-selector-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading currency selector...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-currency-selector-element {
  position: relative;
}

.vue-stripe-currency-selector-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-currency-selector-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-currency-selector-element-loading {
  opacity: 0.5;
}

.vue-stripe-currency-selector-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-currency-selector-element-loader {
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
