<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  StripeProvider,
  StripeCheckout
} from '@vue-stripe/vue-stripe'

const route = useRoute()

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Session-based checkout
const sessionId = ref('')

// Price-based checkout
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

// Mode toggle
const checkoutMode = ref<'session' | 'price'>('session')

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
  if (checkoutMode.value === 'session') {
    return sessionId.value.startsWith('cs_')
  }
  return priceId.value.startsWith('price_')
})

// Clear result
const clearResult = () => {
  checkoutResult.value = null
  // Remove query param from URL without reload
  window.history.replaceState({}, '', route.path)
}
</script>

<template>
  <div class="test-page">
    <!-- Checkout Result Banner -->
    <div v-if="checkoutResult === 'success'" class="result-banner result-success">
      <div class="result-icon">✓</div>
      <div class="result-content">
        <h3>Payment Successful!</h3>
        <p>Your checkout was completed successfully.</p>
      </div>
      <button class="btn btn-sm" @click="clearResult">Dismiss</button>
    </div>

    <div v-if="checkoutResult === 'cancel'" class="result-banner result-cancel">
      <div class="result-icon">✕</div>
      <div class="result-content">
        <h3>Payment Cancelled</h3>
        <p>You cancelled the checkout process.</p>
      </div>
      <button class="btn btn-sm" @click="clearResult">Dismiss</button>
    </div>

    <div class="card">
      <h2 class="card-title">StripeCheckout</h2>
      <p class="text-secondary">
        StripeCheckout provides a simple button that redirects users to Stripe's hosted checkout page.
        It supports both session-based and price-based checkout flows.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <div v-else class="checkout-form mt-4">
        <!-- Mode Selector -->
        <div class="mode-selector">
          <div class="mode-tabs">
            <button
              :class="['mode-tab', { active: checkoutMode === 'session' }]"
              @click="checkoutMode = 'session'"
            >
              Session-Based
            </button>
            <button
              :class="['mode-tab', { active: checkoutMode === 'price' }]"
              @click="checkoutMode = 'price'"
            >
              Price-Based
            </button>
          </div>
        </div>

        <!-- Session-Based Checkout -->
        <div v-if="checkoutMode === 'session'" class="form-section mt-4">
          <h4>Session-Based Checkout</h4>
          <p class="text-secondary text-sm">
            Use a pre-created Checkout Session from your backend.
          </p>

          <div class="form-group mt-4">
            <label class="form-label">Session ID</label>
            <input
              v-model="sessionId"
              type="text"
              placeholder="cs_test_..."
              class="form-input form-input-mono"
              :class="{ 'is-valid': sessionId.startsWith('cs_') }"
            />
          </div>

          <div class="instructions mt-4">
            <h5>How to get a Session ID:</h5>
            <ol>
              <li>Create a Checkout Session using Stripe CLI:
                <pre class="code-block">stripe checkout sessions create --line-items '[{"price_data":{"currency":"usd","product_data":{"name":"Demo Item"},"unit_amount":1000},"quantity":1}]' --mode payment --success-url "{{ successUrl }}" --cancel-url "{{ cancelUrl }}"</pre>
              </li>
              <li>Copy the <code>id</code> from the response (starts with <code>cs_</code>)</li>
            </ol>
          </div>
        </div>

        <!-- Price-Based Checkout -->
        <div v-if="checkoutMode === 'price'" class="form-section mt-4">
          <h4>Price-Based Checkout</h4>
          <p class="text-secondary text-sm">
            Create a checkout session dynamically using a Price ID.
          </p>

          <div class="form-group mt-4">
            <label class="form-label">Price ID</label>
            <input
              v-model="priceId"
              type="text"
              placeholder="price_..."
              class="form-input form-input-mono"
              :class="{ 'is-valid': priceId.startsWith('price_') }"
            />
          </div>

          <div class="form-group mt-3">
            <label class="form-label">Mode</label>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn btn-secondary', { active: mode === 'payment' }]"
                @click="mode = 'payment'"
              >
                Payment
              </button>
              <button
                :class="['btn btn-secondary', { active: mode === 'subscription' }]"
                @click="mode = 'subscription'"
              >
                Subscription
              </button>
            </div>
          </div>

          <div class="url-info mt-3">
            <div class="url-display">
              <span class="url-label">Success URL:</span>
              <code>{{ successUrl }}</code>
            </div>
            <div class="url-display">
              <span class="url-label">Cancel URL:</span>
              <code>{{ cancelUrl }}</code>
            </div>
          </div>

          <div class="instructions mt-4">
            <h5>How to get a Price ID:</h5>
            <ol>
              <li>Go to <a href="https://dashboard.stripe.com/test/products" target="_blank" class="link">Stripe Dashboard → Products</a></li>
              <li>Create or select a product</li>
              <li>Copy the Price ID (starts with <code>price_</code>)</li>
            </ol>
          </div>
        </div>

        <!-- Checkout Button -->
        <div class="checkout-button-wrapper mt-5">
          <br>
          <StripeProvider :publishable-key="publishableKey">
            <StripeCheckout
              v-if="checkoutMode === 'session'"
              :session-id="sessionId"
              button-text="Checkout with Session"
              loading-text="Redirecting..."
              :disabled="!isFormValid"
              button-class="checkout-button"
              @click="onCheckoutClick"
              @success="onCheckoutSuccess"
              @error="onCheckoutError"
            />

            <StripeCheckout
              v-else
              :price-id="priceId"
              :mode="mode"
              :success-url="successUrl"
              :cancel-url="cancelUrl"
              button-text="Checkout with Price"
              loading-text="Redirecting..."
              :disabled="!isFormValid"
              button-class="checkout-button"
              @click="onCheckoutClick"
              @success="onCheckoutSuccess"
              @error="onCheckoutError"
            />
          </StripeProvider>
        </div>

        <!-- Status display -->
        <div v-if="checkoutError" class="alert alert-danger mt-4">
          {{ checkoutError }}
          <button class="btn btn-sm btn-ghost ml-2" @click="checkoutError = null">Dismiss</button>
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
          Interact with the Checkout button to see events...
        </div>
        <div v-for="(entry, index) in eventLog" :key="index" class="event-entry">
          <span class="event-time">{{ entry.time }}</span>
          <span class="event-name">{{ entry.event }}</span>
          <span v-if="entry.data" class="event-data">{{ entry.data }}</span>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="card card-info">
      <h3>About Stripe Checkout</h3>

      <h4>Session-Based vs Price-Based</h4>
      <ul>
        <li><strong>Session-Based</strong>: Create a Checkout Session on your server first. More control over options.</li>
        <li><strong>Price-Based</strong>: Create session dynamically using a Price ID. Simpler but limited options.</li>
      </ul>

      <h4>When to Use Checkout</h4>
      <ul>
        <li>Quick integration without building custom UI</li>
        <li>Stripe-hosted, PCI-compliant payment page</li>
        <li>Automatic handling of 3D Secure and payment methods</li>
        <li>Built-in support for subscriptions and coupons</li>
      </ul>

      <h4>Checkout vs Payment Element</h4>
      <div class="alert alert-info mt-3">
        <strong>Checkout</strong> redirects to Stripe's hosted page.<br/>
        <strong>Payment Element</strong> embeds payment UI in your app.<br/>
        Choose Checkout for simplicity, Payment Element for control.
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
}

