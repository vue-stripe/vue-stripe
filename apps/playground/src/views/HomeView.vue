<script setup lang="ts">
import { inject } from 'vue'

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
  setupSecret: string
  sessionId: string
}>('stripeConfig')

const hasKey = stripeConfig?.publishableKey && stripeConfig.publishableKey !== 'pk_test_your_key_here'

// Testing checklist - will be updated as we complete each test
const testingPhases = [
  {
    name: 'Phase 1: Foundation',
    description: 'No backend required',
    items: [
      { name: 'StripeProvider', route: '/stripe-provider', status: 'done', description: 'Root component that loads Stripe.js' },
      { name: 'useStripe()', route: '/use-stripe', status: 'done', description: 'Composable to access Stripe instance' },
      { name: 'StripeAddressElement', route: '/stripe-address-element', status: 'pending', description: 'Address collection form' }
    ]
  },
  {
    name: 'Phase 2: Elements Container',
    description: 'Can test without clientSecret (for CardElement)',
    items: [
      { name: 'StripeElements', route: '/stripe-elements', status: 'done', description: 'Creates Elements instance for child components' },
      { name: 'useStripeElements()', route: '/stripe-elements', status: 'done', description: 'Composable to access Elements instance (tested via ElementsConsumer)' }
    ]
  },
  {
    name: 'Phase 3: Card Elements',
    description: 'Classic card input components',
    items: [
      { name: 'StripeCardElement', route: '/stripe-card-element', status: 'done', description: 'Single unified card input' },
      { name: 'Split Card Elements', route: '/stripe-split-card', status: 'pending', description: 'Number + Expiry + CVC separate inputs' }
    ]
  },
  {
    name: 'Phase 4: Modern Payment',
    description: 'Recommended payment flow',
    items: [
      { name: 'StripePaymentElement', route: '/stripe-payment-element', status: 'pending', description: 'All-in-one payment UI (cards, wallets, bank)' },
      { name: 'usePaymentIntent()', route: '/use-payment-intent', status: 'pending', description: 'Composable to confirm payments' }
    ]
  },
  {
    name: 'Phase 5: Advanced Features',
    description: 'Express checkout and saved cards',
    items: [
      { name: 'StripeLinkAuthenticationElement', route: '/stripe-link-auth', status: 'pending', description: 'Stripe Link email input' },
      { name: 'StripeExpressCheckoutElement', route: '/stripe-express-checkout', status: 'pending', description: 'Apple Pay, Google Pay buttons' },
      { name: 'useSetupIntent()', route: '/use-setup-intent', status: 'pending', description: 'Save payment methods for later' }
    ]
  },
  {
    name: 'Phase 6: Checkout Flow',
    description: 'Redirect to Stripe-hosted checkout',
    items: [
      { name: 'StripeCheckout', route: '/stripe-checkout', status: 'pending', description: 'Button to hosted checkout page' },
      { name: 'useStripeCheckout()', route: '/use-stripe-checkout', status: 'pending', description: 'Programmatic checkout redirect' }
    ]
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done': return '✅'
    case 'in-progress': return '🔄'
    case 'pending': return '⬜'
    default: return '⬜'
  }
}
</script>

<template>
  <div class="home">
    <div class="demo-card intro">
      <h2>Vue Stripe Component Testing</h2>
      <p>
        This playground helps you test each Vue Stripe component and composable one by one.
        Work through the phases below, testing each item before moving to the next.
      </p>

      <div class="setup-section" v-if="!hasKey">
        <h3>🔑 Add Your Stripe Key</h3>
        <p>Click the <strong>"Add Key"</strong> button in the header above to enter your Stripe test publishable key.</p>
        <p class="hint">
          Get your test key from:
          <a href="https://dashboard.stripe.com/test/apikeys" target="_blank">Stripe Dashboard → API Keys</a>
        </p>
      </div>

      <div class="setup-section success" v-else>
        <h3>✅ Ready to Test</h3>
        <p>Your Stripe key is configured. Start with Phase 1 below!</p>
      </div>
    </div>

    <div class="phases">
      <div
        v-for="phase in testingPhases"
        :key="phase.name"
        class="demo-card phase"
      >
        <h3>{{ phase.name }}</h3>
        <p class="phase-desc">{{ phase.description }}</p>

        <ul class="checklist">
          <li
            v-for="item in phase.items"
            :key="item.name"
            :class="['checklist-item', item.status]"
          >
            <span class="status">{{ getStatusIcon(item.status) }}</span>
            <div class="item-info">
              <strong>{{ item.name }}</strong>
              <span class="description">{{ item.description }}</span>
            </div>
            <router-link
              v-if="item.status !== 'pending' || phase.name.includes('Phase 1') || phase.name.includes('Phase 2')"
              :to="item.route"
              class="test-link"
            >
              Test →
            </router-link>
            <span v-else class="coming-soon">Coming soon</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="demo-card resources">
      <h3>Resources</h3>
      <ul>
        <li><a href="https://stripe.com/docs/stripe-js" target="_blank">Stripe.js Documentation</a></li>
        <li><a href="https://stripe.com/docs/testing" target="_blank">Test Card Numbers</a></li>
        <li><a href="https://dashboard.stripe.com/test/apikeys" target="_blank">Get Test API Keys</a></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
}

.intro h2 {
  margin-bottom: 1rem;
}

.intro p {
  color: #666;
  line-height: 1.7;
}

.setup-section {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 10px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.setup-section.success {
  background: #d4edda;
  border-color: #28a745;
}

.setup-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.setup-section p {
  margin: 0 0 0.75rem 0;
  line-height: 1.6;
}

.setup-section ol {
  margin: 0;
  padding-left: 1.5rem;
}

.setup-section li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.setup-section code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.hint {
  margin: 1rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
}

.hint a {
  color: #635bff;
}

.phase {
  margin-bottom: 1.5rem;
}

.phase h3 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.phase-desc {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

.checklist {
  list-style: none;
  padding: 0;
  margin: 0;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.checklist-item.done {
  background: #d4edda;
}

.checklist-item.in-progress {
  background: #fff3cd;
}

.status {
  font-size: 1.5rem;
}

.item-info {
  flex: 1;
}

.item-info strong {
  display: block;
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.item-info .description {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
}

.test-link {
  background: #635bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.test-link:hover {
  background: #5a52e8;
}

.coming-soon {
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
}

.resources h3 {
  margin: 0 0 1.25rem 0;
}

.resources ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resources li {
  margin-bottom: 0.875rem;
}

.resources a {
  color: #635bff;
  text-decoration: none;
  font-size: 0.95rem;
}

.resources a:hover {
  text-decoration: underline;
}
</style>
