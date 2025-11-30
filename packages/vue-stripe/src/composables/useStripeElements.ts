import { inject, readonly } from 'vue-demi'
import type { UseStripeElementsReturn } from '../types'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

/**
 * Composable for accessing Stripe Elements instance
 * Must be used within VueStripeElements component
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStripeElements } from '@vue-stripe/vue-stripe'
 *
 * const { elements, submit, loading, error } = useStripeElements()
 *
 * const handleSubmit = async () => {
 *   // Trigger form validation and wallet collection
 *   const { error: submitError } = await submit()
 *   if (submitError) {
 *     console.error(submitError)
 *     return
 *   }
 *   // Proceed with payment confirmation...
 * }
 * </script>
 * ```
 */
export function useStripeElements(): UseStripeElementsReturn {
  const elementsContext = inject(stripeElementsInjectionKey)

  if (!elementsContext) {
    throw new VueStripeElementsError(
      'Elements context not found. Make sure to wrap your component with VueStripeElements.'
    )
  }

  /**
   * Triggers form validation and collects data required for wallets (Apple Pay, Google Pay).
   * This should be called before confirmPayment/confirmSetup.
   * Note: usePaymentIntent and useSetupIntent call this automatically unless skipSubmit is true.
   *
   * @returns Promise with error if validation fails, or empty object on success
   */
  const submit = async () => {
    if (!elementsContext.elements.value) {
      return { error: { message: 'Elements not initialized' } }
    }
    return elementsContext.elements.value.submit()
  }

  return {
    elements: readonly(elementsContext.elements),
    submit,
    loading: readonly(elementsContext.loading),
    error: readonly(elementsContext.error)
  }
}
