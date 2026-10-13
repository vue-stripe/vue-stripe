import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { readJsonBody } from '@/lib/api'
import { getStripe } from '@/lib/stripe'

interface CreateIdentitySessionBody {
  /** What to verify (default: document). */
  type?: Stripe.Identity.VerificationSessionCreateParams.Type
  metadata?: Stripe.MetadataParam
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateIdentitySessionBody>(request)
    const stripe = getStripe()

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: body.type || 'document',
      ...(body.metadata && { metadata: body.metadata })
    })

    return NextResponse.json({
      clientSecret: verificationSession.client_secret,
      verificationSessionId: verificationSession.id
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check
export function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/identity-session',
    description: 'Create a Stripe Identity VerificationSession for the verification modal',
    parameters: {
      type: 'document | id_number (default: document)',
      metadata: 'object (optional)'
    }
  })
}
