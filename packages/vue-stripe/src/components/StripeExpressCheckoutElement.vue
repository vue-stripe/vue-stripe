<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeExpressCheckoutElement as StripeExpressCheckoutElementType,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeExpressCheckoutElementOptions
}

interface ShippingAddressChangeEvent {
  address: {
    city?: string
    country: string
    line1?: string
    line2?: string
    postal_code?: string
    state?: string
  }
  name?: string
}

interface ShippingRateChangeEvent {
  shippingRate: {
    id: string
    amount: number
    displayName: string
  }
}

interface Emits {
  (e: 'ready', event: StripeExpressCheckoutElementReadyEvent): void
  (e: 'click', event: StripeExpressCheckoutElementClickEvent): void
  (e: 'confirm', event: StripeExpressCheckoutElementConfirmEvent): void
  (e: 'cancel'): void
  (e: 'shippingaddresschange', event: ShippingAddressChangeEvent): void
  (e: 'shippingratechange', event: ShippingRateChangeEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const expressCheckoutElement = ref<StripeExpressCheckoutElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new StripeElementsError(
    'StripeExpressCheckoutElement must be used within StripeElements'
  )
}

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

    // Set up event listeners
    expressCheckoutElement.value.on('ready', (event) => {
      loading.value = false
      emit('ready', event)
    })

    expressCheckoutElement.value.on('click', (event) => {
      emit('click', event)
    })

    expressCheckoutElement.value.on('confirm', (event) => {
      emit('confirm', event)
    })

    expressCheckoutElement.value.on('cancel', () => {
      emit('cancel')
    })

    expressCheckoutElement.value.on('shippingaddresschange', (event) => {
      emit('shippingaddresschange', event)
    })

    expressCheckoutElement.value.on('shippingratechange', (event) => {
      emit('shippingratechange', event)
    })

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
    expressCheckoutElement.value.destroy()
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