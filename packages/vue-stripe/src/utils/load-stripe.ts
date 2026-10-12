import { loadStripe, type Stripe, type StripeConstructorOptions } from '@stripe/stripe-js'
import { VueStripeProviderError } from './errors'
import { STRIPE_PARTNER_DETAILS } from './constants'

/**
 * `loadStripe()` plus what every Vue Stripe loader does with the result:
 * reject a `null` instance and register the library's partner details.
 */
export async function loadStripeInstance(
  key: string,
  options: StripeConstructorOptions
): Promise<Stripe> {
  const stripe = await loadStripe(key, options)
  if (!stripe) {
    throw new VueStripeProviderError('Failed to initialize Stripe')
  }
  stripe.registerAppInfo(STRIPE_PARTNER_DETAILS)
  return stripe
}
