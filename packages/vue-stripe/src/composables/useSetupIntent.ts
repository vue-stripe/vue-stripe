import { inject, ref, readonly } from 'vue-demi'
import type { ConfirmCardSetupData } from '@stripe/stripe-js'
import type { UseSetupIntentReturn } from '../types'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeProviderError } from '../utils/errors'

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
    throw new StripeProviderError(
      'useSetupIntent must be called within a StripeProvider component'
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const confirmSetup = async (data: ConfirmCardSetupData & { clientSecret: string }) => {
    if (!stripeInstance.stripe.value) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    const { clientSecret, ...confirmData } = data

    loading.value = true
    error.value = null

    try {
      // If elements are available, use them
      const setupData: ConfirmCardSetupData = {
        ...confirmData,
        ...(elementsInstance?.elements.value && { elements: elementsInstance.elements.value })
      }

      const result = await stripeInstance.stripe.value.confirmCardSetup(clientSecret, setupData)
      
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