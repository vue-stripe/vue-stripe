import { createStripeMethodComposable } from '../utils/method-factory'

/**
 * Wraps `stripe.createToken()`: turns a Card / Card Number / CVC element, bank
 * account details, PII, or Connect account / person details into a single-use
 * Token. Returns `{ createToken, loading, error }`; `createToken` keeps every
 * Stripe.js overload, resolves to `{ token }` or `{ error }` and rethrows what
 * Stripe throws.
 *
 * @example
 * ```ts
 * const { createToken, loading, error } = useCreateToken()
 * const { token, error } = await createToken(cardElement, { name: 'Jenny Rosen' })
 * ```
 */
export const useCreateToken = /* @__PURE__ */ createStripeMethodComposable('createToken')
