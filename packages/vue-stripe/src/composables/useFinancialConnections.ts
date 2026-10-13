import { ref, readonly } from 'vue-demi'
import type { Stripe } from '@stripe/stripe-js'
import type { UseFinancialConnectionsReturn, VueStripeErrorResult } from '../types'
import { injectStripe, whenStripeLoaded } from '../utils/inject-stripe'

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
  const stripeInstance = injectStripe('useFinancialConnections')

  // Overlapping calls: stay loading until the last one settles.
  const loading = ref(false)
  let pending = 0
  const error = ref<string | null>(null)

  // Runs one Stripe call with the shared loading / error handling of the composables.
  const run = async <T extends { error?: { message?: string } | undefined }>(
    call: (stripe: Stripe) => Promise<T>,
    fallback: string
  ): Promise<T | VueStripeErrorResult> => {
    const stripe = stripeInstance.stripe.value ?? (await whenStripeLoaded(stripeInstance))
    if (!stripe) {
      error.value = 'Stripe not initialized'
      return { error: { message: 'Stripe not initialized' } }
    }

    pending++
    loading.value = true
    error.value = null

    try {
      const result = await call(stripe)

      if (result.error) {
        error.value = result.error.message || fallback
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : fallback
      error.value = errorMessage
      return { error: { message: errorMessage } }
    } finally {
      loading.value = --pending > 0
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
