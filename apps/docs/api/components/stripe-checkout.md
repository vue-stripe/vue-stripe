# StripeCheckout

A button component that redirects users to Stripe's hosted checkout page for completing payments.

::: tip Simple Integration
StripeCheckout requires only a `StripeProvider` wrapper - no `StripeElements` or `clientSecret` needed. It's the simplest way to accept payments with Stripe.
:::

## What is Stripe Checkout?

Stripe Checkout provides a hosted, pre-built payment page:

| Feature | Description |
|---------|-------------|
| **Hosted by Stripe** | Secure, PCI-compliant payment page |
| **Automatic Payment Methods** | Cards, wallets, bank transfers based on customer location |
| **Built-in Features** | Discounts, taxes, shipping, receipts included |
| **No Custom UI** | Zero frontend payment UI development needed |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Create Checkout Session on your backend                 │
│     Returns: session_id (cs_...)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. StripeCheckout component renders a button               │
│     Pass: sessionId OR priceId + mode                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User clicks the checkout button                         │
│     StripeCheckout calls redirectToCheckout()               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. User redirected to Stripe's hosted checkout page        │
│     - Stripe handles payment UI                             │
│     - Stripe handles 3D Secure                              │
│     - Stripe handles payment method selection               │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  Payment Successful     │     │  Payment Cancelled          │
│                         │     │                             │
│  → successUrl           │     │  → cancelUrl                │
└─────────────────────────┘     └─────────────────────────────┘
```

## Usage

### Session-Based Checkout (Recommended)

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeCheckout
      :session-id="sessionId"
      button-text="Pay $49.99"
      @click="onCheckoutClick"
      @error="onCheckoutError"
    />
  </StripeProvider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { StripeProvider, StripeCheckout } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const sessionId = ref('')

onMounted(async () => {
  // Create Checkout Session on your server
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: 'price_xxx' })
  })
  const data = await response.json()
  sessionId.value = data.sessionId
})

const onCheckoutClick = () => {
  console.log('Redirecting to checkout...')
}

const onCheckoutError = (error) => {
  console.error('Checkout error:', error.message)
}
</script>
```

### Price-Based Checkout

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeCheckout
      :price-id="priceId"
      mode="payment"
      :success-url="successUrl"
      :cancel-url="cancelUrl"
      button-text="Subscribe Now"
    />
  </StripeProvider>
</template>

<script setup>
import { StripeProvider, StripeCheckout } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const priceId = 'price_xxx'
const successUrl = 'https://example.com/success'
const cancelUrl = 'https://example.com/cancel'
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sessionId` | `string` | No* | - | Checkout Session ID (starts with `cs_`) |
| `priceId` | `string` | No* | - | Price ID for client-side session creation |
| `mode` | `'payment' \| 'subscription'` | No | `'payment'` | Checkout mode (only with `priceId`) |
| `successUrl` | `string` | No | `window.location.origin + '/success'` | Redirect URL after successful payment |
| `cancelUrl` | `string` | No | `window.location.origin + '/cancel'` | Redirect URL when user cancels |
| `customerEmail` | `string` | No | - | Pre-fill customer's email |
| `clientReferenceId` | `string` | No | - | Reference ID for your application |
| `submitType` | `'auto' \| 'book' \| 'donate' \| 'pay'` | No | `'auto'` | Button text on Stripe's checkout page |
| `buttonText` | `string` | No | `'Checkout'` | Text displayed on the button |
| `loadingText` | `string` | No | `'Redirecting...'` | Text shown during redirect |
| `disabled` | `boolean` | No | `false` | Disable the checkout button |
| `buttonClass` | `string` | No | `'vue-stripe-checkout-button'` | Custom CSS class for the button |
| `options` | `Partial<RedirectToCheckoutOptions>` | No | - | Additional Stripe options |

*Either `sessionId` or `priceId` is required.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@click` | - | Emitted when checkout button is clicked |
| `@success` | - | Emitted when redirect initiates successfully |
| `@error` | `Error` | Emitted when checkout fails |

### Error Event

```ts
interface CheckoutError extends Error {
  message: string
  // Common error messages:
  // - "sessionId or priceId is required"
  // - "Stripe not initialized"
  // - "Session expired"
}
```

## Slots

