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
      { name: 'StripeAddressElement', route: '/stripe-address-element', status: 'done', description: 'Address collection form' }
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
      { name: 'Split Card Elements', route: '/stripe-split-card', status: 'done', description: 'Number + Expiry + CVC separate inputs' }
    ]
  },
  {
    name: 'Phase 4: Modern Payment',
    description: 'Recommended payment flow',
    items: [
      { name: 'StripePaymentElement', route: '/stripe-payment-element', status: 'done', description: 'All-in-one payment UI (cards, wallets, bank)' },
      { name: 'usePaymentIntent()', route: '/stripe-payment-element', status: 'done', description: 'Composable to confirm payments (tested via PaymentElement)' }
    ]
  },
  {
    name: 'Phase 5: Advanced Features',
    description: 'Express checkout and saved cards',
    items: [
      { name: 'StripeLinkAuthenticationElement', route: '/stripe-link-authentication', status: 'done', description: 'Stripe Link email input' },
      { name: 'StripeExpressCheckoutElement', route: '/stripe-express-checkout', status: 'done', description: 'Apple Pay, Google Pay buttons' },
      { name: 'useSetupIntent()', route: '/use-setup-intent', status: 'done', description: 'Save payment methods for later' }
    ]
  },
  {
    name: 'Phase 6: Checkout Flow',
    description: 'Redirect to Stripe-hosted checkout',
    items: [
      { name: 'StripeCheckout', route: '/stripe-checkout', status: 'done', description: 'Button to hosted checkout page' },
      { name: 'useStripeCheckout()', route: '/stripe-checkout', status: 'done', description: 'Programmatic checkout redirect (tested via StripeCheckout)' }
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
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">Vue Stripe Component Testing</h2>
      <p class="text-secondary">
        This playground helps you test each Vue Stripe component and composable one by one.
        Work through the phases below, testing each item before moving to the next.
      </p>

      <div v-if="!hasKey" class="alert alert-warning mt-4">
        <h4 class="alert-title">Add Your Stripe Key</h4>
        <p>Click the <strong>"Add Key"</strong> button in the header above to enter your Stripe test publishable key.</p>
        <p class="text-sm mt-2">
          Get your test key from:
          <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" class="link">Stripe Dashboard → API Keys</a>
        </p>
      </div>

      <div v-else class="alert alert-success mt-4">
        <h4 class="alert-title">Ready to Test</h4>
        <p>Your Stripe key is configured. Start with Phase 1 below!</p>
      </div>
    </div>

    <div class="phases">
      <div
        v-for="phase in testingPhases"
        :key="phase.name"
        class="card phase-card"
      >
        <h3 class="phase-title">{{ phase.name }}</h3>
        <p class="phase-desc">{{ phase.description }}</p>

        <ul class="checklist">
          <li
            v-for="item in phase.items"
            :key="item.name"
            :class="['checklist-item', item.status]"
          >
            <span class="status-icon">{{ getStatusIcon(item.status) }}</span>
            <div class="item-info">
              <strong>{{ item.name }}</strong>
              <span class="item-desc">{{ item.description }}</span>
            </div>
            <router-link
              v-if="item.status !== 'pending'"
              :to="item.route"
              class="btn btn-sm btn-primary"
            >
              Test →
            </router-link>
            <span v-else class="badge badge-secondary">Coming soon</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">Resources</h3>
      <ul class="resource-list">
        <li><a href="https://stripe.com/docs/stripe-js" target="_blank" class="link">Stripe.js Documentation</a></li>
        <li><a href="https://stripe.com/docs/testing" target="_blank" class="link">Test Card Numbers</a></li>
        <li><a href="https://dashboard.stripe.com/test/apikeys" target="_blank" class="link">Get Test API Keys</a></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* View uses .test-page from design-system.css for consistent 900px width */

.card-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
  color: var(--color-text);
}

.alert-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.phases {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.phase-card {
  margin-bottom: 0;
}

.phase-title {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text);
  font-size: var(--text-lg);
}

.phase-desc {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin: 0 0 var(--space-4) 0;
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
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.checklist-item:last-child {
  margin-bottom: 0;
}

.checklist-item.done {
  background: var(--color-success-light);
}

.checklist-item.in-progress {
  background: var(--color-warning-light);
}

.status-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info strong {
  display: block;
  color: var(--color-text);
  margin-bottom: 2px;
}

.item-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.resource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resource-list li {
  margin-bottom: var(--space-3);
}

.resource-list li:last-child {
  margin-bottom: 0;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .checklist-item {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .item-info {
    flex-basis: calc(100% - 40px);
  }

  .checklist-item .btn,
  .checklist-item .badge {
    margin-left: auto;
  }
}
</style>
