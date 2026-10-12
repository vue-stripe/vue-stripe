import { createStripeMethodComposable } from '../utils/method-factory'

/**
 * Wraps `stripe.handleCardAction(clientSecret)`: runs the card action (3D Secure)
 * of a PaymentIntent confirmed on the server with `confirmation_method: 'manual'`.
 * Returns `{ handleCardAction, loading, error }`; prefer `useHandleNextAction` for
 * new integrations.
 *
 * @example
 * ```ts
 * const { handleCardAction } = useHandleCardAction()
 * const { paymentIntent, error } = await handleCardAction(clientSecret)
 * ```
 */
export const useHandleCardAction = /* @__PURE__ */ createStripeMethodComposable('handleCardAction')
