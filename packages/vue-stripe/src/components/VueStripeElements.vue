<script setup lang="ts">
import { provide, ref, inject, watch, onMounted, nextTick } from 'vue-demi'
import type { StripeElements } from '@stripe/stripe-js'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

// Use a looser type for additional options since Stripe has multiple option shapes
type ElementsOptions = Record<string, any>

interface Emits {
  (e: 'ready', elements: StripeElements): void
  (e: 'error', error: string): void
}

const emit = defineEmits<Emits>()

/**
 * Mode for Payment Element - determines the type of intent
 * - 'payment': For PaymentIntent (one-time payments)
 * - 'setup': For SetupIntent (saving payment methods for future use)
 * - 'subscription': For Subscription billing
 */
type ElementsMode = 'payment' | 'setup' | 'subscription'

/**
 * Indicates intent to save payment method for future use
 * - 'off_session': Save for off-session payments (e.g., recurring charges)
 * - 'on_session': Save for on-session payments (customer present)
 */
type SetupFutureUsage = 'off_session' | 'on_session'

/**
 * Controls when to capture funds from customer's account
 * - 'automatic': Capture automatically after authorization
 * - 'automatic_async': Capture automatically with async processing
 * - 'manual': Capture manually via API call
 */
type CaptureMethod = 'automatic' | 'automatic_async' | 'manual'

interface Props {
  /**
   * Client secret from PaymentIntent or SetupIntent.
   * When provided, Elements will use the intent-based flow.
   * When omitted, use mode/currency/amount for deferred intent creation.
   */
  clientSecret?: string | undefined
  /**
   * Mode for deferred intent creation (without clientSecret).
   * Required when clientSecret is not provided.
   * - 'payment': One-time payment
   * - 'setup': Save payment method for future
   * - 'subscription': Recurring billing
   */
  mode?: ElementsMode | undefined
  /**
   * Currency code (e.g., 'usd', 'eur') for deferred intent creation.
   * Required when using mode without clientSecret.
   */
  currency?: string | undefined
  /**
   * Amount in smallest currency unit (e.g., cents for USD).
   * Required for 'payment' and 'subscription' modes.
   * Shown in Apple Pay, Google Pay, and BNPL UIs.
   */
  amount?: number | undefined
  /**
   * Indicates intent to save payment method for future use.
   * When set, displays additional input fields and mandates as needed.
   */
  setupFutureUsage?: SetupFutureUsage | undefined
  /**
   * Controls when to capture funds from customer's account.
   */
  captureMethod?: CaptureMethod | undefined
  /**
   * List of payment method types to display.
   * Omit to use Dashboard payment method settings.
   */
  paymentMethodTypes?: string[] | undefined
  /**
   * Additional options passed to stripe.elements().
   * See Stripe documentation for all available options.
   */
  options?: ElementsOptions | undefined
}

const props = defineProps<Props>()

const stripeInstance = inject(stripeInjectionKey)

if (!stripeInstance) {
  throw new VueStripeProviderError(
    'VueStripeElements must be used within VueStripeProvider'
  )
}

const elements = ref<StripeElements | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const createElements = () => {
  if (!stripeInstance.stripe.value) {
    error.value = 'Stripe instance not available'
    loading.value = false
    return
  }

  try {
    error.value = null
    loading.value = true

    // Build options object from explicit props and additional options
    const elementsOptions: ElementsOptions = {
      ...props.options
    }

    // Intent-based flow: use clientSecret
    if (props.clientSecret) {
      elementsOptions['clientSecret'] = props.clientSecret
    }

    // Deferred intent flow: use mode, currency, amount
    // See: https://docs.stripe.com/payments/payment-element/migration
    if (props.mode) {
      elementsOptions['mode'] = props.mode
    }
    if (props.currency) {
      elementsOptions['currency'] = props.currency
    }
    if (props.amount !== undefined) {
      elementsOptions['amount'] = props.amount
    }

    // Optional configuration
    if (props.setupFutureUsage) {
      elementsOptions['setupFutureUsage'] = props.setupFutureUsage
    }
    if (props.captureMethod) {
      elementsOptions['captureMethod'] = props.captureMethod
    }
    if (props.paymentMethodTypes) {
      elementsOptions['paymentMethodTypes'] = props.paymentMethodTypes
    }

    // Use type assertion since Stripe has complex overloads
    elements.value = (stripeInstance.stripe.value as any).elements(elementsOptions)
    loading.value = false

    // Emit ready event after Vue updates the DOM
    nextTick(() => {
      emit('ready', elements.value!)
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create elements'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Elements creation error:', errorMessage)
    emit('error', errorMessage)
  }
}

// Watch for Stripe instance to become available
watch(
  () => stripeInstance.stripe.value,
  (newStripe) => {
    if (newStripe && !elements.value) {
      createElements()
    }
  },
  { immediate: true }
)

// Watch for clientSecret changes
watch(
  () => props.clientSecret,
  () => {
    if (stripeInstance.stripe.value) {
      createElements()
    }
  }
)

// Watch for deferred intent props changes (mode, currency, amount)
watch(
  () => [props.mode, props.currency, props.amount, props.setupFutureUsage],
  () => {
    if (stripeInstance.stripe.value) {
      createElements()
    }
  }
)

onMounted(() => {
  if (stripeInstance.stripe.value && !elements.value) {
    createElements()
  }
})

// Provide elements context for child components
provide(stripeElementsInjectionKey, {
  elements,
  loading,
  error
})
</script>

<template>
  <div
    v-if="error"
    class="vue-stripe-elements-error"
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
    v-else-if="loading"
    class="vue-stripe-elements-loading"
  >
    <slot name="loading">
      <div class="vue-stripe-loading-message">
        Initializing Elements...
      </div>
    </slot>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<style scoped>
.vue-stripe-elements-error {
  color: #dc3545;
  padding: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
}

.vue-stripe-elements-loading {
  color: #6c757d;
  padding: 1rem;
  text-align: center;
}

.vue-stripe-error-message,
.vue-stripe-loading-message {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>