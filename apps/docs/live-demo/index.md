---
title: Live Demo
description: Test Vue Stripe components with real Stripe integrations
---

# Live Demo

Test Vue Stripe components with real Stripe integrations. These live demos connect to our hosted backend at `backend.vuestripe.com` - no setup required.

## One-Time Payments

<div class="examples-grid">
  <a href="/live-demo/checkout-redirect" class="example-card">
    <span class="example-icon"><DocIcon name="shopping-cart" :size="22" /></span>
    <h3>Stripe Checkout</h3>
    <p>Redirect to Stripe's hosted checkout page using the session URL.</p>
  </a>

  <a href="/live-demo/payment-element" class="example-card">
    <span class="example-icon"><DocIcon name="layers" :size="22" /></span>
    <h3>Payment Element</h3>
    <p>Accept cards, wallets, and bank payments with the universal Payment Element.</p>
  </a>

  <a href="/live-demo/embedded-checkout" class="example-card">
    <span class="example-icon"><DocIcon name="layout-template" :size="22" /></span>
    <h3>Embedded Checkout</h3>
    <p>Stripe's prebuilt Checkout page inside your page, from a Checkout Session.</p>
  </a>

  <a href="/live-demo/custom-checkout" class="example-card">
    <span class="example-icon"><DocIcon name="puzzle" :size="22" /></span>
    <h3>Custom Checkout</h3>
    <p>Your own checkout page on a Checkout Session: Payment Element, billing address, and session totals.</p>
  </a>

  <a href="/live-demo/checkout-form" class="example-card">
    <span class="example-icon"><DocIcon name="receipt" :size="22" /></span>
    <h3>Checkout Form (beta)</h3>
    <p>Stripe's complete checkout form as one element, confirmed with useCheckoutForm.</p>
  </a>

  <a href="/live-demo/card-element" class="example-card">
    <span class="example-icon"><DocIcon name="credit-card" :size="22" /></span>
    <h3>Card Element</h3>
    <p>Legacy single-field card input with full styling control.</p>
  </a>

  <a href="/live-demo/split-card-elements" class="example-card">
    <span class="example-icon"><DocIcon name="columns" :size="22" /></span>
    <h3>Split Card Elements</h3>
    <p>Separate inputs for card number, expiry, and CVC.</p>
  </a>

  <a href="/live-demo/link-authentication" class="example-card">
    <span class="example-icon"><DocIcon name="link" :size="22" /></span>
    <h3>Link Authentication</h3>
    <p>Enable one-click checkout with Stripe Link.</p>
  </a>

  <a href="/live-demo/express-checkout" class="example-card">
    <span class="example-icon"><DocIcon name="smartphone" :size="22" /></span>
    <h3>Express Checkout</h3>
    <p>Apple Pay, Google Pay, and Link buttons from the Express Checkout Element.</p>
  </a>

  <a href="/live-demo/payment-request" class="example-card">
    <span class="example-icon"><DocIcon name="wallet" :size="22" /></span>
    <h3>Payment Request</h3>
    <p>Your own button opens the browser's payment sheet with usePaymentRequest.</p>
  </a>

  <a href="/live-demo/address-element" class="example-card">
    <span class="example-icon"><DocIcon name="map-pin" :size="22" /></span>
    <h3>Address Element</h3>
    <p>Collect billing or shipping addresses with autocomplete.</p>
  </a>
</div>

## Saving Cards and Tokens

<div class="examples-grid">
  <a href="/live-demo/setup-intent" class="example-card">
    <span class="example-icon"><DocIcon name="vault" :size="22" /></span>
    <h3>Save a Card</h3>
    <p>Save a payment method for later with a SetupIntent and useSetupIntent.</p>
  </a>

  <a href="/live-demo/create-payment-method" class="example-card">
    <span class="example-icon"><DocIcon name="wallet-cards" :size="22" /></span>
    <h3>Create Payment Method</h3>
    <p>Turn card details into a reusable PaymentMethod with useCreatePaymentMethod.</p>
  </a>

  <a href="/live-demo/tokens" class="example-card">
    <span class="example-icon"><DocIcon name="coins" :size="22" /></span>
    <h3>Tokens</h3>
    <p>Create a ConfirmationToken, a card Token, and a Radar Session.</p>
  </a>
</div>

## Buy Now, Pay Later

<div class="examples-grid">
  <a href="/live-demo/payment-method-messaging" class="example-card">
    <span class="example-icon"><DocIcon name="message" :size="22" /></span>
    <h3>Payment Method Messaging</h3>
    <p>Show Klarna, Afterpay, and Affirm installment messaging.</p>
  </a>
</div>

## Regional Payment Methods

<div class="examples-grid">
  <a href="/live-demo/iban-element" class="example-card">
    <span class="example-icon"><DocIcon name="landmark" :size="22" /></span>
    <h3>SEPA Direct Debit</h3>
    <p>Collect an IBAN and confirm a SEPA Direct Debit payment.</p>
  </a>

  <a href="/live-demo/becs-payment" class="example-card">
    <span class="example-icon"><DocIcon name="landmark" :size="22" /></span>
    <h3>BECS Direct Debit (Australia)</h3>
    <p>Collect an Australian bank account with the AU Bank Account Element.</p>
  </a>

  <a href="/live-demo/ach-debit" class="example-card">
    <span class="example-icon"><DocIcon name="landmark" :size="22" /></span>
    <h3>ACH Direct Debit (US)</h3>
    <p>Link a US bank account with Financial Connections and confirm the debit.</p>
  </a>
</div>

## Subscriptions

<div class="examples-grid">
  <a href="/live-demo/subscription-checkout" class="example-card">
    <span class="example-icon"><DocIcon name="repeat" :size="22" /></span>
    <h3>Stripe Checkout</h3>
    <p>Redirect customers to Stripe's hosted checkout page for subscriptions.</p>
  </a>

  <a href="/live-demo/subscription-embedded" class="example-card">
    <span class="example-icon"><DocIcon name="calendar-sync" :size="22" /></span>
    <h3>Embedded Elements</h3>
    <p>Keep customers on your site with embedded subscription forms.</p>
  </a>
</div>

## Identity

<div class="examples-grid">
  <a href="/live-demo/identity" class="example-card">
    <span class="example-icon"><DocIcon name="fingerprint" :size="22" /></span>
    <h3>Identity Verification</h3>
    <p>Verify a customer's identity in Stripe's modal with useIdentity.</p>
  </a>
</div>

## Not in the Live Demos

Some components need Stripe access that the demo account does not have, so they have no live demo. Their API pages describe what Stripe returns without access:

- [VueStripeTermsElement](/api/components/stripe-terms-element) and [VueStripeLinkSignupElement](/api/components/stripe-link-signup-element): Stripe betas.
- [VueStripeTaxIdElement](/api/components/stripe-tax-id-element): a Stripe beta flag.
- [Issuing Elements](/api/components/stripe-issuing-elements) and the [Issuing](/api/components/stripe-issuing-disclosure), [Treasury](/api/components/stripe-treasury-disclosure) and [Financial Account](/api/components/stripe-financial-account-disclosure) disclosures: an account onboarded to Stripe Issuing or Treasury.
- [VueStripePricingTable](/api/components/stripe-pricing-table): a pricing table created in your Stripe Dashboard. The [Pricing Table guide](/guide/pricing-table) shows how to set one up.

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

/* .vp-doc a would otherwise underline and recolour the whole card */
.vp-doc a.example-card {
  text-decoration: none;
  color: inherit;
}

.example-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.example-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.875rem;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
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
