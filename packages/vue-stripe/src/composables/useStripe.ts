import { computed, inject, readonly } from 'vue-demi'
import type { UseStripeReturn } from '../types'
import { stripeInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

/**
 * Composable to access the Stripe instance
 * Must be used within a VueStripeProvider component or an app using createVueStripe()
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStripe } from '@vue-stripe/vue-stripe'
 *
 * const { stripe, loading, error } = useStripe()
 *
 * const handlePayment = async () => {
 *   if (!stripe.value) return
 *
 *   const result = await stripe.value.confirmPayment({
 *     elements,
 *     confirmParams: {
 *       return_url: 'https://example.com/checkout/complete',
 *     },
 *   })
 * }
 * </script>
 * ```
 */
export function useStripe(): UseStripeReturn {
  const stripeInstance = inject(stripeInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      'useStripe must be called within a VueStripeProvider component or an app using createVueStripe()'
    )
  }

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
