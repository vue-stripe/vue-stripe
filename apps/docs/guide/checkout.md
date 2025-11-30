# Stripe Checkout

Redirect users to Stripe's hosted checkout page for a quick, secure payment experience without building custom payment UI.

## Why Use Checkout?

| Feature | Benefit |
|---------|---------|
| **No custom UI** | Stripe handles the entire payment form |
| **PCI compliant** | Payment data never touches your servers |
| **Multiple payment methods** | Cards, wallets, bank transfers automatically |
| **Built-in features** | Taxes, shipping, discounts, receipts included |
| **Mobile optimized** | Responsive design works on all devices |

## When to Use Checkout

| Scenario | Description |
|----------|-------------|
| **Quick integration** | Get payments working in minutes |
| **Simple products** | One-time purchases or subscriptions |
| **Global customers** | Stripe auto-shows relevant payment methods |
| **Minimal frontend work** | Don't want to build payment UI |

::: tip Checkout vs Payment Element
- **Checkout** = Redirect to Stripe-hosted page (simplest)
- **Payment Element** = Embed payment UI in your app (customizable)

Choose Checkout when you want the fastest integration with minimal code.
:::

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Your backend creates a Checkout Session                 │
│     POST /v1/checkout/sessions → { id: 'cs_xxx' }           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend receives session ID                            │
│     Pass to StripeCheckout component or useStripeCheckout   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User clicks checkout button                             │
│     redirectToCheckout({ sessionId: 'cs_xxx' })             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. User redirected to Stripe's checkout page               │
│     - Enters payment details                                │
│     - Handles 3D Secure if needed                           │
│     - Submits payment                                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  Payment Successful     │     │  Payment Cancelled          │
│                         │     │                             │
│  → Redirect to          │     │  → Redirect to              │
│    success_url          │     │    cancel_url               │
└─────────────────────────┘     └─────────────────────────────┘
```

## Required Components

Checkout only needs `VueStripeProvider` - no `VueStripeElements` required:

```
StripeProvider
  └─ StripeCheckout (button that redirects)
```

| Component | Role |
|-----------|------|
| `VueStripeProvider` | Loads Stripe.js |
| `VueStripeCheckout` | Renders button, handles redirect |

## Basic Implementation

### Step 1: Create a Checkout Session (Backend)

```js
// Node.js / Express
const stripe = require('stripe')('sk_test_...')

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: req.body.priceId,
        quantity: 1
      }
    ],
    mode: 'payment', // or 'subscription'
    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://example.com/cancel'
  })

  res.json({ sessionId: session.id })
})
```

### Step 2: Add the Checkout Button

```vue
<script setup>
import { ref, onMounted } from 'vue'
import {
  StripeProvider,
  StripeCheckout
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const sessionId = ref('')
const loading = ref(true)

// Fetch session on mount
onMounted(async () => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: 'price_xxx' })
  })
  const data = await response.json()
  sessionId.value = data.sessionId
  loading.value = false
})
</script>

<template>
  <div v-if="loading">Loading...</div>

  <VueStripeProvider v-else :publishable-key="publishableKey">
    <VueStripeCheckout
      :session-id="sessionId"
      button-text="Pay $49.99"
      @error="(err) => console.error(err.message)"
    />
  </VueStripeProvider>
</template>
```

## Using the Composable

For more control, use `useStripeCheckout` instead of the component:

```vue
<script setup>
import { ref, onMounted } from 'vue'
import {
  StripeProvider,
  useStripeCheckout
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <CheckoutForm />
  </VueStripeProvider>
</template>
```

```vue
<!-- CheckoutForm.vue (inside StripeProvider) -->
<script setup>
import { ref } from 'vue'
import { useStripeCheckout } from '@vue-stripe/vue-stripe'

const { redirectToCheckout, loading, error } = useStripeCheckout()

const handleCheckout = async () => {
  // Create session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ product: 'pro_plan' })
  })
  const { sessionId } = await response.json()

  // Redirect to checkout
  try {
    await redirectToCheckout({ sessionId })
  } catch (err) {
    console.error('Checkout failed:', err.message)
  }
}
</script>

