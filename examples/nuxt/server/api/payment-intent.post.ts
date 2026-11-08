// POST /api/payment-intent: creates a PaymentIntent for each visit. The secret key stays on the
// server, and the server decides the amount, so a customer cannot change what they pay.
import Stripe from 'stripe'

export default defineEventHandler(async () => {
  const stripe = new Stripe(useRuntimeConfig().stripeSecretKey)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000, // $10.00, in cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true }
  })

  return { clientSecret: paymentIntent.client_secret }
})
