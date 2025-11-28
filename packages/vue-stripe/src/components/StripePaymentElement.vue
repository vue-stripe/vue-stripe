<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripePaymentElement as StripePaymentElementType,
  StripePaymentElementOptions,
  StripePaymentElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeElementsError } from '../utils/errors'

// Extended interface for Payment Element with loader events - uses standalone interface
// since TypeScript has issues extending the complex Stripe type
interface StripePaymentElementWithLoaderEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventType: string, handler: (...args: any[]) => void): void
}

interface Props {
  options?: StripePaymentElementOptions
}

interface Emits {
  (e: 'ready', element: StripePaymentElementType): void
  (e: 'change', event: StripePaymentElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
  (e: 'loaderstart'): void
  (e: 'loaderstop'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const paymentElement = ref<StripePaymentElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new StripeElementsError(
    'StripePaymentElement must be used within StripeElements'
  )
}

const createPaymentElement = () => {
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

    // Create payment element
    paymentElement.value = elementsInstance.elements.value.create('payment', props.options)

    // Set up event listeners
    paymentElement.value.on('ready', () => {
      loading.value = false
      emit('ready', paymentElement.value!)
    })

    paymentElement.value.on('change', (event) => {
      emit('change', event)
    })

    paymentElement.value.on('focus', () => {
      emit('focus')
    })

    paymentElement.value.on('blur', () => {
      emit('blur')
    })

    paymentElement.value.on('escape', () => {
      emit('escape')
    })

    const paymentElementWithLoader = paymentElement.value as unknown as StripePaymentElementWithLoaderEvents
    paymentElementWithLoader.on('loaderstart', () => {
      emit('loaderstart')
    })

    paymentElementWithLoader.on('loaderstop', () => {
      emit('loaderstop')
    })

    // Mount the element
    paymentElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create payment element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Payment element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (paymentElement.value && newOptions) {
      paymentElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !paymentElement.value) {
      createPaymentElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !paymentElement.value) {
    createPaymentElement()
  }
})

onUnmounted(() => {
  if (paymentElement.value) {
    paymentElement.value.destroy()
  }
})

// Expose element for parent access
defineExpose({
  element: paymentElement,
  loading,
  error
})
</script>

<template>
  <div class="vue-stripe-payment-element">
    <div
      v-if="error"
      class="vue-stripe-payment-element-error"
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
      class="vue-stripe-payment-element-mount"
      :class="{ 'vue-stripe-payment-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-payment-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading payment form...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-payment-element {
  position: relative;
}

.vue-stripe-payment-element-mount {
  min-height: 300px;
  transition: opacity 0.3s ease;
}

.vue-stripe-payment-element-loading {
  opacity: 0.5;
}

.vue-stripe-payment-element-error {
  color: #dc3545;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
  font-size: 0.875rem;
}

.vue-stripe-payment-element-loader {
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