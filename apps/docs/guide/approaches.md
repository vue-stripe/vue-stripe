# Choosing Your Approach

Stripe offers several ways to collect payments. Here's how to choose the right one for your use case.

## Quick Comparison

| Approach | Best For | Customization | Implementation |
|----------|----------|---------------|----------------|
| **Payment Element** | Most use cases | High | Medium |
| **Card Element** | Card-only payments | Highest | Medium |
| **Express Checkout** | Quick payments | Low | Easy |
| **Checkout (Hosted)** | Fastest launch | Low | Easiest |
| **Embedded Checkout** | Stripe's Checkout form on your own page | Low | Easiest |
| **Elements with Checkout Sessions** | Own page, Stripe-managed totals/tax/discounts | High | Medium |
| **Checkout Form** (beta) | Stripe's complete form as one element on your page | Low | Easy |

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
- Needs an Intent: a `clientSecret`, or `mode` / `currency` / `amount` on `VueStripeElements` and an Intent created at submit time (backend integration either way)

**Best for:** Most e-commerce, SaaS, and marketplace applications.

::: info Bank-redirect methods
Stripe removed the standalone iDEAL, P24, EPS and FPX elements in Stripe.js Clover (8.0); collect these payment methods with the Payment Element.
:::

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
  // Create a Checkout Session on your server; it returns session.url
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
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

No `VueStripeProvider` is needed for the redirect. [Learn more about Stripe Checkout →](/guide/checkout)

## Embedded Checkout

Stripe's prebuilt Checkout page in an iframe on your own page. Create the session with `ui_mode: 'embedded_page'` and pass its client secret:

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeEmbeddedCheckout :client-secret="clientSecret" />
</VueStripeProvider>
```

**Pros:**
- Customers stay on your site
- Stripe builds the whole form: payment methods, addresses, tax, promotion codes
- One component, no form code

**Cons:**
- Limited customization (Dashboard branding only)
- One Embedded Checkout per page

[Learn more about Embedded Checkout →](/guide/embedded-checkout)

## Elements with Checkout Sessions

Keep Checkout Sessions on the server (Stripe computes line items, tax, discounts and shipping) but render the payment UI on your own page with Stripe Elements. Create the session with `ui_mode: 'elements'` and pass its client secret:

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
    <VueStripePaymentElement />
    <PayButton /> <!-- calls useCheckoutSession().confirm() -->
  </VueStripeCheckoutElementsProvider>
</VueStripeProvider>
```

**Pros:**
- Customers stay on your site
- Session features (promotion codes, tax, shipping options, Adaptive Pricing) without building the logic
- Same element components as `VueStripeElements`

**Cons:**
- Only the Payment, Address, Express Checkout, Contact Details, Tax ID, Currency Selector, Terms and Link Signup elements are available
- Requires a server-created session

[Learn more about Custom Checkout →](/guide/custom-checkout)

## Checkout Form (beta)

Stripe's whole checkout form (contact details, addresses, wallets, payment method, total and Pay button) as one element on your page, backed by a Checkout Session created with `ui_mode: 'form'`:

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeCheckoutFormProvider :client-secret="clientSecret">
    <VueStripeCheckoutForm @confirm="onConfirm" /> <!-- onConfirm calls useCheckoutForm().confirm() -->
  </VueStripeCheckoutFormProvider>
</VueStripeProvider>
```

**Pros:**
- Customers stay on your site, in your page layout
- One element instead of a field-by-field form
- Session features (tax, discounts, shipping, Adaptive Pricing) as with the other Checkout Sessions

**Cons:**
- Stripe beta: your account needs access to `ui_mode: 'form'`
- The form's fields and order are Stripe's

[Learn more about the Checkout Form →](/guide/checkout-form)

## Composables Without a Form

Some flows need no element at all, only a composable inside `VueStripeProvider`:

- **Bank accounts**: [`useFinancialConnections`](/api/composables/use-financial-connections) opens Stripe's bank login modal (ACH Direct Debit, Financial Connections data).
- **Identity**: [`useIdentity`](/api/composables/use-identity) opens Stripe Identity's verification modal.
- **Wallet sheet behind your own button**: [`usePaymentRequest`](/api/composables/use-payment-request) (prefer the Express Checkout Element for new integrations).
- **Confirming on your server**: [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token) with the Payment Element, then [`useHandleNextAction`](/api/composables/use-handle-next-action). See [Tokens and Payment Methods](/guide/tokens).

## Decision Flowchart

```
Do you need custom UI?
│
├─ No → Use Stripe Checkout (Hosted),
│        or Embedded Checkout / Checkout Form (beta) to keep customers on your site
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
- [Custom Checkout Guide](/guide/custom-checkout) - Your own page on a Checkout Session
- [Confirming Payments](/guide/confirming-payments) - Which composable confirms what
