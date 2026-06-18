<script setup lang="ts">
import { provide, ref, inject, watch, onMounted, nextTick, markRaw } from 'vue-demi'
import type {
  StripeCheckout,
  StripeCheckoutSession,
  StripeCheckoutOptions,
  StripeCheckoutElementsOptions
} from '@stripe/stripe-js'
import { stripeInjectionKey, stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

interface Props {
  /**
   * Client secret of a Checkout Session created with `ui_mode: 'custom'`.
   * Provide this OR `fetchClientSecret`.
   */
  clientSecret?: string | undefined
  /**
   * Async function that resolves to the Checkout Session client secret.
   * Preferred for refreshable sessions; takes precedence over `clientSecret`.
   */
  fetchClientSecret?: (() => Promise<string>) | undefined
  /**
   * Appearance / fonts options forwarded to the Checkout Elements
   * (`stripe.initCheckout({ elementsOptions })`).
   */
  elementsOptions?: Record<string, unknown> | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  ready: [checkout: StripeCheckout]
  error: [error: string]
}>()

const stripeInstance = inject(stripeInjectionKey)

if (!stripeInstance) {
  throw new VueStripeProviderError(
    'VueStripeCheckoutProvider must be used within VueStripeProvider'
  )
}

const checkout = ref<StripeCheckout | null>(null)
const session = ref<StripeCheckoutSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Guard so initCheckout() only runs once even though it is reachable from both
// the stripe-ready watcher and onMounted.
let started = false

const initCheckout = async () => {
  if (started || !stripeInstance.stripe.value) return

  // Resolve the client-secret source. The GA API only accepts a
  // `fetchClientSecret` function, so wrap a raw clientSecret when given.
  const fetchClientSecret =
    props.fetchClientSecret ??
    (props.clientSecret ? () => Promise.resolve(props.clientSecret as string) : null)

  if (!fetchClientSecret) {
    error.value =
      'VueStripeCheckoutProvider requires a `clientSecret` or `fetchClientSecret` prop'
    loading.value = false
    return
  }

  const stripe = stripeInstance.stripe.value
  if (!stripe) return

  started = true

  try {
    loading.value = true
    error.value = null

    const options: StripeCheckoutOptions = { fetchClientSecret }
    if (props.elementsOptions) {
      options.elementsOptions = props.elementsOptions as StripeCheckoutElementsOptions
    }

    const instance = await stripe.initCheckout(options)

    // Don't let Vue proxy the external Stripe instance — keep it raw.
    checkout.value = markRaw(instance)
    session.value = instance.session()

    // Keep the reactive session in sync with Stripe's internal state.
    instance.on('change', (next) => {
      session.value = next
    })

    loading.value = false
    nextTick(() => emit('ready', instance))
  } catch (err) {
    started = false
    const message = err instanceof Error ? err.message : 'Failed to initialize Checkout'
    error.value = message
    loading.value = false
    console.error('[Vue Stripe] Checkout init error:', message)
    emit('error', message)
  }
}

// Initialize as soon as the Stripe instance is available.
watch(
  () => stripeInstance.stripe.value,
  (s) => {
    if (s) initCheckout()
  },
  { immediate: true }
)

onMounted(() => {
  if (stripeInstance.stripe.value) initCheckout()
})

// Provide the checkout context for child components / useCheckoutSession.
provide(stripeCheckoutInjectionKey, {
  checkout,
  session,
  loading,
  error
})
</script>

<template>
  <div
    v-if="error"
    class="vue-stripe-checkout-error"
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
    class="vue-stripe-checkout-loading"
  >
    <slot name="loading">
      <div class="vue-stripe-loading-message">
        Initializing Checkout...
      </div>
    </slot>
  </div>
  <div v-else>
    <slot
      :checkout="checkout"
      :session="session"
    />
  </div>
</template>

<style scoped>
.vue-stripe-checkout-error {
  color: #dc3545;
  padding: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
}

.vue-stripe-checkout-loading {
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
