<script setup lang="ts">
import { inject } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CreditCard,
  Wallet,
  KeyRound,
  MapPin,
  Link2,
  Layers,
  Landmark,
  ShoppingCart,
  ExternalLink,
  Server,
} from 'lucide-vue-next'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui'

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
  setupSecret: string
  sessionId: string
}>('stripeConfig')

const hasKey = stripeConfig?.publishableKey && stripeConfig.publishableKey !== 'pk_test_your_key_here'

// Quick access cards organized by category
const quickAccessCards = [
  {
    title: 'Payment Element',
    description: 'Accept cards, wallets, and bank payments with one component',
    route: '/stripe-payment-element',
    icon: Wallet,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    recommended: true,
  },
  {
    title: 'Card Element',
    description: 'Classic single-line card input',
    route: '/stripe-card-element',
    icon: CreditCard,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Express Checkout',
    description: 'Apple Pay, Google Pay, Link buttons',
    route: '/stripe-express-checkout',
    icon: ShoppingCart,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  {
    title: 'Stripe Checkout',
    description: 'Embedded Stripe-hosted checkout',
    route: '/stripe-checkout',
    icon: ShoppingCart,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    title: 'Setup Intent',
    description: 'Save payment methods for later',
    route: '/use-setup-intent',
    icon: KeyRound,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Address Element',
    description: 'Collect shipping & billing addresses',
    route: '/stripe-address-element',
    icon: MapPin,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  {
    title: 'Link Authentication',
    description: 'Enable Stripe Link for faster checkout',
    route: '/stripe-link-authentication',
    icon: Link2,
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
  {
    title: 'Split Card Elements',
    description: 'Separate number, expiry, CVC inputs',
    route: '/stripe-split-card',
    icon: CreditCard,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
]

const coreComponents = [
  {
    title: 'VueStripeProvider',
    description: 'Root component that loads Stripe.js',
    route: '/stripe-provider',
    icon: Layers,
  },
  {
    title: 'VueStripeElements',
    description: 'Creates Elements instance for child components',
    route: '/stripe-elements',
    icon: Layers,
  },
  {
    title: 'useStripe()',
    description: 'Composable to access Stripe instance',
    route: '/use-stripe',
    icon: Layers,
  },
]

const europeanElements = [
  {
    title: 'IBAN Element',
    description: 'SEPA bank account collection',
    route: '/stripe-iban-element',
    icon: Landmark,
  },
  {
    title: 'iDEAL Bank',
    description: 'Dutch payment method',
    route: '/stripe-ideal-bank-element',
    icon: Landmark,
  },
  {
    title: 'P24 Bank',
    description: 'Polish payment method',
    route: '/stripe-p24-bank-element',
    icon: Landmark,
  },
  {
    title: 'EPS Bank',
    description: 'Austrian payment method',
    route: '/stripe-eps-bank-element',
    icon: Landmark,
  },
]
</script>

<template>
  <div class="max-w-[1000px] mx-auto flex flex-col gap-6">
    <!-- Hero Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Vue Stripe Playground</CardTitle>
        <CardDescription class="text-base">
          Interactive demos for testing Vue Stripe components and integrations
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Backend Notice -->
        <Alert class="border-primary/50 bg-primary/5">
          <Server class="h-4 w-4" />
          <AlertTitle>Backend Required</AlertTitle>
          <AlertDescription>
            <p class="mb-2">
              Most demos require a <code class="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">clientSecret</code> or <code class="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">sessionId</code> from your backend.
            </p>
            <p>
              Use our data generator to create test secrets:
              <a
                href="https://backend.vuestripe.com"
                target="_blank"
                class="inline-flex items-center gap-1 text-primary hover:underline font-semibold ml-1"
              >
                backend.vuestripe.com
                <ExternalLink class="h-3.5 w-3.5" />
              </a>
            </p>
          </AlertDescription>
        </Alert>

        <!-- Stripe Key Status -->
        <Alert v-if="!hasKey" variant="warning">
          <AlertTitle>Add Your Stripe Key</AlertTitle>
          <AlertDescription>
            <p>Click <strong>"Add Stripe Key"</strong> in the header to enter your test publishable key.</p>
            <p class="text-sm mt-1">
              Get your key from
              <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" class="text-primary hover:underline font-medium">Stripe Dashboard</a>
            </p>
          </AlertDescription>
        </Alert>

        <Alert v-else variant="success">
          <AlertTitle>Ready to Test</AlertTitle>
          <AlertDescription>
            Your Stripe key is configured. Choose a component below to get started!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <!-- Quick Access Cards -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Payment Components</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="card in quickAccessCards"
          :key="card.route"
          :to="card.route"
          class="group"
        >
          <Card class="h-full transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden">
            <div v-if="card.recommended" class="absolute top-2 right-2">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500 text-white">
                Recommended
              </span>
            </div>
            <CardContent class="pt-6">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                :class="card.color"
              >
                <component :is="card.icon" class="h-5 w-5" />
              </div>
              <h3 class="font-semibold group-hover:text-primary transition-colors">
                {{ card.title }}
              </h3>
              <p class="text-sm text-muted-foreground mt-1">
                {{ card.description }}
              </p>
            </CardContent>
          </Card>
        </RouterLink>
      </div>
    </div>

    <!-- Core Components -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Core Components</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RouterLink
          v-for="item in coreComponents"
          :key="item.route"
          :to="item.route"
          class="group"
        >
          <Card class="h-full transition-all hover:shadow-md hover:border-primary/50">
            <CardContent class="pt-6">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-slate-500/10 text-slate-600 dark:text-slate-400">
                <component :is="item.icon" class="h-5 w-5" />
              </div>
              <h3 class="font-semibold group-hover:text-primary transition-colors">
                {{ item.title }}
              </h3>
              <p class="text-sm text-muted-foreground mt-1">
                {{ item.description }}
              </p>
            </CardContent>
          </Card>
        </RouterLink>
      </div>
    </div>

    <!-- European Payment Methods -->
    <div>
      <h2 class="text-lg font-semibold mb-4">European Payment Methods</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="item in europeanElements"
          :key="item.route"
          :to="item.route"
          class="group"
        >
          <Card class="h-full transition-all hover:shadow-md hover:border-primary/50">
            <CardContent class="pt-6">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <component :is="item.icon" class="h-5 w-5" />
              </div>
              <h3 class="font-semibold group-hover:text-primary transition-colors">
                {{ item.title }}
              </h3>
              <p class="text-sm text-muted-foreground mt-1">
                {{ item.description }}
              </p>
            </CardContent>
          </Card>
        </RouterLink>
      </div>
    </div>

    <!-- Resources -->
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://backend.vuestripe.com"
            target="_blank"
            class="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Server class="h-5 w-5 text-primary" />
            <div>
              <div class="font-medium">Backend Data Generator</div>
              <div class="text-sm text-muted-foreground">Create test secrets & session IDs</div>
            </div>
            <ExternalLink class="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
          <a
            href="https://vuestripe.com"
            target="_blank"
            class="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Layers class="h-5 w-5 text-primary" />
            <div>
              <div class="font-medium">Vue Stripe Docs</div>
              <div class="text-sm text-muted-foreground">Official documentation</div>
            </div>
            <ExternalLink class="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
          <a
            href="https://stripe.com/docs/testing"
            target="_blank"
            class="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <CreditCard class="h-5 w-5 text-primary" />
            <div>
              <div class="font-medium">Test Card Numbers</div>
              <div class="text-sm text-muted-foreground">Stripe testing guide</div>
            </div>
            <ExternalLink class="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
          <a
            href="https://dashboard.stripe.com/test/apikeys"
            target="_blank"
            class="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <KeyRound class="h-5 w-5 text-primary" />
            <div>
              <div class="font-medium">Get API Keys</div>
              <div class="text-sm text-muted-foreground">Stripe Dashboard</div>
            </div>
            <ExternalLink class="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
