import { inject, ref, readonly } from 'vue-demi'
import type { UseHandleNextActionReturn, HandleNextActionOptions } from '../types'
import { stripeInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

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
  const stripeInstance = inject(stripeInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      'useHandleNextAction must be called within a VueStripeProvider component'
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const handleNextAction = async (options: HandleNextActionOptions) => {
    if (!stripeInstance.stripe.value) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      const result = await (stripeInstance.stripe.value as any).handleNextAction({
        clientSecret: options.clientSecret
      })

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
