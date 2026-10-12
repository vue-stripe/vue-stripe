import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { readJsonBody } from '@/lib/api'
import { getStripe } from '@/lib/stripe'

interface CreateP24IntentBody {
  /** Amount in cents (default: 1000). */
  amount?: number
  /** `eur` or `pln` (default: eur). */
  currency?: string
  description?: string
  metadata?: Stripe.MetadataParam
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateP24IntentBody>(request)
    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount || 1000,
      currency: body.currency || 'eur', // P24 supports EUR and PLN
      payment_method_types: ['p24'],
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
    endpoint: 'POST /api/p24-intent',
    description: 'Create a Przelewy24 Payment Intent for Polish bank payments',
    parameters: {
      amount: 'number (in cents, default: 1000)',
      currency: 'string (eur or pln, default: eur)',
      description: 'string (optional)',
      metadata: 'object (optional)'
    },
    notes: 'Przelewy24 supports EUR and PLN currencies (Poland)'
  })
}
