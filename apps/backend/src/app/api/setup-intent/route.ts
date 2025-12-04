import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const stripe = getStripe()

    const setupIntent = await stripe.setupIntents.create({
      automatic_payment_methods: {
        enabled: true,
      },
      ...(body.customerId && { customer: body.customerId }),
      ...(body.description && { description: body.description }),
      ...(body.metadata && { metadata: body.metadata }),
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/setup-intent',
    description: 'Create a Setup Intent for saving payment methods',
    parameters: {
      customerId: 'string (optional)',
      description: 'string (optional)',
      metadata: 'object (optional)',
    },
  })
}
