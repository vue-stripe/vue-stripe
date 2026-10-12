import Stripe from 'stripe'

// Stripe.js 10 is the Endive release train; pin the server to the same train
// so both sides speak the same API shapes.
const STRIPE_API_VERSION = '2026-09-30.endive'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true
    })
  }
  return stripeInstance
}
