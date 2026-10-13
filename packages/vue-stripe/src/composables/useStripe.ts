import { computed, readonly } from 'vue-demi'
import type { UseStripeReturn } from '../types'
import { injectStripe } from '../utils/inject-stripe'

/**
 * Composable to access the Stripe instance
 * Must be used within a VueStripeProvider component or an app using createVueStripe()
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useStripe } from '@vue-stripe/vue-stripe'
 *
 * const { stripe, loading, error } = useStripe()
 *
 * // For Stripe.js calls without a Vue Stripe composable, e.g. on a return page:
 * const checkStatus = async (clientSecret: string) => {
 *   if (!stripe.value) return
 *   const { paymentIntent } = await stripe.value.retrievePaymentIntent(clientSecret)
 *   return paymentIntent?.status
 * }
 * </script>
 * ```
 */
export function useStripe(): UseStripeReturn {
  const stripeInstance = injectStripe('useStripe')

  return {
    // computed, not readonly(): Vue 2.7's readonly() copies plain objects, so Stripe's
    // objects would reach callers as copies (identity lost, methods run on the copy).
    stripe: computed(() => stripeInstance.stripe.value),
    loading: readonly(stripeInstance.loading),
    error: readonly(stripeInstance.error),
    initialize: async () => {
      // Initialization is handled by the provider
      // This is here for API consistency
    }
  }
}
