// The pure entry injects Stripe.js only when loadStripe() is called. The default
// entry injects it as soon as it is imported, before setLoadParameters() could
// run, so the library must never import it at runtime.
import { loadStripe as pureLoadStripe } from '@stripe/stripe-js/pure'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'
import { VueStripeProviderError } from './errors'
import { STRIPE_PARTNER_DETAILS } from './constants'

let inFlight: Promise<Stripe | null> | null = null

/**
 * The pure `loadStripe()` (with `setLoadParameters`), except that calls made
 * while Stripe.js is loading share that load. The pure entry of
 * @stripe/stripe-js 10.0.0 does not memoize it: a second call during the load
 * re-injects the script and drops the first call's listeners, so the first call
 * never settles. Waiting calls run once the load settles (resolving from
 * `window.Stripe`, or rejecting with the same error); later calls go straight
 * to the pure loader.
 */
export const loadStripe: typeof pureLoadStripe = /* @__PURE__ */ Object.assign(
  (...args: Parameters<typeof pureLoadStripe>) => {
    if (inFlight) return inFlight.then(() => pureLoadStripe(...args))
    const load = pureLoadStripe(...args)
    const settle = () => {
      if (inFlight === load) inFlight = null
    }
    inFlight = load
    load.then(settle, settle)
    return load
  },
  {
    setLoadParameters: (params: { advancedFraudSignals: boolean }) =>
      pureLoadStripe.setLoadParameters(params)
  }
)

/**
 * `loadStripe()` plus what every Vue Stripe loader does with the result:
 * reject a `null` instance and register the library's partner details.
 * `advancedFraudSignals: false` loads Stripe.js without Stripe's advanced
 * fraud detection signals (`?advancedFraudSignals=false`).
 */
export async function loadStripeInstance(
  key: string,
  options: StripeConstructorOptions,
  advancedFraudSignals = true
): Promise<Stripe> {
  if (!advancedFraudSignals) {
    try {
      loadStripe.setLoadParameters({ advancedFraudSignals: false })
    } catch {
      // Another loader already started Stripe.js with the signals on; that
      // script is reused, the same as Stripe.js does with an existing script.
      console.warn(
        '[Vue Stripe] advancedFraudSignals: false was ignored: Stripe.js already loading'
      )
    }
  }
  const stripe = await loadStripe(key, options)
  if (!stripe) {
    throw new VueStripeProviderError('Failed to initialize Stripe')
  }
  stripe.registerAppInfo(STRIPE_PARTNER_DETAILS)
  return stripe
}
