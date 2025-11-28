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
<StripePaymentElement />
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
<StripeCardElement />

<!-- Or split into separate fields -->
<StripeCardNumberElement />
<StripeCardExpiryElement />
<StripeCardCvcElement />
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
<StripeExpressCheckoutElement @click="onExpressClick" />
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

const { redirectToCheckout } = useStripeCheckout()

const handleBuy = async () => {
  await redirectToCheckout({
    lineItems: [{ price: 'price_xxx', quantity: 1 }],
    mode: 'payment',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel'
  })
}
</script>

<template>
  <button @click="handleBuy">Buy Now</button>
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
  <StripeProvider :publishable-key="key">
    <StripeElements :client-secret="secret">
      <!-- Quick payment options at top -->
      <StripeExpressCheckoutElement @confirm="onExpressConfirm" />

      <div class="divider">Or pay with card</div>

      <!-- Full payment form below -->
      <StripePaymentElement />
      <button @click="handleSubmit">Pay</button>
    </StripeElements>
  </StripeProvider>
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
