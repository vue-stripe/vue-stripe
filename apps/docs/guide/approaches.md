# Choosing Your Approach

Stripe offers several ways to collect payments. Here's how to choose the right one for your use case.

## Quick Comparison

| Approach | Best For | Customization | Implementation |
|----------|----------|---------------|----------------|
| **Payment Element** | Most use cases | High | Medium |
| **Card Element** | Card-only payments | Highest | Medium |
| **Express Checkout** | Quick payments | Low | Easy |
| **Checkout (Hosted)** | Fastest launch | Low | Easiest |

## Payment Element (Recommended)

The Payment Element is Stripe's modern, all-in-one solution. It automatically shows the best payment methods for your customer.

```vue
<VueStripePaymentElement />
```

**Pros:**
- Supports 40+ payment methods automatically
- Adapts to customer's location and device
- Handles complex flows (authentication, redirects)
- Constantly updated by Stripe

**Cons:**
- Less control over individual fields
- Requires `clientSecret` (backend integration)

**Best for:** Most e-commerce, SaaS, and marketplace applications.

[Learn more about Payment Element →](/guide/payment-element)

## Card Element

The Card Element gives you more control over the card input experience.

```vue
<!-- Single unified input -->
<VueStripeCardElement />

<!-- Or split into separate fields -->
<VueStripeCardNumberElement />
<VueStripeCardExpiryElement />
<VueStripeCardCvcElement />
```

**Pros:**
- Maximum layout control
- Split fields for custom designs
- Lightweight (card-only)

**Cons:**
- Only supports card payments
- You handle other payment methods separately
- More work to add new payment types

**Best for:** Card-only checkouts, custom payment forms, POS-style interfaces.

[Learn more about Card Element →](/guide/card-element)

## Express Checkout Element

Shows Apple Pay, Google Pay, and Link buttons for one-tap payments.

```vue
<VueStripeExpressCheckoutElement @click="onExpressClick" />
```

**Pros:**
- One-tap payments
- High conversion for returning customers
- Works alongside other elements

**Cons:**
- Not all customers have wallets set up
- Limited to supported payment methods
- Requires HTTPS (even in development)

**Best for:** Adding wallet payments to any checkout flow.

[Learn more about Express Checkout →](/guide/express-checkout)

## Stripe Checkout (Hosted Page)

Redirect customers to Stripe's hosted payment page. No payment UI to build.

```vue
<script setup>
import { useStripeCheckout } from '@vue-stripe/vue-stripe'

const { redirectToUrl, loading, error } = useStripeCheckout()

const handleBuy = async () => {
  // Create a Checkout Session on your server (@stripe/stripe-js v8.x)
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: 'price_xxx' })
  })
  const { url } = await response.json()

  // Redirect to the hosted Checkout page
  redirectToUrl(url)
  // Or: await redirectToCheckout({ url })
}
</script>

<template>
  <button :disabled="loading" @click="handleBuy">Buy Now</button>
  <p v-if="error">{{ error }}</p>
</template>
```

**Pros:**
- Zero payment UI to build
- PCI compliance handled by Stripe
- Built-in features (coupons, shipping, tax)
- Mobile-optimized

**Cons:**
- Customers leave your site
- Limited customization
- Less control over the experience

**Best for:** Quick launches, simple products, subscription sign-ups.

## Decision Flowchart

```
Do you need custom UI?
│
├─ No → Use Stripe Checkout (Hosted)
│
└─ Yes → Do you need multiple payment methods?
          │
          ├─ Yes → Use Payment Element
          │        (optionally add Express Checkout)
          │
          └─ No (cards only) → Use Card Element
                               (optionally add Express Checkout)
```

## Combining Approaches

You can mix approaches in the same checkout:

```vue
<template>
  <VueStripeProvider :publishable-key="key">
    <VueStripeElements :client-secret="secret">
      <!-- Quick payment options at top -->
      <VueStripeExpressCheckoutElement @confirm="onExpressConfirm" />

      <div class="divider">Or pay with card</div>

      <!-- Full payment form below -->
      <VueStripePaymentElement />
      <button @click="handleSubmit">Pay</button>
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## Migration Path

Starting simple and need to upgrade later?

| From | To | Effort |
|------|----|--------|
| Checkout → Payment Element | Medium | Requires backend changes |
| Card Element → Payment Element | Low | Mostly frontend changes |
| Payment Element → Custom | Low | Already have the foundation |

## Next Steps

Choose your approach and dive deeper:

- [Payment Element Guide](/guide/payment-element) - The recommended approach
- [Card Element Guide](/guide/card-element) - For card-only payments
- [Express Checkout Guide](/guide/express-checkout) - Add wallet payments
