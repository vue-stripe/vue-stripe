<script setup lang="ts">
import { withBase } from 'vitepress'
import DocIcon, { type DocIconName } from '../DocIcon.vue'

const OPTIONS: {
  icon: DocIconName
  title: string
  text: string
  component: string
  guide: string
  demo?: string
}[] = [
  {
    icon: 'credit-card',
    title: 'Payment Element on your page',
    text: 'Cards, wallets and local payment methods in one form, confirmed against a PaymentIntent.',
    component: 'VueStripePaymentElement',
    guide: '/guide/payment-element',
    demo: '/live-demo/payment-element'
  },
  {
    icon: 'layout-template',
    title: 'Custom Checkout',
    text: 'Your own layout on a Checkout Session. Stripe keeps line items, tax, discounts and currency.',
    component: 'VueStripeCheckoutElementsProvider',
    guide: '/guide/custom-checkout',
    demo: '/live-demo/custom-checkout'
  },
  {
    icon: 'panel-top',
    title: 'Embedded Checkout',
    text: "Stripe's prebuilt checkout page, mounted inside your page.",
    component: 'VueStripeEmbeddedCheckout',
    guide: '/guide/embedded-checkout',
    demo: '/live-demo/embedded-checkout'
  },
  {
    icon: 'external-link',
    title: 'Hosted Checkout',
    text: 'Redirect to checkout.stripe.com with the session URL your server creates.',
    component: 'VueStripeCheckout',
    guide: '/guide/checkout',
    demo: '/live-demo/checkout-redirect'
  },
  {
    icon: 'receipt',
    title: 'Checkout Form',
    text: 'A complete checkout form from one component, on a Checkout Session. Stripe beta.',
    component: 'VueStripeCheckoutForm',
    guide: '/guide/checkout-form',
    demo: '/live-demo/checkout-form'
  },
  {
    icon: 'columns',
    title: 'Pricing Table',
    text: 'A pricing table you configure in the Stripe Dashboard, embedded with one tag.',
    component: 'VueStripePricingTable',
    guide: '/guide/pricing-table'
  }
]
</script>

<template>
  <section class="integrations" aria-labelledby="integrations-title">
    <div class="integrations-head">
      <h2 id="integrations-title">Pick how you take payments</h2>
      <p>
        Six ways to put Stripe in a Vue app, from a single element to a full checkout page.
        <a :href="withBase('/guide/approaches')">Compare them</a>
      </p>
    </div>
    <ul class="integrations-list">
      <li v-for="o in OPTIONS" :key="o.title" class="integration">
        <span class="integration-icon"><DocIcon :name="o.icon" :size="20" /></span>
        <div class="integration-body">
          <h3>{{ o.title }}</h3>
          <p>{{ o.text }}</p>
          <code>{{ o.component }}</code>
        </div>
        <div class="integration-links">
          <a :href="withBase(o.guide)"><DocIcon name="book-open" :size="14" />Guide</a>
          <a v-if="o.demo" :href="withBase(o.demo)"><DocIcon name="play" :size="14" />Live demo</a>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.integrations {
  max-width: 1152px;
  margin: 0 auto;
  padding: 96px 24px 0;
}

@media (min-width: 960px) {
  .integrations {
    padding: 112px 32px 0;
  }
}

.integrations-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--vp-c-text-1);
}

.integrations-head p {
  max-width: 60ch;
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.integrations-head a,
.integration-links a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: none;
}

.integrations-list {
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--vp-c-divider);
}

.integration {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

@media (min-width: 768px) {
  .integration {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    align-items: center;
    gap: 20px;
  }
}

.integration-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
}

.integration-body h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.integration-body p {
  margin: 2px 0 6px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
  max-width: 64ch;
}

.integration-body code {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.integration-links {
  display: flex;
  gap: 6px;
  grid-column: 2;
}

@media (min-width: 768px) {
  .integration-links {
    grid-column: auto;
    justify-content: flex-end;
  }
}

.integration-links a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
}

.integration-links a:hover {
  border-color: var(--vp-c-brand-1);
}

.integration-links a:focus-visible,
.integrations-head a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>
