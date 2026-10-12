import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { readJsonBody } from '@/lib/api'
import { getStripe } from '@/lib/stripe'

interface CreateFpxIntentBody {
  /** Amount in sen (default: 1000). */
  amount?: number
  description?: string
  metadata?: Stripe.MetadataParam
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateFpxIntentBody>(request)
    const stripe = getStripe()

    // Only accept a positive integer amount (in sen); otherwise fall back to the
    // demo default rather than forwarding a negative/fractional value to Stripe.
    const amount =
      typeof body.amount === 'number' && Number.isInteger(body.amount) && body.amount > 0
        ? body.amount
        : 1000

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'myr', // FPX only supports MYR (Malaysian Ringgit)
      payment_method_types: ['fpx'],
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
    endpoint: 'POST /api/fpx-intent',
    description: 'Create an FPX Payment Intent for Malaysian bank payments',
    parameters: {
      amount: 'number (in sen, default: 1000)',
      description: 'string (optional)',
      metadata: 'object (optional)'
    },
    notes: 'Currency is always MYR for FPX payments (Malaysia)'
  })
}
