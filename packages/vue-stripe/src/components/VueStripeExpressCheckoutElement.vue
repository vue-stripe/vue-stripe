<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeExpressCheckoutElement as StripeExpressCheckoutElementType,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
  StripeError
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeExpressCheckoutElementOptions
}

interface Emits {
  (e: 'ready', event: StripeExpressCheckoutElementReadyEvent): void
  (e: 'click', event: StripeExpressCheckoutElementClickEvent): void
  (e: 'confirm', event: StripeExpressCheckoutElementConfirmEvent): void
  (e: 'cancel'): void
  // Use Stripe's official event types so consumers receive the resolve()/reject()
  // callbacks required to update shipping options/rates (previously dropped by
  // hand-rolled data-only interfaces).
  (e: 'shippingaddresschange', event: StripeExpressCheckoutElementShippingAddressChangeEvent): void
  (e: 'shippingratechange', event: StripeExpressCheckoutElementShippingRateChangeEvent): void
  (e: 'loaderror', event: { elementType: 'expressCheckout'; error: StripeError }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const expressCheckoutElement = ref<StripeExpressCheckoutElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeExpressCheckoutElement must be used within VueStripeElements'
  )
}

// Named handlers so listeners can be detached with .off() on teardown.
const handleReady = (event: StripeExpressCheckoutElementReadyEvent) => {
  loading.value = false
  emit('ready', event)
}
const handleClick = (event: StripeExpressCheckoutElementClickEvent) => emit('click', event)
const handleConfirm = (event: StripeExpressCheckoutElementConfirmEvent) => emit('confirm', event)
const handleCancel = () => emit('cancel')
const handleShippingAddressChange = (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => emit('shippingaddresschange', event)
const handleShippingRateChange = (event: StripeExpressCheckoutElementShippingRateChangeEvent) => emit('shippingratechange', event)
const handleLoaderError = (event: { elementType: 'expressCheckout'; error: StripeError }) => emit('loaderror', event)

const createExpressCheckoutElement = () => {
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

    // Create express checkout element
    expressCheckoutElement.value = elementsInstance.elements.value.create('expressCheckout', props.options)

    // Set up event listeners (named handlers, removed in onUnmounted)
    expressCheckoutElement.value.on('ready', handleReady)
    expressCheckoutElement.value.on('click', handleClick)
    expressCheckoutElement.value.on('confirm', handleConfirm)
    expressCheckoutElement.value.on('cancel', handleCancel)
    expressCheckoutElement.value.on('shippingaddresschange', handleShippingAddressChange)
    expressCheckoutElement.value.on('shippingratechange', handleShippingRateChange)
    expressCheckoutElement.value.on('loaderror', handleLoaderError)

    // Mount the element
    expressCheckoutElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create express checkout element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Express checkout element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (expressCheckoutElement.value && newOptions) {
      expressCheckoutElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !expressCheckoutElement.value) {
      createExpressCheckoutElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !expressCheckoutElement.value) {
    createExpressCheckoutElement()
  }
})

onUnmounted(() => {
  if (expressCheckoutElement.value) {
    expressCheckoutElement.value.off('ready', handleReady)
    expressCheckoutElement.value.off('click', handleClick)
    expressCheckoutElement.value.off('confirm', handleConfirm)
    expressCheckoutElement.value.off('cancel', handleCancel)
    expressCheckoutElement.value.off('shippingaddresschange', handleShippingAddressChange)
    expressCheckoutElement.value.off('shippingratechange', handleShippingRateChange)
    expressCheckoutElement.value.off('loaderror', handleLoaderError)
    expressCheckoutElement.value.destroy()
    expressCheckoutElement.value = null
  }
})

// Expose element for parent access
defineExpose({
  element: expressCheckoutElement,
  loading,
  error
})
</script>

<template>
  <div class="vue-stripe-express-checkout-element">
    <div
      v-if="error"
      class="vue-stripe-express-checkout-element-error"
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
      class="vue-stripe-express-checkout-element-mount"
      :class="{ 'vue-stripe-express-checkout-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-express-checkout-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading express checkout...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-express-checkout-element {
  position: relative;
}

.vue-stripe-express-checkout-element-mount {
  min-height: 60px;
  transition: opacity 0.3s ease;
}

.vue-stripe-express-checkout-element-loading {
  opacity: 0.5;
}

.vue-stripe-express-checkout-element-error {
  color: #dc3545;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
  font-size: 0.875rem;
}

.vue-stripe-express-checkout-element-loader {
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