/* Result Banner */
.result-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.result-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 1px solid #28a745;
}

.result-cancel {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border: 1px solid #ffc107;
}

.result-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  flex-shrink: 0;
}

.result-success .result-icon {
  background: #28a745;
  color: white;
}

.result-cancel .result-icon {
  background: #ffc107;
  color: #856404;
}

.result-content {
  flex: 1;
}

.result-content h3 {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-lg);
}

.result-success .result-content h3 {
  color: #155724;
}

.result-cancel .result-content h3 {
  color: #856404;
}

.result-content p {
  margin: 0;
  font-size: var(--text-sm);
}

.result-success .result-content p {
  color: #155724;
}

.result-cancel .result-content p {
  color: #856404;
}

.result-banner .btn {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.result-banner .btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* URL Display */
.url-info {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
}

.url-display {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}

.url-display:last-child {
  margin-bottom: 0;
}

.url-label {
  color: var(--color-text-muted);
  min-width: 90px;
}

.url-display code {
  background: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-primary);
  word-break: break-all;
}

.mode-selector {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-2);
}

.mode-tabs {
  display: flex;
  gap: var(--space-2);
}

.mode-tab {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--transition-base);
}

.mode-tab:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mode-tab.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.form-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.form-section h4 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text);
}

.instructions {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.instructions h5 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text);
  font-size: var(--text-sm);
}

.instructions ol {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-muted);
}

.instructions li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
  font-size: var(--text-sm);
}

.code-block {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  font-size: var(--text-xs);
  overflow-x: auto;
  margin: var(--space-2) 0;
}

.checkout-button-wrapper {
  text-align: center;
}

.checkout-button-wrapper :deep(.checkout-button) {
  width: 100%;
  max-width: 400px;
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-base);
  background-color: #635bff;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.checkout-button-wrapper :deep(.checkout-button:hover:not(:disabled)) {
  background-color: #5a52e8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 91, 255, 0.3);
}

.checkout-button-wrapper :deep(.checkout-button:disabled) {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.card-info {
  background: linear-gradient(135deg, var(--color-info-light) 0%, #f0f7fa 100%);
  border-left: 4px solid var(--color-info);
}

.card-info h3 {
  color: var(--color-info-dark);
  margin-bottom: var(--space-4);
}

.card-info h4 {
  margin: var(--space-5) 0 var(--space-2) 0;
  color: var(--color-text);
  font-size: var(--text-base);
}

.card-info ul {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-muted);
}

.card-info li {
  margin-bottom: var(--space-2);
  line-height: 1.5;
}

.card-info .alert {
  font-size: var(--text-sm);
}

/* Button Group */
.btn-group {
  display: inline-flex;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.btn-group .btn {
  border-radius: 0;
  border: 1px solid var(--color-border);
  margin-left: -1px;
}

.btn-group .btn:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  margin-left: 0;
}

.btn-group .btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.btn-group .btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  z-index: 1;
}

.btn-secondary {
  background: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary:hover:not(.active) {
  background: var(--color-bg-secondary);
}

@media (max-width: 768px) {
  .mode-tabs {
    flex-direction: column;
  }

  .result-banner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
