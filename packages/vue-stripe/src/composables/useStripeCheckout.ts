import { ref, readonly, type Ref } from 'vue-demi'
import type { RedirectToCheckoutOptions } from '@stripe/stripe-js'
import { useStripe } from './useStripe'
import { StripeProviderError } from '../utils/errors'

export interface UseStripeCheckoutReturn {
  redirectToCheckout: (options: RedirectToCheckoutOptions) => Promise<void>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export function useStripeCheckout(): UseStripeCheckoutReturn {
  const { stripe } = useStripe()
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const redirectToCheckout = async (options: RedirectToCheckoutOptions): Promise<void> => {
    if (!stripe.value) {
      throw new StripeProviderError('Stripe not initialized')
    }

    try {
      loading.value = true
      error.value = null

      const result = await stripe.value.redirectToCheckout(options)

      if (result.error) {
        const errorMessage = result.error.message || 'Checkout redirect failed'
        error.value = errorMessage
        throw new StripeProviderError(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout redirect failed'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    redirectToCheckout,
    loading: readonly(loading),
    error: readonly(error)
  }
}