import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { readJsonBody } from '@/lib/api'
import { getStripe } from '@/lib/stripe'

interface CreateCheckoutSessionBody {
  /** Existing Stripe price ID (preferred for subscriptions). */
  priceId?: string
  /** Explicit line items, used when no priceId is given. */
  lineItems?: Stripe.Checkout.SessionCreateParams.LineItem[]
  /** Amount in cents for inline price_data (default: 1000). */
  amount?: number
  currency?: string
  productName?: string
  productDescription?: string
  quantity?: number
  mode?: Stripe.Checkout.SessionCreateParams.Mode
  /** Billing interval for subscription mode with inline price_data (default: month). */
  interval?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval
  successUrl?: string
  cancelUrl?: string
  customerEmail?: string
  metadata?: Stripe.MetadataParam
  /**
   * `hosted` (default) returns a Stripe-hosted `url`. `elements` (Checkout Elements SDK),
   * `embedded_page` and `form` return a `clientSecret` and use `returnUrl` instead of
   * `successUrl`/`cancelUrl`.
   */
  uiMode?: UiMode
  /** Return URL for non-hosted sessions. `{CHECKOUT_SESSION_ID}` is substituted by Stripe. */
  returnUrl?: string
  /** Collect the customer's tax ID during checkout. */
  taxIdCollection?: boolean
}

type UiMode = 'hosted' | 'elements' | 'embedded_page' | 'form'
const UI_MODES: readonly UiMode[] = ['hosted', 'elements', 'embedded_page', 'form']

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateCheckoutSessionBody>(request)
    const stripe = getStripe()

    // Determine line items: use existing priceId or create inline price_data
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
    if (body.priceId) {
      // Metered prices must NOT include `quantity` (Stripe rejects it).
      const price = await stripe.prices.retrieve(body.priceId)
      const isMetered = price.recurring?.usage_type === 'metered'
      lineItems = [
        isMetered ? { price: body.priceId } : { price: body.priceId, quantity: body.quantity || 1 }
      ]
    } else if (body.lineItems) {
      // Use provided line items
      lineItems = body.lineItems
    } else {
      // Create inline price_data (for one-time payments only)
      lineItems = [
        {
          price_data: {
            currency: body.currency || 'usd',
            product_data: {
              name: body.productName || 'Test Product',
              description: body.productDescription || 'A test product for Vue Stripe'
            },
            unit_amount: body.amount || 1000,
            // Add recurring for subscription mode
            ...(body.mode === 'subscription' && {
              recurring: { interval: body.interval || 'month' }
            })
          },
          quantity: body.quantity || 1
        }
      ]
    }

    const uiMode = body.uiMode ?? 'hosted'
    if (!UI_MODES.includes(uiMode)) {
      return NextResponse.json(
        { error: `uiMode must be one of: ${UI_MODES.join(', ')}` },
        { status: 400 }
      )
    }
    const returnUrl =
      body.returnUrl ||
      `${FRONTEND_URL}/custom-checkout?result=success&session_id={CHECKOUT_SESSION_ID}`

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: body.mode || 'payment',
      ...(uiMode === 'hosted'
        ? {
            success_url: body.successUrl || `${FRONTEND_URL}/stripe-checkout?result=success`,
            cancel_url: body.cancelUrl || `${FRONTEND_URL}/stripe-checkout?result=cancel`
          }
        : { ui_mode: uiMode, return_url: returnUrl }),
      ...(body.customerEmail && { customer_email: body.customerEmail }),
      ...(body.taxIdCollection && { tax_id_collection: { enabled: true } }),
      ...(body.metadata && { metadata: body.metadata })
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      clientSecret: session.client_secret
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check
export function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/checkout-session',
    description: 'Create a Checkout Session and return its URL (hosted) or client secret',
    parameters: {
      priceId: 'string (existing Stripe price ID - preferred for subscriptions)',
      amount: 'number (in cents, default: 1000, ignored if priceId provided)',
      currency: 'string (default: usd, ignored if priceId provided)',
      productName: 'string (default: Test Product, ignored if priceId provided)',
      productDescription: 'string (optional, ignored if priceId provided)',
      quantity: 'number (default: 1)',
      mode: 'payment | subscription | setup (default: payment)',
      interval: 'string (month | year, for subscription mode with price_data)',
      successUrl: 'string (optional)',
      cancelUrl: 'string (optional)',
      customerEmail: 'string (optional)',
      metadata: 'object (optional)',
      uiMode: 'hosted | elements | embedded_page | form (default: hosted)',
      returnUrl: 'string (non-hosted ui modes; default: <frontend>/custom-checkout)',
      taxIdCollection: 'boolean (optional, enables tax ID collection)'
    }
  })
}
