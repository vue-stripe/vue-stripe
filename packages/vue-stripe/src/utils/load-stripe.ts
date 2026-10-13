// The pure entry injects Stripe.js only when loadStripe() is called. The default
// entry injects it as soon as it is imported, before setLoadParameters() could
// run, so the library must never import it at runtime.
import { loadStripe as pureLoadStripe } from '@stripe/stripe-js/pure'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'
import { VueStripeProviderError } from './errors'
import { STRIPE_PARTNER_DETAILS } from './constants'

// The Stripe.js script load in progress (not any caller's Stripe() result).
let inFlight: Promise<unknown> | null = null

/**
 * The pure `loadStripe()` (with `setLoadParameters`), except that calls made
 * while Stripe.js is loading share that load. The pure entry of
 * @stripe/stripe-js 10.0.0 does not memoize it: a second call during the load
 * re-injects the script and drops the first call's listeners, so the first call
 * never settles. Waiting calls run once the script settles: each creates its own
 * instance from `window.Stripe`, so an argument `Stripe()` rejects (a secret key)
 * fails only its own call, while a script that fails to load fails them all.
 * Later calls go straight to the pure loader.
 */
export const loadStripe: typeof pureLoadStripe = /* @__PURE__ */ Object.assign(
  (...args: Parameters<typeof pureLoadStripe>) => {
    if (inFlight) return inFlight.then(() => pureLoadStripe(...args))
    const load = pureLoadStripe(...args)
    const script = load.catch((err: unknown) => {
      // window.Stripe is set: the script loaded and only this call's Stripe() threw.
      if (!(globalThis as { Stripe?: unknown }).Stripe) throw err
    })
    const settle = () => {
      if (inFlight === script) inFlight = null
    }
    inFlight = script
    script.then(settle, settle)
    return load
  },
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
  stripe.registerAppInfo(STRIPE_PARTNER_DETAILS)
  return stripe
}
