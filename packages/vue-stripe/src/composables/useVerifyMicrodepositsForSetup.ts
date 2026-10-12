import { createStripeMethodComposable } from '../utils/method-factory'

/**
 * Wraps `stripe.verifyMicrodepositsForSetup(clientSecret, data?)`: verifies the
 * customer's bank account of a SetupIntent with the micro-deposit amounts or
 * descriptor code. Returns `{ verifyMicrodepositsForSetup, loading, error }`.
 *
 * @example
 * ```ts
 * const { verifyMicrodepositsForSetup } = useVerifyMicrodepositsForSetup()
 * const { setupIntent, error } = await verifyMicrodepositsForSetup(clientSecret, {
 *   descriptor_code: 'SM11AA'
 * })
 * ```
 */
export const useVerifyMicrodepositsForSetup = /* @__PURE__ */ createStripeMethodComposable(
  'verifyMicrodepositsForSetup'
)
