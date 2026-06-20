import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const stripe = getStripe()

    // Only accept a positive integer amount (in cents); otherwise fall back to the
    // demo default rather than forwarding a negative/fractional value to Stripe.
    const amount = Number.isInteger(body.amount) && body.amount > 0 ? body.amount : 1000

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud', // BECS Direct Debit only supports AUD (Australian Dollar)
      payment_method_types: ['au_becs_debit'],
      ...(body.description && { description: body.description }),
      ...(body.metadata && { metadata: body.metadata }),
      // BECS Direct Debit requires a mandate for recurring payments
      ...(body.mandate_data && { mandate_data: body.mandate_data }),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/becs-intent',
    description: 'Create a BECS Direct Debit Payment Intent for Australian bank payments',
    parameters: {
      amount: 'number (in cents, default: 1000)',
      description: 'string (optional)',
      metadata: 'object (optional)',
      mandate_data: 'object (optional, for recurring payments)',
    },
    notes: 'Currency is always AUD for BECS Direct Debit payments (Australia)',
  })
}
