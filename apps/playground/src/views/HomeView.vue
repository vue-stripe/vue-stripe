<script setup lang="ts">
import { inject } from 'vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  Badge,
} from '@/components/ui'

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
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Vue Stripe Component Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          This playground helps you test each Vue Stripe component and composable one by one.
          Work through the phases below, testing each item before moving to the next.
        </p>

        <Alert v-if="!hasKey" variant="warning">
          <AlertTitle>Add Your Stripe Key</AlertTitle>
          <AlertDescription>
            <p>Click the <strong>"Add Key"</strong> button in the header above to enter your Stripe test publishable key.</p>
            <p class="text-sm mt-2">
              Get your test key from:
              <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" class="text-primary hover:underline font-medium">Stripe Dashboard → API Keys</a>
            </p>
          </AlertDescription>
        </Alert>

        <Alert v-else variant="success">
          <AlertTitle>Ready to Test</AlertTitle>
          <AlertDescription>
            Your Stripe key is configured. Start with Phase 1 below!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <div class="flex flex-col gap-4">
      <Card v-for="phase in testingPhases" :key="phase.name">
        <CardHeader>
          <CardTitle class="text-lg">{{ phase.name }}</CardTitle>
          <p class="text-sm text-muted-foreground">{{ phase.description }}</p>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2">
            <li
              v-for="item in phase.items"
              :key="item.name"
              class="flex items-center gap-3 p-3 rounded-md"
              :class="{
                'bg-success/10': item.status === 'done',
                'bg-warning/10': item.status === 'in-progress',
                'bg-secondary': item.status === 'pending'
              }"
            >
              <span class="text-xl flex-shrink-0">{{ getStatusIcon(item.status) }}</span>
              <div class="flex-1 min-w-0">
                <strong class="block text-foreground">{{ item.name }}</strong>
                <span class="text-sm text-muted-foreground leading-tight">{{ item.description }}</span>
              </div>
              <router-link
                v-if="item.status !== 'pending'"
                :to="item.route"
              >
                <Button size="sm">Test →</Button>
              </router-link>
              <Badge v-else variant="secondary">Coming soon</Badge>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2">
          <li><a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline font-medium">Vue Stripe Documentation</a></li>
          <li><a href="https://stripe.com/docs/stripe-js" target="_blank" class="text-primary hover:underline font-medium">Stripe.js Documentation</a></li>
          <li><a href="https://stripe.com/docs/testing" target="_blank" class="text-primary hover:underline font-medium">Test Card Numbers</a></li>
          <li><a href="https://dashboard.stripe.com/test/apikeys" target="_blank" class="text-primary hover:underline font-medium">Get Test API Keys</a></li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
