import { computed, readonly, ref, shallowRef } from 'vue-demi'
import type { InitializePricingOptions, Pricing } from '@stripe/stripe-js'
import type { UsePricingReturn } from '../types'
import { injectStripe, whenStripeLoaded } from '../utils/inject-stripe'

/** Explicitly initializes Stripe's beta Pricing SDK. Requires beta access. */
export function usePricing(): UsePricingReturn {
  const stripeInstance = injectStripe('usePricing')
  const pricing = shallowRef<Pricing | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let pending: Promise<Pricing | null> | null = null

  const initializePricing = (options: InitializePricingOptions): Promise<Pricing | null> => {
    // One initialization at a time: concurrent callers share the first options.
    if (pending) return pending
    pricing.value = null
    loading.value = true
    error.value = null
    pending = (async () => {
      try {
        const stripe = await whenStripeLoaded(stripeInstance)
        if (!stripe) {
          error.value = 'Stripe not initialized'
          return null
        }
        pricing.value = await stripe.initializePricing(options)
        return pricing.value
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to initialize pricing'
        return null
      } finally {
        loading.value = false
        pending = null
      }
    })()
    return pending
  }

  return {
    // readonly() copies plain SDK objects on Vue 2.7; computed preserves identity.
    pricing: computed(() => pricing.value),
    initializePricing,
    loading: readonly(loading),
    error: readonly(error)
  }
}
