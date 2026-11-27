// The app's server: creates Checkout Sessions and reads their status. It keeps your secret key off
// the browser and decides the line items, so a customer cannot change what they pay.
import { createServer } from 'node:http'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return body ? JSON.parse(body) : {}
}

const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  const url = new URL(req.url, 'http://localhost')
  try {
    // POST /api/checkout-session { uiMode, returnUrl } or { uiMode: 'hosted', successUrl, cancelUrl }
    if (req.method === 'POST' && url.pathname === '/api/checkout-session') {
      const body = await readJson(req)
      // In production, build these URLs from your own site's address instead of the request.
      const urls =
        body.uiMode === 'embedded_page'
          ? { ui_mode: 'embedded_page', return_url: body.returnUrl }
          : { success_url: body.successUrl, cancel_url: body.cancelUrl }
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            // Inline price for the example; use `price: 'price_...'` for a Price in your account.
            price_data: {
              currency: 'usd',
              product_data: { name: 'Vue Stripe T-shirt' },
              unit_amount: 2000 // $20.00, in cents
            },
            quantity: 1
          }
        ],
        ...urls
      })
      res.end(
        JSON.stringify({
          url: session.url,
          sessionId: session.id,
          clientSecret: session.client_secret
        })
      )
      return
    }

    // GET /api/checkout-status?session_id=cs_test_...
    if (req.method === 'GET' && url.pathname === '/api/checkout-status') {
      const session = await stripe.checkout.sessions.retrieve(url.searchParams.get('session_id'))
      res.end(JSON.stringify({ status: session.status, paymentStatus: session.payment_status }))
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
