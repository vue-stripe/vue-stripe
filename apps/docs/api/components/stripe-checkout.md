# VueStripeCheckout

A button component that redirects users to Stripe's hosted checkout page for completing payments.

::: tip Simple Integration
StripeCheckout requires only a `VueStripeProvider` wrapper - no `VueStripeElements` or `clientSecret` needed. It's the simplest way to accept payments with Stripe.
:::

::: warning @stripe/stripe-js v8.x Compatibility
In `@stripe/stripe-js` v8.x, the `redirectToCheckout` method was removed. Use the `sessionUrl` prop with the Checkout Session URL from your backend instead of `sessionId`. See [v8.x Migration](#v8-x-migration) below.
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
│     Returns: { url: 'https://checkout.stripe.com/...' }     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. StripeCheckout component renders a button               │
│     Pass: sessionUrl (v8.x) or sessionId (v7.x legacy)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User clicks the checkout button                         │
│     v8.x: window.location.replace(sessionUrl)               │
│     v7.x: stripe.redirectToCheckout({ sessionId })          │
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

### URL-Based Checkout (Recommended for v8.x)

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckout
      :session-url="sessionUrl"
      button-text="Pay $49.99"
      @checkout="onCheckoutClick"
      @error="onCheckoutError"
    />
  </VueStripeProvider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeCheckout } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const sessionUrl = ref('')

onMounted(async () => {
  // Create Checkout Session on your server
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: 'price_xxx' })
  })
  const data = await response.json()
  sessionUrl.value = data.url // Backend returns session URL
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
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckout
      :price-id="priceId"
      mode="payment"
      :success-url="successUrl"
      :cancel-url="cancelUrl"
      button-text="Subscribe Now"
    />
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeCheckout } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const priceId = 'price_xxx'
const successUrl = 'https://example.com/success'
const cancelUrl = 'https://example.com/cancel'
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sessionUrl` | `string` | No* | - | Checkout Session URL from Stripe API **(v8.x compatible, recommended)** |
| `sessionId` | `string` | No* | - | Checkout Session ID (starts with `cs_`) - v7.x only |
| `priceId` | `string` | No* | - | Price ID for client-side session creation - v7.x only, deprecated |
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

*One of `sessionUrl`, `sessionId`, or `priceId` is required. For v8.x compatibility, use `sessionUrl`.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@checkout` | - | Emitted when checkout is initiated (button clicked or `checkout()` called) |
| `@success` | - | Emitted when redirect initiates successfully |
| `@error` | `Error` | Emitted when checkout fails |
| `@before-redirect` | `{ url: string }` | Emitted before redirecting (only with `sessionUrl`) |

### Error Event

```ts
interface CheckoutError extends Error {
  message: string
  // Common error messages:
  // - "Either sessionUrl, sessionId, or priceId is required"
  // - "Stripe not initialized"
  // - "redirectToCheckout is not available" (v8.x)
  // - "Session expired"
}
```

## Exposed Methods

The component exposes a `checkout` method via template ref for programmatic control:

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckout
      ref="checkoutRef"
      :session-url="sessionUrl"
    />
    <button @click="triggerCheckout">Custom Trigger</button>
  </VueStripeProvider>
</template>

<script setup>
import { ref } from 'vue'

const checkoutRef = ref()

const triggerCheckout = () => {
  checkoutRef.value.checkout()
}
</script>
```

| Method | Description |
|--------|-------------|
| `checkout()` | Programmatically trigger the checkout redirect |

| Exposed State | Type | Description |
|---------------|------|-------------|
| `loading` | `Ref<boolean>` | Whether checkout is in progress |

## Slots

### Default Slot

Replace the entire button with your own implementation. The component automatically handles click events, so you don't need to wire up checkout manually:

```vue
<!-- Simple: Your button automatically triggers checkout on click -->
<VueStripeCheckout :session-url="sessionUrl">
  <button class="my-custom-button">Pay Now</button>
</VueStripeCheckout>
```

For more control, use scoped slot props:

```vue
<!-- Advanced: Access loading/disabled state via scoped slot -->
<VueStripeCheckout :session-url="sessionUrl">
  <template #default="{ checkout, loading, disabled }">
    <MyCustomButton
      :loading="loading"
      :disabled="disabled"
      @click="checkout"
    >
      {{ loading ? 'Processing...' : 'Pay Now' }}
    </MyCustomButton>
  </template>
