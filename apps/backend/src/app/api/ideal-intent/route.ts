import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount || 1000,
      currency: 'eur', // iDEAL only supports EUR
      payment_method_types: ['ideal'],
      ...(body.description && { description: body.description }),
      ...(body.metadata && { metadata: body.metadata }),
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
    endpoint: 'POST /api/ideal-intent',
    description: 'Create an iDEAL Payment Intent for Dutch bank payments',
    parameters: {
      amount: 'number (in cents, default: 1000)',
      description: 'string (optional)',
      metadata: 'object (optional)',
    },
    notes: 'Currency is always EUR for iDEAL payments (Netherlands)',
  })
}
