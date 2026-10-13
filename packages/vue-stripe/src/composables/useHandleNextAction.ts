import { ref, readonly } from 'vue-demi'
import type { UseHandleNextActionReturn, HandleNextActionOptions } from '../types'
import { injectStripe, whenStripeLoaded } from '../utils/inject-stripe'

/**
 * Composable for invoking the next action (e.g. 3DS authentication) on a
 * PaymentIntent or SetupIntent without re-confirming it.
 *
 * Wraps `stripe.handleNextAction({ clientSecret })`. Useful when you confirm an
 * intent server-side and only need the client to complete required actions.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useHandleNextAction } from '@vue-stripe/vue-stripe'
 *
 * const { handleNextAction, loading, error } = useHandleNextAction()
 *
 * const finish = async (clientSecret) => {
 *   const { paymentIntent, error } = await handleNextAction({ clientSecret })
 * }
 * </script>
 * ```
 */
export function useHandleNextAction(): UseHandleNextActionReturn {
  const stripeInstance = injectStripe('useHandleNextAction')

  const loading = ref(false)
  const error = ref<string | null>(null)

  const handleNextAction = async (options: HandleNextActionOptions) => {
    const stripe = stripeInstance.stripe.value ?? (await whenStripeLoaded(stripeInstance))
    if (!stripe) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      // Two Stripe overloads: an Intent client secret, or a shared payment token's hashedValue.
      const result =
        'hashedValue' in options
          ? await stripe.handleNextAction({ hashedValue: options.hashedValue })
          : await stripe.handleNextAction({ clientSecret: options.clientSecret })

      if (result.error) {
        error.value = result.error.message || 'Failed to handle next action'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to handle next action'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = false
    }
  }

  return {
    handleNextAction,
    loading: readonly(loading),
    error: readonly(error)
  }
}
