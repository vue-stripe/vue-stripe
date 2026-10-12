import { createStripeMethodComposable } from '../utils/method-factory'

/**
 * Wraps `stripe.verifyMicrodepositsForPayment(clientSecret, data?)`: verifies the
 * customer's bank account of a PaymentIntent with the two micro-deposit amounts
 * (in cents). Returns `{ verifyMicrodepositsForPayment, loading, error }`.
 *
 * @example
 * ```ts
 * const { verifyMicrodepositsForPayment } = useVerifyMicrodepositsForPayment()
 * const { paymentIntent, error } = await verifyMicrodepositsForPayment(clientSecret, {
 *   amounts: [32, 45]
 * })
 * ```
 */
export const useVerifyMicrodepositsForPayment = /* @__PURE__ */ createStripeMethodComposable(
  'verifyMicrodepositsForPayment'
)