<template>
  <button @click="handleCheckout" :disabled="loading">
    {{ loading ? 'Redirecting...' : 'Checkout' }}
  </button>
  <p v-if="error" class="error">{{ error }}</p>
</template>
```

## Subscription Checkout

For recurring payments, set `mode: 'subscription'`:

```js
// Backend
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: 'price_monthly_pro', // Recurring price
      quantity: 1
    }
  ],
  mode: 'subscription',
  success_url: 'https://example.com/welcome',
  cancel_url: 'https://example.com/pricing'
})
```

```vue
<!-- Frontend -->
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <div class="pricing-card">
      <h3>Pro Plan</h3>
      <p>$29/month</p>

      <VueStripeCheckout
        :session-id="proSessionId"
        button-text="Subscribe to Pro"
      />
    </div>
  </VueStripeProvider>
</template>
```

## Session-Based vs Price-Based

### Session-Based (Recommended)

Create session on backend, pass session ID to frontend:

```vue
<VueStripeCheckout :session-id="sessionId" />
```

**Pros:**
- Full control over session options
- More secure (server-side)
- Supports all Checkout features

### Price-Based (Simple)

Create session client-side with just a Price ID:

```vue
<VueStripeCheckout
  :price-id="priceId"
  mode="payment"
  :success-url="successUrl"
  :cancel-url="cancelUrl"
/>
```

**Pros:**
- No backend needed
- Quick prototyping

**Cons:**
- Limited options
- Less secure
- Not recommended for production

## Handling Success

After payment, Stripe redirects to your `success_url`:

```js
// success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}'

// Backend: Retrieve the session to confirm payment
app.get('/success', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id)

  if (session.payment_status === 'paid') {
    // Fulfill the order
    await fulfillOrder(session)
    res.render('success')
  }
})
```

::: warning Don't Trust the Redirect
Always verify payment status on your backend. Users could navigate directly to your success URL.
:::

## Webhooks

For reliable payment tracking, use webhooks:

```js
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature']
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    fulfillOrder(session)
  }

  res.json({ received: true })
})
```

## Customizing Checkout

### Session Options

```js
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  mode: 'payment',

  // Customize
  customer_email: 'customer@example.com',
  client_reference_id: 'order_123',

  // Shipping
  shipping_address_collection: {
    allowed_countries: ['US', 'CA', 'GB']
  },

  // Discounts
  allow_promotion_codes: true,

  // Taxes
  automatic_tax: { enabled: true },

  // Branding (Dashboard → Settings → Branding)
  // Custom logo, colors, favicon

  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel'
})
```

### Button Styling

```vue
<VueStripeCheckout
  :session-id="sessionId"
  button-class="my-checkout-button"
>
  <span class="button-content">
    <CreditCardIcon /> Complete Purchase
  </span>
</VueStripeCheckout>

<style>
.my-checkout-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
}
</style>
```

## Error Handling

```vue
<script setup>
const handleError = (error) => {
  if (error.message.includes('Session expired')) {
    // Refresh the session
    refreshSession()
  } else if (error.message.includes('Stripe not initialized')) {
    // Wait for Stripe to load
    console.log('Please wait...')
  } else {
    console.error('Checkout error:', error.message)
  }
}
</script>

<template>
  <VueStripeCheckout
    :session-id="sessionId"
    @error="handleError"
  />
</template>
```

## Testing

### Test Cards

| Card Number | Behavior |
|-------------|----------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

### Stripe CLI

Create test sessions without a backend:

```bash
# Create a checkout session
stripe checkout sessions create \
  --line-items[0][price]=price_xxx \
  --line-items[0][quantity]=1 \
  --mode=payment \
  --success-url=https://example.com/success \
  --cancel-url=https://example.com/cancel

# Listen for webhooks
stripe listen --forward-to localhost:3000/webhook
```

## Next Steps

- [StripeCheckout API](/api/components/stripe-checkout) — Component reference
- [useStripeCheckout API](/api/composables/use-stripe-checkout) — Composable reference
- [Payment Element](/guide/payment-element) — For embedded payment UI
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout) — Official guide
