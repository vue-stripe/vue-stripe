<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueStripeCheckout } from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label
} from '@/components/ui'

const route = useRoute()

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Hosted Checkout: the server creates the Checkout Session and returns its URL.
// (stripe.redirectToCheckout with a session ID or price ID was removed in Stripe.js Clover.)
const sessionUrl = ref('')

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

// Check for result param on mount
onMounted(() => {
  const result = route.query['result'] as string
  if (result === 'success') {
    checkoutResult.value = 'success'
    logEvent('checkout-complete', 'Payment was successful!')
  } else if (result === 'cancel') {
    checkoutResult.value = 'cancel'
    logEvent('checkout-cancelled', 'Payment was cancelled')
  }
})

// Event log
const eventLog = ref<Array<{ time: string; event: string; data?: string | undefined }>>([])

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
const isFormValid = computed(() => sessionUrl.value.startsWith('https://checkout.stripe.com/'))

// Handle before-redirect event
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
      <div
        class="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center text-2xl font-bold flex-shrink-0"
      >
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
      <div
        class="w-12 h-12 rounded-full bg-warning text-yellow-800 flex items-center justify-center text-2xl font-bold flex-shrink-0"
      >
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
          StripeCheckout provides a simple button that redirects users to Stripe's hosted checkout
          page. It supports both session-based and price-based checkout flows.
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
          <!-- URL-based hosted Checkout -->
          <div class="bg-secondary border rounded-lg p-5 mt-4">
            <h4 class="font-semibold mb-2">Hosted Checkout</h4>
            <p class="text-muted-foreground text-sm">
              Use the Checkout Session URL from your backend. Stripe.js removed
              <code>redirectToCheckout</code> in Clover (8.x); the session is always created on the
              server.
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
                  <pre class="bg-slate-900 text-slate-100 p-3 rounded text-xs mt-2 overflow-x-auto">
stripe checkout sessions create --line-items '[{"price_data":{"currency":"usd","product_data":{"name":"Demo Item"},"unit_amount":1000},"quantity":1}]' --mode payment --success-url "{{
                      successUrl
                    }}" --cancel-url "{{ cancelUrl }}"</pre>
                </li>
                <li>
                  Copy the <code>url</code> from the response (starts with
                  <code>https://checkout.stripe.com/</code>)
                </li>
              </ol>
            </div>

            <Alert variant="info" class="mt-4">
              <AlertDescription class="text-sm">
                Your server returns the session <code>url</code>; the component redirects with
                <code>window.location.replace()</code>. No Stripe.js instance is needed.
              </AlertDescription>
            </Alert>
          </div>

          <!-- Checkout Button -->
          <div class="text-center mt-5">
            <VueStripeCheckout
              :session-url="sessionUrl"
              button-text="Checkout"
              loading-text="Redirecting..."
              :disabled="!isFormValid"
              button-class="checkout-button"
              @checkout="onCheckoutClick"
              @success="onCheckoutSuccess"
              @error="onCheckoutError"
              @before-redirect="onBeforeRedirect"
            />
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
