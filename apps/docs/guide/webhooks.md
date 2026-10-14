---
description: "Fulfil orders from Stripe webhooks on your server: handle the events for your integration, make fulfilment idempotent and test with the Stripe CLI."
---

# Fulfil orders with webhooks

Ship the goods, grant access or mark the order paid from your server, when Stripe tells it that the money arrived. This works for every Vue Stripe integration: Payment Element, Checkout (hosted, embedded or on a Checkout Session), bank debits and subscriptions.

::: warning Don't fulfil from the browser
The return page and the result of `confirmPayment()` only tell you what the customer's browser saw. A customer can close the tab before the redirect, open your success URL directly, or pay with a method that settles days later (SEPA, BECS, ACH). Use them to show a message, and fulfil from the webhook.
:::

Before you start you need a server where you can add a route, and your secret key there. The examples use Node with Express and [stripe-node](https://github.com/stripe/stripe-node).

## 1. Add the webhook endpoint

Stripe signs every event. Verify the signature against the **raw** request body before you trust it, so mount the route with `express.raw()` and before any global `express.json()`:

```js
// server.js
import express from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET // whsec_...

const app = express()

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], endpointSecret)
  } catch (err) {
    return res.status(400).send(`Webhook signature check failed: ${err.message}`)
  }

  await handleEvent(event) // step 2
  res.json({ received: true })
})

app.use(express.json()) // your other routes come after the webhook route
```

In other frameworks, pass the unparsed body to `constructEvent()`: `await request.text()` in a Next.js route handler, `await readRawBody(event)` in a Nuxt server route, `$request->getContent()` in Laravel. [Receive webhooks](/guide/ssr#_7-receive-webhooks) in the SSR guide has a typed Nuxt route, with the signing secret in `runtimeConfig`.

::: tip Laravel
Laravel's CSRF check answers Stripe's POST with 419 before your code runs, so exempt the webhook route in `bootstrap/app.php` (or put it in `routes/api.php`). [Receive webhooks](/guide/laravel#_6-receive-webhooks) in the Laravel guide has the route and a controller with `\Stripe\Webhook::constructEvent()`.
:::

## 2. Handle the events for your integration

Listen for the events that match how you take payments:

- **Checkout Sessions** ([hosted](/guide/checkout), [embedded](/guide/embedded-checkout), [your own page](/guide/custom-checkout), [Checkout Form](/guide/checkout-form), [pricing table](/guide/pricing-table)): fulfil on `checkout.session.completed` when the session's `payment_status` is `paid` or `no_payment_required`. Payment methods that settle later send `checkout.session.async_payment_succeeded` or `checkout.session.async_payment_failed` afterwards.
- **PaymentIntents** ([Payment Element](/guide/payment-element), [card](/guide/card-element), [SEPA](/guide/iban-element), [BECS](/guide/au-bank-account-element), [ACH](/guide/ach-debit)): fulfil on `payment_intent.succeeded`. Bank debits send `payment_intent.processing` first (tell the customer the payment is pending) and settle days later: SEPA within a few business days, BECS in three to four, ACH within four. Failures send `payment_intent.payment_failed`.
- **[Saved payment methods](/guide/setup-intent)**: `setup_intent.succeeded`, or `setup_intent.setup_failed`.
- **[Subscriptions](/guide/subscriptions)**: grant access on `invoice.paid`; handle `invoice.payment_failed` and `customer.subscription.deleted`.
- **[Identity](/guide/identity)**: `identity.verification_session.verified`, or `identity.verification_session.requires_input`.

```js
async function handleEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object
      if (session.payment_status !== 'unpaid') await fulfilOrder(session.client_reference_id, session.id)
      break
    }
    case 'checkout.session.async_payment_failed':
      await markOrderFailed(event.data.object.client_reference_id)
      break

    case 'payment_intent.succeeded':
      await fulfilOrder(event.data.object.metadata.orderId, event.data.object.id)
      break
    case 'payment_intent.processing':
      await markOrderPending(event.data.object.metadata.orderId)
      break
    case 'payment_intent.payment_failed':
      await markOrderFailed(event.data.object.metadata.orderId)
      break
  }
}
```

To find your order from the event, store its ID on the Stripe object when you create it: `client_reference_id` or `metadata` on the Checkout Session, `metadata` on the PaymentIntent.

## 3. Make fulfilment safe to repeat

Stripe retries an event until your endpoint answers with a `2xx` status, and can deliver the same event more than once. So:

- Make `fulfilOrder()` idempotent: check whether the order is already fulfilled (or record `event.id`) before you act.
- Answer quickly. If fulfilment is slow (emails, shipping APIs), record the event, respond `200`, and do the work in a background job.
- Don't rely on the order in which events arrive; read the object's current `status` when it matters.

## 4. Test locally with the Stripe CLI

Forward test-mode events to your local server, naming the events from step 2:

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,payment_intent.succeeded,payment_intent.processing,payment_intent.payment_failed \
  --forward-to localhost:3000/webhook
```

The Stripe CLI needs the event selection: version 1.53 refuses to start `listen` without `--events`, `--all-snapshot` or `--all-thin`, with "must specify events to forward". Use `--all-snapshot` instead of `--events` to forward every event while you explore.

Set `STRIPE_WEBHOOK_SECRET` to the `whsec_...` secret that `stripe listen` prints, then pay in your app with a [test card](/guide/testing) and watch the events arrive. To send a single event without paying, trigger it:

```bash
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

For bank debits, the delayed test accounts in [Test your integration](/guide/testing) let you see `processing` followed by `succeeded` or `payment_failed` a few minutes later.

## 5. Register the endpoint for production

In the Stripe Dashboard, add a webhook endpoint (an event destination) with your public URL, for example `https://example.com/webhook`, and select the events from step 2. Each endpoint has its own signing secret: put the live one in `STRIPE_WEBHOOK_SECRET` on your production server.

## 6. Show the outcome on the return page

The webhook does the work; the page the customer returns to only reports it. For Checkout, put the session ID in the success URL and read the session on your server:

```js
// success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}'
app.get('/api/checkout-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id)
    res.json({ status: session.status, paymentStatus: session.payment_status })
  } catch {
    res.status(404).json({ error: 'No such Checkout Session' })
  }
})
```

If your `fulfilOrder()` is idempotent (step 3), you can also call it here when `payment_status` is `paid`: the customer sees the result without waiting for the webhook, and the webhook still covers closed tabs and delayed payments. For PaymentIntents, read the status in the browser with `retrievePaymentIntent()`, as shown in [Handle errors and declines](/guide/error-handling#_4-check-the-result-on-the-return-page).

## Result

Orders are fulfilled once per payment, from a verified event, whether the customer's browser came back or not, and delayed bank payments are fulfilled when they settle.
