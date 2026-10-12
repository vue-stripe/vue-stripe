import { createStripeMethodComposable } from '../utils/method-factory'

/**
 * Wraps `stripe.createRadarSession()`: snapshots browser and device details for
 * Radar without tokenizing a payment method. Returns
 * `{ createRadarSession, loading, error }`; pass `radarSession.id` to your server.
 *
 * @example
 * ```ts
 * const { createRadarSession } = useRadarSession()
 * const { radarSession, error } = await createRadarSession()
 * ```
 */
export const useRadarSession = /* @__PURE__ */ createStripeMethodComposable(
  'createRadarSession',
  'useRadarSession'
)
