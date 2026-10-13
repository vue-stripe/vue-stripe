import { computed, inject, readonly } from 'vue-demi'
import type { StripeElement, StripeElements } from '@stripe/stripe-js'
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

  /**
   * Re-fetches the Elements' data from Stripe after the Intent or Checkout Session
   * was updated on your server (e.g. the amount changed).
   */
  const fetchUpdates = async () => {
    if (!elementsContext.elements.value) {
      return { error: { message: 'Elements not initialized' } }
    }
    return elementsContext.elements.value.fetchUpdates()
  }

  /**
   * Looks up the element of a type created on this Elements group (`elements.getElement()`).
   * Returns `null` when there is none, or before the group exists.
   */
  const getElement = ((elementType: string, options?: unknown) => {
    const group = elementsContext.elements.value
    if (!group) return null
    // One implementation for all of Stripe's per-type overloads.
    const lookup = group.getElement.bind(group) as (
      type: string,
      opts?: unknown
    ) => StripeElement | null
    return lookup(elementType, options)
  }) as StripeElements['getElement']

  return {
    // computed, not readonly(): Vue 2.7's readonly() copies plain objects, so Stripe's
    // objects would reach callers as copies (identity lost, methods run on the copy).
    elements: computed(() => elementsContext.elements.value),
    submit,
    fetchUpdates,
    getElement,
    loading: readonly(elementsContext.loading),
    error: readonly(elementsContext.error)
  }
}
