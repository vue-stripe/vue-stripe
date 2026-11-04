// The pure entry injects Stripe.js only when loadStripe() is called. The default
// entry injects it as soon as it is imported, before setLoadParameters() could
// run, so the library must never import it at runtime.
import { loadStripe as pureLoadStripe } from '@stripe/stripe-js/pure'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'
import { VueStripeProviderError } from './errors'
import { STRIPE_PARTNER_DETAILS } from './constants'

// Stripe.js >=10.2.1 shares concurrent script loads itself, including failure/retry.
// Every instance Vue Stripe hands out, the loadStripe re-export's included, carries the
// library's Stripe partner details.
const register = (stripe: Stripe | null) => {
  stripe?.registerAppInfo(STRIPE_PARTNER_DETAILS)
  return stripe
}

export const loadStripe: typeof pureLoadStripe = /* @__PURE__ */ Object.assign(
  (...args: Parameters<typeof pureLoadStripe>) => pureLoadStripe(...args).then(register),
  {
    setLoadParameters: (params: { advancedFraudSignals: boolean }) =>
      pureLoadStripe.setLoadParameters(params)
  }
)

// One instance per distinct loadStripeInstance() arguments: every Stripe() call adds a
// controller iframe that outlives the instance, so remounted providers reuse theirs.
const instances = new Map<string, Promise<Stripe>>()
let apiVersionWarned = false

/** Test helper: forget the reused instances. */
export const clearStripeInstances = () => instances.clear()

/**
 * `loadStripe()` plus what every Vue Stripe loader does with the result:
 * reject a `null` instance and register the library's partner details.
 * `advancedFraudSignals: false` loads Stripe.js without Stripe's advanced
 * fraud detection signals (`?advancedFraudSignals=false`). Calls with the same
 * key, options and `advancedFraudSignals` share one instance; a failed one is
 * dropped so the next call tries again. `apiVersion` is dropped: versioned
 * Stripe.js fixes the API version and refuses the option.
 */
export function loadStripeInstance(
  key: string,
  { apiVersion, ...options }: StripeConstructorOptions,
  advancedFraudSignals = true
): Promise<Stripe> {
  if (apiVersion && !apiVersionWarned) {
    apiVersionWarned = true
    console.warn(
      `[Vue Stripe] apiVersion "${apiVersion}" is ignored: versioned Stripe.js uses its release train's API version`
    )
  }
  const id = JSON.stringify([key, options, advancedFraudSignals])
  let instance = instances.get(id)
  if (!instance) {
    instance = createInstance(key, options, advancedFraudSignals)
    instances.set(id, instance)
    instance.catch(() => instances.delete(id))
  }
  return instance
}

async function createInstance(
  key: string,
  options: StripeConstructorOptions,
  advancedFraudSignals: boolean
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
  return stripe
}
