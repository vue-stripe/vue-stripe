import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      line_items: body.lineItems || [
        {
          price_data: {
            currency: body.currency || 'usd',
            product_data: {
              name: body.productName || 'Test Product',
              description: body.productDescription || 'A test product for Vue Stripe',
            },
            unit_amount: body.amount || 1000,
          },
          quantity: body.quantity || 1,
        },
      ],
      mode: body.mode || 'payment',
      success_url: body.successUrl || `${FRONTEND_URL}/stripe-checkout?result=success`,
      cancel_url: body.cancelUrl || `${FRONTEND_URL}/stripe-checkout?result=cancel`,
      ...(body.customerEmail && { customer_email: body.customerEmail }),
      ...(body.metadata && { metadata: body.metadata }),
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/checkout-session',
    description: 'Create a Checkout Session and return URL',
    parameters: {
      amount: 'number (in cents, default: 1000)',
      currency: 'string (default: usd)',
      productName: 'string (default: Test Product)',
      productDescription: 'string (optional)',
      quantity: 'number (default: 1)',
      mode: 'payment | subscription | setup (default: payment)',
      successUrl: 'string (optional)',
      cancelUrl: 'string (optional)',
      customerEmail: 'string (optional)',
      metadata: 'object (optional)',
    },
  })
}
