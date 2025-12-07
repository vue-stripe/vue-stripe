import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const stripe = getStripe()

    const { priceId, paymentMethodId, customerEmail } = body

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 })
    }

    // Find existing customer or create a new one
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    })

    let customer = customers.data[0]

    if (!customer) {
      customer = await stripe.customers.create({
        email: customerEmail,
        ...(body.name && { name: body.name }),
        ...(body.metadata && { metadata: body.metadata }),
      })
    }

    // If paymentMethodId is provided, attach it to the customer
    if (paymentMethodId) {
      // Check if the payment method is already attached to this customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

      if (paymentMethod.customer !== customer.id) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        })
      }

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      ...(body.metadata && { metadata: body.metadata }),
    })

    // Extract the client secret from the payment intent
    const invoice = subscription.latest_invoice
    let clientSecret = null

    if (invoice && typeof invoice !== 'string' && invoice.payment_intent) {
      const paymentIntent = invoice.payment_intent
      if (typeof paymentIntent !== 'string') {
        clientSecret = paymentIntent.client_secret
      }
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
      customerId: customer.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// Health check / documentation
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/subscription',
    description: 'Create a subscription for a customer',
    parameters: {
      priceId: 'string (required) - The price ID to subscribe to',
      customerEmail: 'string (required) - Customer email address',
      paymentMethodId: 'string (optional) - Payment method to attach',
      name: 'string (optional) - Customer name',
      metadata: 'object (optional) - Additional metadata',
    },
    response: {
      subscriptionId: 'string - The subscription ID',
      clientSecret: 'string - Client secret for payment confirmation',
      status: 'string - Subscription status',
      customerId: 'string - The customer ID',
    },
  })
}
