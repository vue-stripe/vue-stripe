import { inject, readonly } from 'vue-demi'
import type { UseStripeElementsReturn } from '../types'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeElementsError } from '../utils/errors'

export function useStripeElements(): UseStripeElementsReturn {
  const elementsContext = inject(stripeElementsInjectionKey)

  if (!elementsContext) {
    throw new StripeElementsError(
      'Elements context not found. Make sure to wrap your component with StripeElements.'
    )
  }

  return {
    elements: readonly(elementsContext.elements),
    loading: readonly(elementsContext.loading),
    error: readonly(elementsContext.error)
  }
}