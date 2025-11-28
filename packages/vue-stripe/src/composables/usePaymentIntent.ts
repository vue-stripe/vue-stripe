import { inject, ref, readonly } from 'vue-demi'
import type { ConfirmPaymentData, StripeElements } from '@stripe/stripe-js'
import type { UsePaymentIntentReturn } from '../types'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeProviderError } from '../utils/errors'

/**
 * Options for confirming a payment
 */
export interface ConfirmPaymentOptions {
  /** Client secret from the PaymentIntent */
  clientSecret: string
  /** Additional confirmation parameters */
  confirmParams?: ConfirmPaymentData
  /** Whether to redirect (defaults to 'if_required') */
  redirect?: 'if_required' | 'always'
  /** Optional elements override (uses injected elements if not provided) */
  elements?: StripeElements
}

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
    throw new StripeProviderError(
      'usePaymentIntent must be called within a StripeProvider component'
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

      // Use type assertion to handle complex Stripe overloads
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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