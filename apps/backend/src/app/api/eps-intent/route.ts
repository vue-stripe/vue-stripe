import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { readJsonBody } from '@/lib/api'
import { getStripe } from '@/lib/stripe'

interface CreateEpsIntentBody {
  /** Amount in cents (default: 1000). */
  amount?: number
  description?: string
  metadata?: Stripe.MetadataParam
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateEpsIntentBody>(request)
    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount || 1000,
      currency: 'eur', // EPS only supports EUR
      payment_method_types: ['eps'],
      ...(body.description && { description: body.description }),
      ...(body.metadata && { metadata: body.metadata })
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check
export function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/eps-intent',
    description: 'Create an EPS Payment Intent for Austrian bank payments',
    parameters: {
      amount: 'number (in cents, default: 1000)',
      description: 'string (optional)',
      metadata: 'object (optional)'
    },
    notes: 'Currency is always EUR for EPS payments (Austria)'
  })
}