</VueStripeCheckout>
```

| Slot Prop | Type | Description |
|-----------|------|-------------|
| `checkout` | `() => Promise<void>` | Function to trigger checkout |
| `loading` | `boolean` | Whether checkout is in progress |
| `disabled` | `boolean` | Whether checkout is disabled |

::: tip Automatic Click Handling
When you pass custom content without using scoped slot syntax, clicking anywhere inside the slot content will trigger checkout. For fine-grained control over which element triggers checkout, use the scoped slot with the `checkout` function.
:::

## Examples

### With Custom Styling

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckout
      :session-id="sessionId"
      button-class="my-checkout-button"
    >
      <span class="button-content">
        <CreditCardIcon />
        <span>Pay $99.00</span>
      </span>
    </VueStripeCheckout>
  </VueStripeProvider>
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
  <VueStripeProvider :publishable-key="publishableKey">
    <div class="pricing-card">
      <h3>Pro Plan</h3>
      <p class="price">$29/month</p>

      <VueStripeCheckout
        :price-id="proPriceId"
        mode="subscription"
        :success-url="successUrl"
        :cancel-url="cancelUrl"
        :customer-email="userEmail"
        button-text="Start Pro Plan"
      />
    </div>
  </VueStripeProvider>
</template>
```

### With Error Handling

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <div class="checkout-container">
      <VueStripeCheckout
        :session-id="sessionId"
        :disabled="!sessionId"
        @error="handleError"
      />

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </VueStripeProvider>
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
  <VueStripeProvider :publishable-key="publishableKey">
    <div v-if="loading">
      Creating checkout session...
    </div>

    <VueStripeCheckout
      v-else-if="sessionId"
      :session-id="sessionId"
      button-text="Complete Purchase"
    />

    <div v-else class="error">
      Failed to create checkout session
    </div>
  </VueStripeProvider>
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
import { VueStripeProvider, VueStripeCheckout } from '@vue-stripe/vue-stripe'
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

## URL-Based vs Session-Based vs Price-Based

| Aspect | URL-Based (v8.x) | Session-Based (v7.x) | Price-Based (v7.x) |
|--------|------------------|----------------------|-------------------|
| **Setup** | Requires backend | Requires backend | Frontend only |
| **Flexibility** | Full control | Full control | Limited options |
| **Security** | Most secure | Secure | Less secure |
| **Use Case** | Production apps | Legacy v7.x apps | Prototypes only |
| **Recommended** | ✅ Yes | For v7.x only | ❌ No |
| **v8.x Compatible** | ✅ Yes | ❌ No | ❌ No |

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

## v8.x Migration

In `@stripe/stripe-js` v8.x, the `redirectToCheckout` method was removed. Here's how to migrate:

### Before (v7.x)

```vue
<!-- Using session ID with redirectToCheckout -->
<VueStripeCheckout :session-id="sessionId" />
```

```js
// Backend returns session ID
res.json({ sessionId: session.id })
```

### After (v8.x)

```vue
<!-- Using session URL with direct redirect -->
<VueStripeCheckout :session-url="sessionUrl" />
```

```js
// Backend returns session URL
res.json({ url: session.url })
```

### Version Compatibility

| Prop | @stripe/stripe-js v7.x | @stripe/stripe-js v8.x |
|------|------------------------|------------------------|
| `sessionUrl` | ✅ Works | ✅ Works (recommended) |
| `sessionId` | ✅ Works | ❌ Error |
| `priceId` | ✅ Works (deprecated) | ❌ Error |

### Backend Changes

Update your backend to return the session URL:

```js
const session = await stripe.checkout.sessions.create({
  // ... options
})

// v7.x: res.json({ sessionId: session.id })
// v8.x:
res.json({ url: session.url })
```

## See Also

- [useStripeCheckout](/api/composables/use-stripe-checkout) - Programmatic checkout redirect
- [Checkout Guide](/guide/checkout) - Step-by-step implementation guide
- [Payment Element](/api/components/stripe-payment-element) - Embedded payment UI
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout) - Official documentation
