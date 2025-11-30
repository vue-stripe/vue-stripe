import { inject, ref, readonly } from 'vue-demi'
import type { StripeElements } from '@stripe/stripe-js'
import type { UseSetupIntentReturn } from '../types'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

/**
 * Options for confirming a setup
 */
export interface ConfirmSetupOptions {
  /** Client secret from the SetupIntent */
  clientSecret: string
  /** Additional confirmation parameters */
  confirmParams?: {
    return_url?: string
    payment_method_data?: {
      billing_details?: {
        name?: string
        email?: string
        phone?: string
        address?: {
          line1?: string
          line2?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
        }
      }
    }
  }
  /** Whether to redirect (defaults to 'if_required') */
  redirect?: 'if_required' | 'always'
  /** Optional elements override (uses injected elements if not provided) */
  elements?: StripeElements
}

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
  const stripeInstance = inject(stripeInjectionKey)
  const elementsInstance = inject(stripeElementsInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      'useSetupIntent must be called within a VueStripeProvider component'
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const confirmSetup = async (options: ConfirmSetupOptions) => {
    if (!stripeInstance.stripe.value) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      // Use provided elements or fallback to injected elements
      const elements = options.elements ?? elementsInstance?.elements.value

      // Use stripe.confirmSetup() which works with Payment Element
       
      const result = await (stripeInstance.stripe.value as any).confirmSetup({
        elements: elements ?? undefined,
        clientSecret: options.clientSecret,
        confirmParams: options.confirmParams ?? {},
        redirect: options.redirect ?? 'if_required'
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
      loading.value = false
    }
  }

  return {
    confirmSetup,
    loading: readonly(loading),
    error: readonly(error)
  }
}