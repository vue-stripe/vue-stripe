import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Enable CORS
const corsHandler = cors({ origin: true });

/**
 * Create a Payment Intent
 */
export const createPaymentIntent = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { amount, currency = 'usd', metadata = {} } = request.body;

      if (!amount || amount <= 0) {
        response.status(400).json({ error: 'Invalid amount' });
        return;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      response.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      response.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create a Setup Intent
 */
export const createSetupIntent = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { customerId, metadata = {} } = request.body;

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      response.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      });
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      response.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create a Customer
 */
export const createCustomer = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { email, name, metadata = {} } = request.body;

      if (!email) {
        response.status(400).json({ error: 'Email is required' });
        return;
      }

      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      response.json({
        customerId: customer.id,
        customer,
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      response.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create a Checkout Session
 */
export const createCheckoutSession = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const {
        lineItems,
        mode = 'payment',
        successUrl,
        cancelUrl,
        customerId,
        metadata = {},
      } = request.body;

      if (!lineItems || !successUrl || !cancelUrl) {
        response.status(400).json({ 
          error: 'Missing required fields: lineItems, successUrl, cancelUrl' 
        });
        return;
      }

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      };

      if (customerId) {
        sessionConfig.customer = customerId;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      response.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      response.status(500).json({ error: error.message });
    }
  });
});

/**
 * Webhook Handler
 */
export const handleWebhook = functions.https.onRequest(async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    response.status(400).send('Missing stripe signature or webhook secret');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      endpointSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      // TODO: Fulfill the purchase, send email, etc.
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', failedPayment.id);
      // TODO: Notify customer of failure
      break;

    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);
      // TODO: Fulfill the order
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription event:', event.type, subscription.id);
      // TODO: Update subscription in database
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
});