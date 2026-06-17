import { inject, ref, readonly } from 'vue-demi'
import type { UsePaymentIntentReturn, ConfirmPaymentOptions } from '../types'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

// `ConfirmPaymentOptions` is defined once in ../types and re-exported there.

/**
 * Composable for handling payment intents
 * Provides a convenient way to confirm payments
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePaymentIntent } from '@vue-stripe/vue-stripe'
 *
 * const { confirmPayment, loading, error } = usePaymentIntent()
 *
 * const handleSubmit = async () => {
 *   const result = await confirmPayment({
 *     clientSecret: 'pi_xxx_secret_xxx',
 *     confirmParams: {
 *       return_url: 'https://example.com/checkout/complete',
 *     },
 *   })
 *
 *   if (result.error) {
 *     // Handle error
 *   }
 * }
 * </script>
 * ```
 */
export function usePaymentIntent(): UsePaymentIntentReturn {
  const stripeInstance = inject(stripeInjectionKey)
  const elementsInstance = inject(stripeElementsInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      'usePaymentIntent must be called within a VueStripeProvider component'
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const confirmPayment = async (options: ConfirmPaymentOptions) => {
    if (!stripeInstance.stripe.value) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      // Use provided elements or fallback to injected elements
      const elements = options.elements ?? elementsInstance?.elements.value

      // Call elements.submit() first to trigger form validation and wallet collection
      // This is required by Stripe before calling confirmPayment
      // See: https://docs.stripe.com/payments/payment-element/migration
      if (elements && !options.skipSubmit) {
        const { error: submitError } = await elements.submit()
        if (submitError) {
          error.value = submitError.message || 'Form validation failed'
          return { error: submitError }
        }
      }

      // Use type assertion to handle complex Stripe overloads
      const result = await (stripeInstance.stripe.value as any).confirmPayment({
        elements: elements ?? undefined,
        clientSecret: options.clientSecret,
        confirmParams: options.confirmParams ?? {},
        redirect: options.redirect ?? 'if_required'
      })

      if (result.error) {
        error.value = result.error.message || 'Payment confirmation failed'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment confirmation failed'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = false
    }
  }

  return {
    confirmPayment,
    loading: readonly(loading),
    error: readonly(error)
  }
}