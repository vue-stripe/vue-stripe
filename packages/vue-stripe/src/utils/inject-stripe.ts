import { inject, watch } from 'vue-demi'
import type { Stripe } from '@stripe/stripe-js'
import { stripeInjectionKey, type StripeInstance } from './injection-keys'
import { VueStripeProviderError } from './errors'

/**
 * Injects the Stripe context of `<VueStripeProvider>` or the `createVueStripe()`
 * plugin for `consumer` (a composable or component name). Throws
 * `VueStripeProviderError` naming both ways to provide it when there is none.
 * Reading the context starts the plugin's lazy Stripe.js load, so it runs while
 * the component renders rather than on the first method call.
 */
export function injectStripe(consumer: string): StripeInstance {
  // The default keeps Vue from warning "injection not found" before the typed error.
  const instance = inject(stripeInjectionKey, null)
  if (!instance) {
    const verb = consumer.startsWith('use') ? 'called' : 'used'
    throw new VueStripeProviderError(
      `${consumer} must be ${verb} within a VueStripeProvider component or an app using createVueStripe()`
    )
  }
  void instance.stripe
  return instance
}

/**
 * Resolves with the Stripe instance once a load in progress settles: right away
 * when it is loaded (always the case below `<VueStripeProvider>`, which renders its
 * children after the load), and `null` when the load failed or cannot run (server).
 */
export function whenStripeLoaded(instance: StripeInstance): Promise<Stripe | null> {
  const current = instance.stripe.value
  if (current || !instance.loading.value || typeof window === 'undefined') {
    return Promise.resolve(current)
  }
  return new Promise((resolve) => {
    const stop = watch(
      () => [instance.stripe.value, instance.loading.value] as const,
      ([stripe, loading]) => {
        if (!stripe && loading) return
        stop()
        resolve(stripe)
      }
    )
  })
}
