<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  VueStripeProvider,
  VueStripeCheckout
} from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

const route = useRoute()

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Session-based checkout (v7.x with sessionId, or v8.x with sessionUrl)
const sessionId = ref('')
const sessionUrl = ref('')

// Price-based checkout (v7.x only, deprecated in v8.x)
const priceId = ref('')
const mode = ref<'payment' | 'subscription'>('payment')

// Use current origin and route with result param
const currentUrl = computed(() => {
  const base = `${window.location.origin}${route.path}`
  return base
})
const successUrl = computed(() => `${currentUrl.value}?result=success`)
const cancelUrl = computed(() => `${currentUrl.value}?result=cancel`)

// Checkout result from URL
const checkoutResult = ref<'success' | 'cancel' | null>(null)

// Checkout state
const checkoutError = ref<string | null>(null)
const isRedirecting = ref(false)

// Mode toggle: 'url' for v8.x compatible, 'session' for v7.x sessionId, 'price' for v7.x priceId
const checkoutMode = ref<'url' | 'session' | 'price'>('url')

// Check for result param on mount
onMounted(() => {
  const result = route.query.result as string
  if (result === 'success') {
    checkoutResult.value = 'success'
    logEvent('checkout-complete', 'Payment was successful!')
  } else if (result === 'cancel') {
    checkoutResult.value = 'cancel'
    logEvent('checkout-cancelled', 'Payment was cancelled')
  }
})

// Event log
const eventLog = ref<Array<{ time: string; event: string; data?: string }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 15) {
    eventLog.value.pop()
  }
}

// Event handlers
const onCheckoutClick = () => {
  isRedirecting.value = true
  logEvent('click', 'Redirecting to Stripe Checkout...')
}

const onCheckoutSuccess = () => {
  logEvent('success', 'Checkout completed successfully')
  isRedirecting.value = false
}

const onCheckoutError = (error: Error) => {
  checkoutError.value = error.message
  isRedirecting.value = false
  logEvent('error', error.message)
}

// Computed: Is form valid?
const isFormValid = computed(() => {
  if (checkoutMode.value === 'url') {
    return sessionUrl.value.startsWith('https://checkout.stripe.com/')
  }
  if (checkoutMode.value === 'session') {
    return sessionId.value.startsWith('cs_')
  }
  return priceId.value.startsWith('price_')
})

// Handle before-redirect event (v8.x)
const onBeforeRedirect = (data: { url: string }) => {
  logEvent('before-redirect', `Redirecting to: ${data.url.substring(0, 50)}...`)
}

