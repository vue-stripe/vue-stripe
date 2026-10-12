import { inject, ref, readonly } from 'vue-demi'
import type { Stripe } from '@stripe/stripe-js'
import type { UseFinancialConnectionsReturn, VueStripeErrorResult } from '../types'
import { stripeInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

/**
 * Composable for Stripe Financial Connections and ACH Direct Debit bank account
 * collection.
 *
 * Wraps `stripe.collectFinancialConnectionsAccounts`, `collectBankAccountForPayment`,
 * `collectBankAccountForSetup` and `collectBankAccountToken`. Each opens Stripe's
 * modal and resolves when the customer finishes or closes it. All four share one
 * `loading` / `error` pair.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFinancialConnections } from '@vue-stripe/vue-stripe'
 *
 * const { collectFinancialConnectionsAccounts, loading, error } = useFinancialConnections()
 *
 * const link = async (clientSecret) => {
 *   const { financialConnectionsSession, error } =
 *     await collectFinancialConnectionsAccounts({ clientSecret })
 * }
 * </script>
 * ```
 */
export function useFinancialConnections(): UseFinancialConnectionsReturn {
  const stripeInstance = inject(stripeInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      'useFinancialConnections must be called within a VueStripeProvider component'
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Runs one Stripe call with the shared loading / error handling of the composables.
  const run = async <T extends { error?: { message?: string } | undefined }>(
    call: (stripe: Stripe) => Promise<T>,
    fallback: string
  ): Promise<T | VueStripeErrorResult> => {
    if (!stripeInstance.stripe.value) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    loading.value = true
    error.value = null

    try {
      const result = await call(stripeInstance.stripe.value)

      if (result.error) {
        error.value = result.error.message || fallback
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : fallback
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = false
    }
  }

  return {
    collectFinancialConnectionsAccounts: (options) =>
      run(
        (stripe) => stripe.collectFinancialConnectionsAccounts(options),
        'Failed to collect financial accounts'
      ),
    collectBankAccountForPayment: (options) =>
      run(
        (stripe) => stripe.collectBankAccountForPayment(options),
        'Failed to collect bank account'
      ),
    collectBankAccountForSetup: (options) =>
      run((stripe) => stripe.collectBankAccountForSetup(options), 'Failed to collect bank account'),
    collectBankAccountToken: (options) =>
      run(
        (stripe) => stripe.collectBankAccountToken(options),
        'Failed to collect bank account token'
      ),
    loading: readonly(loading),
    error: readonly(error)
  }
}
