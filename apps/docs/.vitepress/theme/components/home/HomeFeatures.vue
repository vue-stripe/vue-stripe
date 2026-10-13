<script setup lang="ts">
import { withBase } from 'vitepress'
import DocIcon, { type DocIconName } from '../DocIcon.vue'

const FEATURES: { icon: DocIconName; title: string; text: string; link?: string }[] = [
  {
    icon: 'layers',
    title: 'Vue 3 and Vue 2.7',
    text: 'One build for both. Render-function components and composables, tested on each version in CI.'
  },
  {
    icon: 'credit-card',
    title: 'Every Stripe element',
    text: 'Payment, Express Checkout, Card, Address, Link, IBAN, BECS, Tax ID, Currency Selector, Issuing and more.',
    link: '/api/'
  },
  {
    icon: 'shopping-cart',
    title: 'Every Checkout',
    text: 'Hosted, Embedded and Custom Checkout, the Checkout Form and the Pricing Table.',
    link: '/guide/approaches'
  },
  {
    icon: 'zap',
    title: 'A composable per method',
    text: 'usePaymentIntent, one useConfirm composable per payment method, tokens, Financial Connections and Identity.',
    link: '/guide/confirming-payments'
  },
  {
    icon: 'shield-check',
    title: 'Typed end to end',
    text: 'Props, events, exposed members and results are typed from Stripe.js, and every Stripe type you need is re-exported.'
  },
  {
    icon: 'gauge',
    title: '100% of Stripe.js 10',
    text: 'Every element and method has a wrapper. A test fails the build when Stripe adds something new.',
    link: '/coverage'
  }
]
</script>

<template>
  <section class="features" aria-label="Features">
    <div class="features-grid">
      <component
        :is="f.link ? 'a' : 'div'"
        v-for="f in FEATURES"
        :key="f.title"
        :href="f.link ? withBase(f.link) : undefined"
        :class="['feature', { 'is-link': f.link }]"
      >
        <span class="feature-icon"><DocIcon :name="f.icon" :size="20" /></span>
        <h2 class="feature-title">{{ f.title }}</h2>
        <p class="feature-text">{{ f.text }}</p>
      </component>
    </div>
  </section>
</template>

<style scoped>
.features {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 960px) {
  .features {
    padding: 0 32px;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}

.feature {
  display: block;
  padding: 24px;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s;
}

.feature.is-link:hover {
  border-color: var(--vp-c-brand-1);
}

.feature.is-link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.feature-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--vp-c-text-1);
}

.feature-text {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 22px;
  color: var(--vp-c-text-2);
}

@media (prefers-reduced-motion: reduce) {
  .feature {
    transition: none;
  }
}
</style>
