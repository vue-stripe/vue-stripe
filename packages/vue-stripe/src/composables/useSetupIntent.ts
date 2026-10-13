import { inject, ref, readonly } from 'vue-demi'
import type { ConfirmSetupData } from '@stripe/stripe-js'
import type { UseSetupIntentReturn, ConfirmSetupOptions } from '../types'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { injectStripe, whenStripeLoaded } from '../utils/inject-stripe'

// `ConfirmSetupOptions` is defined once in ../types and re-exported there.

/**
 * Composable for handling setup intents
 * Provides a convenient way to save payment methods for future use
 *
 * @example
 * ```vue
 * <script setup>
 * import { useSetupIntent } from '@vue-stripe/vue-stripe'
 *
 * const { confirmSetup, loading, error } = useSetupIntent()
 *
 * const handleSaveCard = async () => {
 *   const result = await confirmSetup({
 *     clientSecret: setupIntent.clientSecret,
 *     confirmParams: {
 *       return_url: 'https://example.com/account/cards',
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
export function useSetupIntent(): UseSetupIntentReturn {
  const stripeInstance = injectStripe('useSetupIntent')
  const elementsInstance = inject(stripeElementsInjectionKey, null)

  // Overlapping calls: stay loading until the last one settles.
  const loading = ref(false)
  let pending = 0
  const error = ref<string | null>(null)

  const confirmSetup = async (options: ConfirmSetupOptions) => {
    const stripe = stripeInstance.stripe.value ?? (await whenStripeLoaded(stripeInstance))
    if (!stripe) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    pending++
    loading.value = true
    error.value = null

    try {
      // Use provided elements or fallback to injected elements
      const elements = options.elements ?? elementsInstance?.elements.value

      // Call elements.submit() first to trigger form validation and wallet collection
      // This is required by Stripe before calling confirmSetup
      // See: https://docs.stripe.com/payments/payment-element/migration
      if (elements && !options.skipSubmit) {
        const { error: submitError } = await elements.submit()
        if (submitError) {
          error.value = submitError.message || 'Form validation failed'
          return { error: submitError }
        }
      }

      const base = { clientSecret: options.clientSecret, ...(elements ? { elements } : {}) }
      // Stripe types `redirect: 'always'` and `'if_required'` as separate overloads.
      // 'always' requires confirmParams.return_url; Stripe reports it if missing.
      const result =
        options.redirect === 'always'
          ? await stripe.confirmSetup({
              ...base,
              confirmParams: (options.confirmParams ?? {}) as ConfirmSetupData,
              redirect: 'always'
            })
          : await stripe.confirmSetup({
              ...base,
              confirmParams: options.confirmParams ?? {},
              redirect: 'if_required'
            })

      if (result.error) {
        error.value = result.error.message || 'Setup confirmation failed'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Setup confirmation failed'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = --pending > 0
    }
  }

  const retrieveSetupIntent = async (clientSecret: string) => {
    const stripe = stripeInstance.stripe.value ?? (await whenStripeLoaded(stripeInstance))
    if (!stripe) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    pending++
    loading.value = true
    error.value = null

    try {
      const result = await stripe.retrieveSetupIntent(clientSecret)
      if (result.error) {
        error.value = result.error.message || 'Failed to retrieve setup intent'
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve setup intent'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = --pending > 0
    }
  }

  return {
    confirmSetup,
    retrieveSetupIntent,
    loading: readonly(loading),
    error: readonly(error)
  }
}
