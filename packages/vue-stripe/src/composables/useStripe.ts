import { inject, readonly } from 'vue-demi'
import type { UseStripeReturn } from '../types'
import { stripeInjectionKey } from '../utils/injection-keys'
import { StripeProviderError } from '../utils/errors'

/**
 * Composable to access the Stripe instance
 * Must be used within a StripeProvider component
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
    throw new StripeProviderError(
      'useStripe must be called within a StripeProvider component'
    )
  }

  return {
    stripe: readonly(stripeInstance.stripe),
    loading: readonly(stripeInstance.loading),
    error: readonly(stripeInstance.error),
    initialize: async () => {
      // Initialization is handled by the provider
      // This is here for API consistency
    }
  }
}