### Default Slot

Customize the button content:

```vue
<StripeCheckout :session-id="sessionId">
  <span class="custom-checkout">
    <IconCart /> Complete Purchase
  </span>
</StripeCheckout>
```

### Loading Slot

Customize the loading state:

```vue
<StripeCheckout :session-id="sessionId">
  <template #loading>
    <Spinner /> Please wait...
  </template>
</StripeCheckout>
```

## Examples

### With Custom Styling

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeCheckout
      :session-id="sessionId"
      button-class="my-checkout-button"
    >
      <span class="button-content">
        <CreditCardIcon />
        <span>Pay $99.00</span>
      </span>
    </StripeCheckout>
  </StripeProvider>
</template>

<style scoped>
.my-checkout-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
```

### Subscription Checkout

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <div class="pricing-card">
      <h3>Pro Plan</h3>
      <p class="price">$29/month</p>

      <StripeCheckout
        :price-id="proPriceId"
        mode="subscription"
        :success-url="successUrl"
        :cancel-url="cancelUrl"
        :customer-email="userEmail"
        button-text="Start Pro Plan"
      />
    </div>
  </StripeProvider>
</template>
```

### With Error Handling

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <div class="checkout-container">
      <StripeCheckout
        :session-id="sessionId"
        :disabled="!sessionId"
        @error="handleError"
      />

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </StripeProvider>
</template>

<script setup>
import { ref } from 'vue'

const error = ref(null)

const handleError = (err) => {
  error.value = err.message

  // Handle specific error types
  if (err.message.includes('Session expired')) {
    // Refresh the session
    refreshSession()
  }
}
</script>
```

### Conditional Rendering

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <div v-if="loading">
      Creating checkout session...
    </div>

    <StripeCheckout
      v-else-if="sessionId"
      :session-id="sessionId"
      button-text="Complete Purchase"
    />

    <div v-else class="error">
      Failed to create checkout session
    </div>
  </StripeProvider>
</template>
```

## Backend Setup

### Create Checkout Session (Node.js)

```js
const stripe = require('stripe')('sk_test_...')

app.post('/api/create-checkout-session', async (req, res) => {
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

### Using Stripe CLI

```bash
# Create a one-time payment session
stripe checkout sessions create \
  --line-items[0][price]=price_xxx \
  --line-items[0][quantity]=1 \
  --mode=payment \
  --success-url=https://example.com/success \
  --cancel-url=https://example.com/cancel
```

## TypeScript

```ts
import { StripeProvider, StripeCheckout } from '@vue-stripe/vue-stripe'
import type { RedirectToCheckoutOptions } from '@stripe/stripe-js'

// Props typing
const sessionId: string = 'cs_test_...'
const priceId: string = 'price_xxx'
const mode: 'payment' | 'subscription' = 'payment'

// Additional options
const options: Partial<RedirectToCheckoutOptions> = {
  // Custom options if needed
}

// Event handlers
const handleClick = () => {
  console.log('Checkout started')
}

const handleError = (error: Error) => {
  console.error('Checkout failed:', error.message)
}
```

## Session-Based vs Price-Based

| Aspect | Session-Based | Price-Based |
|--------|---------------|-------------|
| **Setup** | Requires backend | Frontend only |
| **Flexibility** | Full control over session options | Limited to basic options |
| **Security** | More secure (server-side) | Less secure (client-side) |
| **Use Case** | Production apps | Prototypes, simple products |
| **Recommended** | Yes | For testing only |

## Checkout vs Payment Element

| Feature | Checkout | Payment Element |
|---------|----------|-----------------|
| **Integration** | Simple (redirect) | Complex (embedded) |
| **Customization** | Limited | Full control |
| **Location** | Stripe-hosted | Your site |
| **PCI Compliance** | Stripe handles | You manage |
| **Development Time** | Minutes | Hours/Days |

Choose **Checkout** when you want the fastest integration with minimal code.
Choose **Payment Element** when you need full UI customization.

## See Also

- [useStripeCheckout](/api/composables/use-stripe-checkout) - Programmatic checkout redirect
- [Checkout Guide](/guide/checkout) - Step-by-step implementation guide
- [Payment Element](/api/components/stripe-payment-element) - Embedded payment UI
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout) - Official documentation
