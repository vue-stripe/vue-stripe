<script setup lang="ts">
import { provide, ref, onMounted } from 'vue-demi'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { stripeInjectionKey } from '../utils/injection-keys'
import { StripeProviderError } from '../utils/errors'

interface Props {
  publishableKey?: string
  stripeKey?: string
  stripeAccount?: string
  apiVersion?: string
  locale?: string
  options?: {
    stripeAccount?: string
    apiVersion?: string
    locale?: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  load: [stripe: Stripe]
  error: [error: Error]
}>()

const stripe = ref<Stripe | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Support both publishableKey and stripeKey for backwards compatibility
const key = props.publishableKey || props.stripeKey
if (!key) {
  throw new StripeProviderError('publishableKey or stripeKey is required')
}

const config: Record<string, string | undefined> = {
  publishableKey: key,
  stripeAccount: props.stripeAccount || props.options?.stripeAccount,
  apiVersion: props.apiVersion || props.options?.apiVersion,
  locale: props.locale || props.options?.locale
}

const initialize = async () => {
  try {
    loading.value = true
    error.value = null

    // Build options object, only including defined values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {}
    const stripeAccount = props.stripeAccount || props.options?.stripeAccount
    const apiVersion = props.apiVersion || props.options?.apiVersion
    const locale = props.locale || props.options?.locale

    if (stripeAccount) options.stripeAccount = stripeAccount
    if (apiVersion) options.apiVersion = apiVersion
    if (locale) options.locale = locale

    stripe.value = await loadStripe(key, options)

    if (!stripe.value) {
      throw new StripeProviderError('Failed to initialize Stripe')
    }
    
    emit('load', stripe.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load Stripe'
    error.value = errorMessage
    console.error('[Vue Stripe] Initialization error:', errorMessage)
    emit('error', err instanceof Error ? err : new Error(errorMessage))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initialize()
})

// Provide configuration for child components
provide('vue-stripe-config', config)
provide(stripeInjectionKey, {
  stripe,
  loading,
  error
})
</script>

<template>
  <div
    v-if="error"
    class="vue-stripe-error"
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
    class="vue-stripe-loading"
  >
    <slot name="loading">
      <div class="vue-stripe-loading-message">
        Loading Stripe...
      </div>
    </slot>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<style scoped>
.vue-stripe-error {
  color: #dc3545;
  padding: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
}

.vue-stripe-loading {
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