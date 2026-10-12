<script setup lang="ts">
import { provide, ref, shallowRef, inject, watch, onUnmounted, markRaw } from 'vue-demi'
import type {
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession
} from '@stripe/stripe-js'
import { stripeInjectionKey, stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

interface Props {
  /**
   * Client secret of a Checkout Session created with `ui_mode: 'elements'`,
   * or a Promise resolving to it (passed to Stripe untouched).
   */
  clientSecret?: string | Promise<string> | undefined
  /** Alternative to `clientSecret`: a function returning the client secret (v5 compatible). */
  fetchClientSecret?: (() => Promise<string>) | undefined
  /** Appearance, fonts, loader, saved payment methods and address sync for the Checkout elements. */
  elementsOptions?: StripeCheckoutElementsOptions | undefined
  /** Adaptive Pricing (`{ allowed: boolean }`). */
  adaptivePricing?: StripeCheckoutElementsSdkOptions['adaptivePricing'] | undefined
  /** Prefill email, phone number and addresses. */
  defaultValues?: StripeCheckoutElementsSdkOptions['defaultValues'] | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  ready: [actions: StripeCheckoutLoadActionsSuccess]
  change: [session: StripeCheckoutSession]
  error: [error: string]
}>()

const stripeInstance = inject(stripeInjectionKey)

if (!stripeInstance) {
  throw new VueStripeProviderError(
    'VueStripeCheckoutElementsProvider must be used within VueStripeProvider'
  )
}

// Stripe objects are never made deeply reactive.
const checkout = shallowRef<StripeCheckoutElementsSdk | null>(null)
const actions = shallowRef<StripeCheckoutLoadActionsSuccess | null>(null)
const session = shallowRef<StripeCheckoutSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

let started = false
// Stripe has no way to detach the `change` subscription; this lets late
// callbacks (and an in-flight loadActions) bail out after teardown.
let unmounted = false

const fail = (message: string) => {
  error.value = message
  loading.value = false
  console.error('[Vue Stripe] Checkout init error:', message)
  emit('error', message)
}

const start = () => {
  const stripe = stripeInstance.stripe.value
  if (started || !stripe) return

  const clientSecret = props.fetchClientSecret ? props.fetchClientSecret() : props.clientSecret
  if (!clientSecret) {
    fail(
      'VueStripeCheckoutElementsProvider requires a `clientSecret` (string or Promise) or `fetchClientSecret` prop'
    )
    return
  }

  started = true
  try {
    const options: StripeCheckoutElementsSdkOptions = { clientSecret }
    if (props.elementsOptions) options.elementsOptions = props.elementsOptions
    if (props.adaptivePricing) options.adaptivePricing = props.adaptivePricing
    if (props.defaultValues) options.defaultValues = props.defaultValues

    // Synchronous since Stripe.js Clover; children can mount elements right away.
    const sdk = stripe.initCheckoutElementsSdk(options)
    checkout.value = markRaw(sdk)

    sdk.on('change', (next) => {
      if (unmounted) return
      session.value = markRaw(next)
      emit('change', next)
    })

    void sdk.loadActions().then((result) => {
      if (unmounted) return
      if (result.type === 'error') {
        fail(result.error.message)
        return
      }
      actions.value = markRaw(result.actions)
      session.value = markRaw(result.actions.getSession())
      loading.value = false
      emit('ready', result.actions)
    })
  } catch (err) {
    started = false
    checkout.value = null
    fail(err instanceof Error ? err.message : 'Failed to initialize Checkout')
  }
}

watch(
  () => stripeInstance.stripe.value,
  (s) => {
    if (s) start()
  },
  { immediate: true }
)

onUnmounted(() => {
  unmounted = true
  checkout.value = null
  actions.value = null
  session.value = null
  started = false
})

provide(stripeCheckoutInjectionKey, { checkout, actions, session, loading, error })
</script>

<template>
  <div v-if="error" class="vue-stripe-checkout-error">
    <slot name="error" :error="error">
      <div class="vue-stripe-error-message">
        {{ error }}
      </div>
    </slot>
  </div>
  <div v-else-if="!checkout" class="vue-stripe-checkout-loading">
    <slot name="loading">
      <div class="vue-stripe-loading-message">Initializing Checkout...</div>
    </slot>
  </div>
  <div v-else>
    <slot :checkout="checkout" :actions="actions" :session="session" :loading="loading" />
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
