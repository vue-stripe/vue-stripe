// The app's server: creates a PaymentIntent for each visit. It keeps your secret key off the
// browser and decides the amount, so a customer cannot change what they pay.
import { createServer } from 'node:http'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  try {
    if (req.method === 'POST' && req.url === '/api/payment-intent') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00, in cents
        currency: 'usd',
        automatic_payment_methods: { enabled: true }
      })
      res.end(JSON.stringify({ clientSecret: paymentIntent.client_secret }))
      return
    }
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
  } catch (error) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: error.message }))
  }
})

server.listen(3000, () => console.log('API server ready on http://localhost:3000'))
