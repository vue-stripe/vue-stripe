// The app's server: lists plans and creates subscriptions. It keeps your secret key off the
// browser and decides the prices, so a customer cannot change what they pay.
import { createServer } from 'node:http'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return body ? JSON.parse(body) : {}
}

// The account's active recurring prices. On an account without any, create one example plan so
// the app works right away.
async function listPlans() {
  const list = () =>
    stripe.prices.list({ active: true, type: 'recurring', limit: 10, expand: ['data.product'] })
  let prices = await list()
  if (!prices.data.length) {
    await stripe.prices.create({
      currency: 'usd',
      unit_amount: 1000, // $10.00, in cents
      recurring: { interval: 'month' },
      product_data: { name: 'Vue Stripe example plan' }
    })
    prices = await list()
  }
  return prices.data.map((price) => ({
    id: price.product.id,
    name: price.product.name,
    type: 'recurring',
    price: {
      id: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring.interval
    }
  }))
}

const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  try {
    if (req.method === 'GET' && req.url === '/api/products') {
      res.end(JSON.stringify({ products: await listPlans() }))
      return
    }

    // POST /api/subscription { priceId, customerEmail }
    if (req.method === 'POST' && req.url === '/api/subscription') {
      const { priceId, customerEmail } = await readJson(req)
      if (!priceId || !customerEmail) throw new Error('priceId and customerEmail are required')

      // Reuse the customer with this email, so a retry does not create another one.
      const [existing] = (await stripe.customers.list({ email: customerEmail, limit: 1 })).data
      const customer = existing ?? (await stripe.customers.create({ email: customerEmail }))

      // The subscription starts `incomplete`; paying its first invoice in the browser activates it.
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.confirmation_secret']
      })

      res.end(
        JSON.stringify({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice.confirmation_secret?.client_secret ?? null,
          status: subscription.status
        })
      )
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
