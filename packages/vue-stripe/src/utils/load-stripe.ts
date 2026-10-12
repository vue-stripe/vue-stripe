// The pure entry injects Stripe.js only when loadStripe() is called. The default
// entry injects it as soon as it is imported, before setLoadParameters() could
// run, so the library must never import it at runtime.
import { loadStripe } from '@stripe/stripe-js/pure'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'
import { VueStripeProviderError } from './errors'
import { STRIPE_PARTNER_DETAILS } from './constants'

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
