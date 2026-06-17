import { inject, ref, readonly } from 'vue-demi'
import type { UseCreatePaymentMethodReturn, CreatePaymentMethodOptions } from '../types'
import { stripeInjectionKey, stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

/**
 * Composable for creating a PaymentMethod with the raw Stripe instance.
 *
 * Wraps `stripe.createPaymentMethod()`. When called without `elements` or a
 * manual `type`, the Elements instance injected by `<VueStripeElements>` is used
 * automatically (the Payment Element flow).
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCreatePaymentMethod } from '@vue-stripe/vue-stripe'
 *
 * const { createPaymentMethod, loading, error } = useCreatePaymentMethod()
 *
 * const onSubmit = async () => {
 *   const { paymentMethod, error } = await createPaymentMethod()
 *   if (paymentMethod) console.log(paymentMethod.id)
 * }
 * </script>
 * ```
 */
export function useCreatePaymentMethod(): UseCreatePaymentMethodReturn {
  const stripeInstance = inject(stripeInjectionKey)
  const elementsInstance = inject(stripeElementsInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      'useCreatePaymentMethod must be called within a VueStripeProvider component'
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const createPaymentMethod = async (options: CreatePaymentMethodOptions = {}) => {
    if (!stripeInstance.stripe.value) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      const params: CreatePaymentMethodOptions = { ...options }
      // Default to the injected Elements instance for the Payment Element flow.
      if (!params.elements && !params.type) {
        const elements = elementsInstance?.elements.value
        if (elements) params.elements = elements
      }

      const result = await (stripeInstance.stripe.value as any).createPaymentMethod(params)

      if (result.error) {
        error.value = result.error.message || 'Failed to create payment method'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment method'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = false
    }
  }

  return {
    createPaymentMethod,
    loading: readonly(loading),
    error: readonly(error)
  }
}
