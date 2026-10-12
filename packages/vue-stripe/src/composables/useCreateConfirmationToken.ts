import { inject } from 'vue-demi'
import type { ConfirmationTokenResult } from '@stripe/stripe-js'
import type { CreateConfirmationTokenOptions, UseCreateConfirmationTokenReturn } from '../types'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'
import { useStripeMethodCall } from '../utils/method-factory'

/**
 * Composable for creating a ConfirmationToken from the Payment Element, to confirm
 * the PaymentIntent or SetupIntent on your server.
 *
 * Wraps `stripe.createConfirmationToken({ elements, params })`. `elements` defaults to
 * the instance injected by `<VueStripeElements>`, and `elements.submit()` runs first
 * (Stripe requires it) unless `skipSubmit: true`. A submit error resolves as
 * `{ error }` without creating a token; otherwise the result and error handling
 * match the other method composables (an `{ error }` result sets `error`, a throw
 * is recorded and rethrown).
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCreateConfirmationToken } from '@vue-stripe/vue-stripe'
 *
 * const { createConfirmationToken, loading, error } = useCreateConfirmationToken()
 *
 * const onSubmit = async () => {
 *   const { confirmationToken, error } = await createConfirmationToken()
 *   if (confirmationToken) await fetch('/confirm', { method: 'POST', body: confirmationToken.id })
 * }
 * </script>
 * ```
 */
export function useCreateConfirmationToken(): UseCreateConfirmationTokenReturn {
  const elementsInstance = inject(stripeElementsInjectionKey, null)

  return useStripeMethodCall(
    'useCreateConfirmationToken',
    'createConfirmationToken',
    async (stripe, [options = {}]): Promise<ConfirmationTokenResult> => {
      const {
        skipSubmit,
        params,
        elements = elementsInstance?.elements.value
      } = options as CreateConfirmationTokenOptions
      if (!elements) {
        throw new VueStripeElementsError(
          'useCreateConfirmationToken needs an Elements instance: pass `elements` or call it inside <VueStripeElements>'
        )
      }

      // Stripe requires elements.submit() to resolve before createConfirmationToken.
      // See: https://docs.stripe.com/js/elements/submit
      if (!skipSubmit) {
        const { error: submitError } = await elements.submit()
        if (submitError) return { error: submitError }
      }

      return stripe.createConfirmationToken(params ? { elements, params } : { elements })
    }
  ) as unknown as UseCreateConfirmationTokenReturn
}
