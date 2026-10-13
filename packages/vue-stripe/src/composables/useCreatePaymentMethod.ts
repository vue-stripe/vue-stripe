import { inject, ref, readonly } from 'vue-demi'
import type { CreatePaymentMethodData, CreatePaymentMethodFromElements } from '@stripe/stripe-js'
import type { UseCreatePaymentMethodReturn, CreatePaymentMethodOptions } from '../types'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { injectStripe, whenStripeLoaded } from '../utils/inject-stripe'

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
  const stripeInstance = injectStripe('useCreatePaymentMethod')
  const elementsInstance = inject(stripeElementsInjectionKey, null)

  // Overlapping calls: stay loading until the last one settles.
  const loading = ref(false)
  let pending = 0
  const error = ref<string | null>(null)

  const createPaymentMethod = async (options: CreatePaymentMethodOptions = {}) => {
    const stripe = stripeInstance.stripe.value ?? (await whenStripeLoaded(stripeInstance))
    if (!stripe) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    pending++
    loading.value = true
    error.value = null

    try {
      // `skipSubmit` is a Vue-Stripe option, not a Stripe param — keep it out of `params`.
      const { skipSubmit, ...rest } = options
      const params: CreatePaymentMethodOptions = { ...rest }
      // Default to the injected Elements instance for the Payment Element flow.
      if (!params.elements && !params.type) {
        const elements = elementsInstance?.elements.value
        if (elements) params.elements = elements
      }

      // For the Payment Element (elements) flow, Stripe requires elements.submit()
      // to resolve before createPaymentMethod pulls data from a deferred Elements
      // instance. The manual `{ type, card }` flow must NOT submit.
      // See: https://docs.stripe.com/js/elements/submit
      if (params.elements && !skipSubmit) {
        const { error: submitError } = await params.elements.submit()
        if (submitError) {
          error.value = submitError.message || 'Form validation failed'
          return { error: submitError }
        }
      }

      // Stripe overloads createPaymentMethod by input shape: Elements-based or raw data.
      const result = params.elements
        ? await stripe.createPaymentMethod(params as CreatePaymentMethodFromElements)
        : await stripe.createPaymentMethod(params as CreatePaymentMethodData)

      if (result.error) {
        error.value = result.error.message || 'Failed to create payment method'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment method'
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = --pending > 0
    }
  }

  return {
    createPaymentMethod,
    loading: readonly(loading),
    error: readonly(error)
  }
}
