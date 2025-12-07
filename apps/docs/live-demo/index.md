---
title: Live Demo
description: Test Vue Stripe components with real Stripe integrations
---

# Live Demo

Test Vue Stripe components with real Stripe integrations. These live demos connect to our hosted backend at `backend.vuestripe.com` - no setup required.

## One-Time Payments

<div class="examples-grid">
  <a href="/live-demo/checkout-redirect" class="example-card">
    <div class="example-icon">🛒</div>
    <h3>Stripe Checkout</h3>
    <p>Redirect to Stripe's hosted checkout page. v8.x compatible with URL redirect.</p>
  </a>

  <a href="/live-demo/payment-element" class="example-card">
    <div class="example-icon">💳</div>
    <h3>Payment Element</h3>
    <p>Accept cards, wallets, and bank payments with the universal Payment Element.</p>
  </a>

  <a href="/live-demo/card-element" class="example-card">
    <div class="example-icon">💳</div>
    <h3>Card Element</h3>
    <p>Legacy single-field card input with full styling control.</p>
  </a>

  <a href="/live-demo/split-card-elements" class="example-card">
    <div class="example-icon">🔢</div>
    <h3>Split Card Elements</h3>
    <p>Separate inputs for card number, expiry, and CVC.</p>
  </a>

  <a href="/live-demo/link-authentication" class="example-card">
    <div class="example-icon">⚡</div>
    <h3>Link Authentication</h3>
    <p>Enable one-click checkout with Stripe Link.</p>
  </a>

  <a href="/live-demo/ideal-payment" class="example-card">
    <div class="example-icon">🏦</div>
    <h3>iDEAL Payment</h3>
    <p>Accept iDEAL payments from customers in the Netherlands.</p>
  </a>
</div>

## Subscriptions

<div class="examples-grid">
  <a href="/live-demo/subscription-checkout" class="example-card">
    <div class="example-icon">🔄</div>
    <h3>Stripe Checkout</h3>
    <p>Redirect customers to Stripe's hosted checkout page for subscriptions.</p>
  </a>

  <a href="/live-demo/subscription-embedded" class="example-card">
    <div class="example-icon">📱</div>
    <h3>Embedded Elements</h3>
    <p>Keep customers on your site with embedded subscription forms.</p>
  </a>
</div>

## Test Cards

Use these test card numbers:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 9995` | Declined |

Use any future expiry date, any 3-digit CVC, and any postal code.

<style>
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.example-card {
  display: block;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.example-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.example-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.example-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.example-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}
</style>