// Clear result
const clearResult = () => {
  checkoutResult.value = null
  // Remove query param from URL without reload
  window.history.replaceState({}, '', route.path)
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <!-- Checkout Result Banner -->
    <div
      v-if="checkoutResult === 'success'"
      class="flex items-center gap-4 p-4 rounded-lg mb-4 bg-gradient-to-r from-green-100 to-green-50 border border-success"
    >
      <div class="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
        ✓
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-green-800 mb-1">Payment Successful!</h3>
        <p class="text-sm text-green-700">Your checkout was completed successfully.</p>
      </div>
      <Button size="sm" variant="secondary" @click="clearResult">Dismiss</Button>
    </div>

    <div
      v-if="checkoutResult === 'cancel'"
      class="flex items-center gap-4 p-4 rounded-lg mb-4 bg-gradient-to-r from-yellow-100 to-yellow-50 border border-warning"
    >
      <div class="w-12 h-12 rounded-full bg-warning text-yellow-800 flex items-center justify-center text-2xl font-bold flex-shrink-0">
        ✕
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-yellow-800 mb-1">Payment Cancelled</h3>
        <p class="text-sm text-yellow-700">You cancelled the checkout process.</p>
      </div>
      <Button size="sm" variant="secondary" @click="clearResult">Dismiss</Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>StripeCheckout</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          StripeCheckout provides a simple button that redirects users to Stripe's hosted checkout page.
          It supports both session-based and price-based checkout flows.
        </p>
        <p class="text-sm mb-4">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>

        <!-- Warning if no publishable key -->
        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <div v-else class="mt-4">
          <!-- Mode Selector -->
          <div class="space-y-2">
            <Label class="text-xs uppercase tracking-wide text-muted-foreground">Checkout Mode</Label>
            <Tabs v-model="checkoutMode" class="w-full">
              <TabsList class="grid w-full grid-cols-3">
                <TabsTrigger value="url">URL-Based (v8.x)</TabsTrigger>
                <TabsTrigger value="session">Session ID (v7.x)</TabsTrigger>
                <TabsTrigger value="price">Price-Based (v7.x)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <!-- URL-Based Checkout (v8.x compatible) -->
          <div v-if="checkoutMode === 'url'" class="bg-secondary border rounded-lg p-5 mt-4">
            <h4 class="font-semibold mb-2">
              URL-Based Checkout
              <Badge variant="success" class="ml-2">v8.x Compatible</Badge>
            </h4>
            <p class="text-muted-foreground text-sm">
              Use the Checkout Session URL from your backend. This is the recommended approach
              for @stripe/stripe-js v8.x where <code>redirectToCheckout</code> is removed.
            </p>

            <div class="mt-4">
              <Label class="mb-2">Session URL</Label>
              <Input
                v-model="sessionUrl"
                type="text"
                placeholder="https://checkout.stripe.com/c/pay/..."
                class="font-mono"
                :class="{ 'border-success': sessionUrl.startsWith('https://checkout.stripe.com/') }"
              />
            </div>

            <div class="bg-card rounded-md border p-4 mt-4">
              <h5 class="font-medium text-sm mb-2">How to get a Session URL:</h5>
              <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
                <li>
                  Create a Checkout Session using Stripe CLI:
                  <pre class="bg-slate-900 text-slate-100 p-3 rounded text-xs mt-2 overflow-x-auto">stripe checkout sessions create --line-items '[{"price_data":{"currency":"usd","product_data":{"name":"Demo Item"},"unit_amount":1000},"quantity":1}]' --mode payment --success-url "{{ successUrl }}" --cancel-url "{{ cancelUrl }}"</pre>
                </li>
                <li>Copy the <code>url</code> from the response (starts with <code>https://checkout.stripe.com/</code>)</li>
              </ol>
            </div>

            <Alert variant="info" class="mt-4">
              <AlertDescription class="text-sm">
                <strong>v8.x Migration:</strong> In @stripe/stripe-js v8.x, <code>redirectToCheckout</code> was removed.
                Your server should return the session URL directly, which is then used for a simple <code>window.location.replace()</code> redirect.
              </AlertDescription>
            </Alert>
          </div>

          <!-- Session ID Checkout (v7.x) -->
          <div v-if="checkoutMode === 'session'" class="bg-secondary border rounded-lg p-5 mt-4">
            <h4 class="font-semibold mb-2">
              Session ID Checkout
              <Badge variant="warning" class="ml-2">v7.x Only</Badge>
            </h4>
            <p class="text-muted-foreground text-sm">
              Use a pre-created Checkout Session ID. This uses <code>redirectToCheckout</code> which
              is deprecated in v8.x.
            </p>

            <div class="mt-4">
              <Label class="mb-2">Session ID</Label>
              <Input
                v-model="sessionId"
                type="text"
                placeholder="cs_test_..."
                class="font-mono"
                :class="{ 'border-success': sessionId.startsWith('cs_') }"
              />
            </div>

            <div class="bg-card rounded-md border p-4 mt-4">
              <h5 class="font-medium text-sm mb-2">How to get a Session ID:</h5>
              <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
                <li>
                  Create a Checkout Session using Stripe CLI:
                  <pre class="bg-slate-900 text-slate-100 p-3 rounded text-xs mt-2 overflow-x-auto">stripe checkout sessions create --line-items '[{"price_data":{"currency":"usd","product_data":{"name":"Demo Item"},"unit_amount":1000},"quantity":1}]' --mode payment --success-url "{{ successUrl }}" --cancel-url "{{ cancelUrl }}"</pre>
                </li>
                <li>Copy the <code>id</code> from the response (starts with <code>cs_</code>)</li>
              </ol>
            </div>

            <Alert variant="warning" class="mt-4">
              <AlertDescription class="text-sm">
                <strong>Deprecated:</strong> This method uses <code>redirectToCheckout</code> which is removed in @stripe/stripe-js v8.x.
                Use URL-Based checkout for v8.x compatibility.
              </AlertDescription>
            </Alert>
          </div>

          <!-- Price-Based Checkout (v7.x only) -->
          <div v-if="checkoutMode === 'price'" class="bg-secondary border rounded-lg p-5 mt-4">
            <h4 class="font-semibold mb-2">
              Price-Based Checkout
              <Badge variant="warning" class="ml-2">v7.x Only</Badge>
            </h4>
            <p class="text-muted-foreground text-sm">
              Create a checkout session dynamically using a Price ID. This uses <code>redirectToCheckout</code>
              which is deprecated in v8.x.
            </p>

            <div class="mt-4">
              <Label class="mb-2">Price ID</Label>
              <Input
                v-model="priceId"
                type="text"
                placeholder="price_..."
                class="font-mono"
                :class="{ 'border-success': priceId.startsWith('price_') }"
              />
            </div>

            <div class="mt-3 space-y-2">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Mode</Label>
              <Tabs v-model="mode" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div class="bg-card rounded-md p-3 mt-3 space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground min-w-[90px]">Success URL:</span>
                <code class="text-xs bg-secondary px-2 py-0.5 rounded text-primary break-all">{{ successUrl }}</code>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground min-w-[90px]">Cancel URL:</span>
                <code class="text-xs bg-secondary px-2 py-0.5 rounded text-primary break-all">{{ cancelUrl }}</code>
              </div>
            </div>

            <div class="bg-card rounded-md border p-4 mt-4">
              <h5 class="font-medium text-sm mb-2">How to get a Price ID:</h5>
              <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
                <li>Go to <a href="https://dashboard.stripe.com/test/products" target="_blank" class="text-primary hover:underline">Stripe Dashboard → Products</a></li>
                <li>Create or select a product</li>
                <li>Copy the Price ID (starts with <code>price_</code>)</li>
              </ol>
            </div>
          </div>

          <!-- Checkout Button -->
          <div class="text-center mt-5">
            <VueStripeProvider :publishable-key="publishableKey">
              <!-- URL-Based (v8.x compatible) -->
              <VueStripeCheckout
                v-if="checkoutMode === 'url'"
                :session-url="sessionUrl"
                button-text="Checkout with URL (v8.x)"
                loading-text="Redirecting..."
                :disabled="!isFormValid"
                button-class="checkout-button"
                @click="onCheckoutClick"
                @success="onCheckoutSuccess"
                @error="onCheckoutError"
                @before-redirect="onBeforeRedirect"
              />

              <!-- Session ID (v7.x) -->
              <VueStripeCheckout
                v-else-if="checkoutMode === 'session'"
                :session-id="sessionId"
                button-text="Checkout with Session ID (v7.x)"
                loading-text="Redirecting..."
                :disabled="!isFormValid"
                button-class="checkout-button"
                @click="onCheckoutClick"
                @success="onCheckoutSuccess"
                @error="onCheckoutError"
              />

              <!-- Price-Based (v7.x) -->
              <VueStripeCheckout
                v-else
                :price-id="priceId"
                :mode="mode"
                :success-url="successUrl"
                :cancel-url="cancelUrl"
                button-text="Checkout with Price (v7.x)"
                loading-text="Redirecting..."
                :disabled="!isFormValid"
                button-class="checkout-button"
                @click="onCheckoutClick"
                @success="onCheckoutSuccess"
                @error="onCheckoutError"
              />
            </VueStripeProvider>
          </div>

          <!-- Status display -->
          <Alert v-if="checkoutError" variant="destructive" class="mt-4">
            <AlertDescription class="flex items-center justify-between">
              {{ checkoutError }}
              <Button size="sm" variant="ghost" @click="checkoutError = null">Dismiss</Button>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log">
          <div v-if="eventLog.length === 0" class="text-muted-foreground italic">
            Interact with the Checkout button to see events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1 text-sm">
            <span class="text-muted-foreground">{{ entry.time }}</span>
            <span class="font-medium text-primary">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-muted-foreground">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>

<style scoped>
.checkout-button {
  width: 100%;
  max-width: 400px;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  background-color: #635bff;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.checkout-button:hover:not(:disabled) {
  background-color: #5a52e8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 91, 255, 0.3);
}

.checkout-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
