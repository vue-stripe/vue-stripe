import { createStripeMethodComposable } from '../utils/method-factory'

/**
 * Wraps `stripe.createEphemeralKeyNonce({ issuingCard })` (Stripe Issuing): creates
 * the single-use nonce your server exchanges for an ephemeral key before the Issuing
 * card elements reveal card details. Returns `{ createEphemeralKeyNonce, loading, error }`.
 *
 * @example
 * ```ts
 * const { createEphemeralKeyNonce } = useEphemeralKeyNonce()
 * const { nonce, error } = await createEphemeralKeyNonce({ issuingCard: 'ic_123' })
 * ```
 */
export const useEphemeralKeyNonce = /* @__PURE__ */ createStripeMethodComposable(
  'createEphemeralKeyNonce',
  'useEphemeralKeyNonce'
)
