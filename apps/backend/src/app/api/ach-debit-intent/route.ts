import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { readJsonBody } from '@/lib/api'
import { getStripe } from '@/lib/stripe'

interface CreateAchDebitIntentBody {
  /** Amount in cents (default: 1000). */
  amount?: number
  description?: string
  metadata?: Stripe.MetadataParam
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateAchDebitIntentBody>(request)
    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount || 1000,
      currency: 'usd', // ACH Direct Debit only supports USD
      allowed_payment_method_types: ['us_bank_account'],
      ...(body.description && { description: body.description }),
      ...(body.metadata && { metadata: body.metadata }),
      // The browser links the bank account with Financial Connections (no micro-deposits)
      payment_method_options: {
        us_bank_account: {
          verification_method: 'instant',
          financial_connections: { permissions: ['payment_method'] }
        }
      }
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
    endpoint: 'POST /api/ach-debit-intent',
    description: 'Create an ACH Direct Debit Payment Intent for Financial Connections (US)',
    parameters: {
      amount: 'number (in cents, default: 1000)',
      description: 'string (optional)',
      metadata: 'object (optional)'
    },
    notes: 'Currency is always USD for ACH Direct Debit payments'
  })
}
