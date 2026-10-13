import { ref, readonly } from 'vue-demi'
import type { UseIdentityReturn, VerifyIdentityResult } from '../types'
import { injectStripe, whenStripeLoaded } from '../utils/inject-stripe'

/**
 * Composable for Stripe Identity verification.
 *
 * Wraps `stripe.verifyIdentity(clientSecret)`, which opens Stripe's Identity modal
 * for a VerificationSession created on your server and resolves when the customer
 * submits or closes it.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useIdentity } from '@vue-stripe/vue-stripe'
 *
 * const { verifyIdentity, loading, error } = useIdentity()
 *
 * const verify = async (clientSecret) => {
 *   const { verificationSession, error } = await verifyIdentity(clientSecret)
 * }
 * </script>
 * ```
 */
export function useIdentity(): UseIdentityReturn {
  const stripeInstance = injectStripe('useIdentity')

  const loading = ref(false)
  const error = ref<string | null>(null)

  const verifyIdentity = async (clientSecret: string): Promise<VerifyIdentityResult> => {
    const stripe = stripeInstance.stripe.value ?? (await whenStripeLoaded(stripeInstance))
    if (!stripe) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      const result = await stripe.verifyIdentity(clientSecret)

      if (result.error) {
        error.value = result.error.message || 'Failed to verify identity'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify identity'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = false
    }
  }

  return {
    verifyIdentity,
    loading: readonly(loading),
    error: readonly(error)
  }
}
