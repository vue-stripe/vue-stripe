<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeExpressCheckoutElement
} from '@vue-stripe/vue-stripe'
import type {
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent
} from '@stripe/stripe-js'

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Local client secret state
const localClientSecret = ref('')
const clientSecret = computed(() => localClientSecret.value.trim())
const showSecretForm = computed(() => publishableKey.value && !clientSecret.value)

// Express checkout ref
const expressCheckoutRef = ref<InstanceType<typeof StripeExpressCheckoutElement> | null>(null)

// Track available wallets
const availableWallets = ref<string[]>([])
const isReady = ref(false)

// Event log
const eventLog = ref<Array<{ time: string; event: string; data: string | undefined }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 20) {
    eventLog.value.pop()
  }
}

// Options for the express checkout element
const expressCheckoutOptions = computed(() => ({
  buttonType: {
    applePay: 'buy' as const,
    googlePay: 'buy' as const
  },
  buttonTheme: {
    applePay: 'black' as const,
    googlePay: 'black' as const
  },
  layout: {
    maxColumns: 3,
    maxRows: 1
  }
}))

// Event handlers
const onReady = (event: StripeExpressCheckoutElementReadyEvent) => {
  isReady.value = true
  if (event.availablePaymentMethods) {
    const methods = Object.entries(event.availablePaymentMethods)
      .filter(([, available]) => available)
      .map(([method]) => method)
    availableWallets.value = methods
    logEvent('ready', `Available: ${methods.join(', ') || 'none'}`)
  } else {
    logEvent('ready', 'No payment methods available')
  }
}

const onClick = (event: StripeExpressCheckoutElementClickEvent) => {
  logEvent('click', `Wallet: ${event.expressPaymentType}`)
  // Resolve the event to continue with the payment sheet
  event.resolve({})
}

const onConfirm = (event: StripeExpressCheckoutElementConfirmEvent) => {
  logEvent('confirm', `Payment type: ${event.expressPaymentType}`)
  // In a real app, you would confirm the payment here
  console.info('Express checkout confirm event:', event)
}

const onCancel = () => {
  logEvent('cancel', 'User cancelled payment')
}

const onShippingAddressChange = (event: unknown) => {
  logEvent('shippingaddresschange', JSON.stringify(event))
}

const onShippingRateChange = (event: unknown) => {
  logEvent('shippingratechange', JSON.stringify(event))
}
</script>

<template>
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">StripeExpressCheckoutElement</h2>
      <p class="text-secondary">
        The Express Checkout Element displays wallet payment buttons like Apple Pay, Google Pay,
        and Link, enabling one-click checkout for customers with saved payment methods.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <!-- Client Secret Form -->
      <div v-else-if="showSecretForm" class="secret-form mt-4">
        <h4>Enter Client Secret</h4>
        <p class="text-secondary text-sm">The Express Checkout Element requires a <code>clientSecret</code> from a PaymentIntent.</p>

        <div class="form-group mt-4">
          <label class="form-label">Client Secret</label>
          <input
            v-model="localClientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx"
            class="form-input form-input-mono"
            :class="{ 'is-valid': localClientSecret.includes('_secret_') }"
          />
        </div>

        <div class="instructions mt-4">
          <h5>How to get a Client Secret:</h5>
          <ol>
            <li>Go to <a href="https://dashboard.stripe.com/test/payments" target="_blank" class="link">Stripe Dashboard → Payments</a></li>
            <li>Click <strong>"+ Create"</strong> → <strong>"Create payment"</strong></li>
            <li>Enter an amount (e.g., $10.00)</li>
            <li>Copy the <code>client_secret</code> from the response</li>
          </ol>
          <p class="text-muted text-sm mt-2">
            The client secret looks like: <code>pi_xxx_secret_xxx</code>
          </p>
        </div>
      </div>

      <!-- Configuration info -->
      <div v-if="publishableKey && clientSecret" class="config-section mt-4">
        <h4>Configuration</h4>
        <div class="config-info">
          <p class="text-secondary text-sm">
            Express Checkout buttons are configured with <code>buy</code> button type and <code>black</code> theme.
            The actual availability of payment methods depends on:
          </p>
          <ul class="text-secondary text-sm">
            <li>Customer's device and browser (Apple Pay requires Safari on Apple devices)</li>
            <li>Whether the customer has a wallet set up</li>
            <li>Your Stripe Dashboard payment method settings</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Live Demo -->
    <div v-if="publishableKey && clientSecret" class="card">
      <h3>Live Demo</h3>
      <p class="text-secondary text-sm mb-4">
        Wallet payment buttons will appear below if available on your device.
        Testing typically requires a real device with a configured wallet.
      </p>

      <!-- Show current secret and allow clearing -->
      <div class="secret-status mb-4">
        <span class="secret-label">Client Secret:</span>
        <code class="secret-value">{{ clientSecret.slice(0, 15) }}...{{ clientSecret.slice(-8) }}</code>
        <button class="btn btn-sm btn-ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
          Clear
        </button>
      </div>

      <div class="demo-container">
        <StripeProvider :publishable-key="publishableKey">
          <StripeElements :client-secret="clientSecret">
            <div class="express-checkout-wrapper">
              <StripeExpressCheckoutElement
                ref="expressCheckoutRef"
                :options="expressCheckoutOptions"
                @ready="onReady"
                @click="onClick"
                @confirm="onConfirm"
                @cancel="onCancel"
                @shippingaddresschange="onShippingAddressChange"
                @shippingratechange="onShippingRateChange"
              />
            </div>
          </StripeElements>
        </StripeProvider>
      </div>

      <!-- Available Wallets Display -->
      <div class="wallet-status mt-4">
        <h4>Available Payment Methods</h4>
        <div v-if="!isReady" class="status-loading">
          Loading available payment methods...
        </div>
        <div v-else-if="availableWallets.length > 0" class="wallet-list">
          <span
            v-for="wallet in availableWallets"
            :key="wallet"
            class="wallet-badge"
          >
            {{ wallet }}
          </span>
        </div>
        <div v-else class="no-wallets">
          <p>No wallet payment methods available on this device/browser.</p>
          <p class="text-sm text-muted mt-2">
            This is normal when testing. Express Checkout requires:
          </p>
          <ul class="text-sm text-muted">
            <li>Apple Pay: Safari on macOS/iOS with Apple Wallet configured</li>
            <li>Google Pay: Chrome with Google Pay configured</li>
            <li>Link: Customer must have a Stripe Link account</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
          Interact with the Express Checkout Element to see events...
        </div>
        <div v-for="(entry, index) in eventLog" :key="index" class="event-entry">
          <span class="event-time">{{ entry.time }}</span>
          <span class="event-name">{{ entry.event }}</span>
          <span v-if="entry.data" class="event-data">{{ entry.data }}</span>
        </div>
      </div>
    </div>

    <!-- API Reference -->
    <div class="card">
      <h3>API Reference</h3>

      <h4>Props</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>options</code></td>
            <td>StripeExpressCheckoutElementOptions</td>
            <td>Configuration for button appearance, layout, and payment methods</td>
          </tr>
        </tbody>
      </table>

      <h4>Events</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Payload</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@ready</code></td>
            <td>{ availablePaymentMethods }</td>
            <td>Fired when mounted, includes which wallets are available</td>
          </tr>
          <tr>
            <td><code>@click</code></td>
            <td>StripeExpressCheckoutElementClickEvent</td>
            <td>Fired when a payment button is clicked. Call event.resolve() to continue.</td>
          </tr>
          <tr>
            <td><code>@confirm</code></td>
            <td>StripeExpressCheckoutElementConfirmEvent</td>
            <td>Fired when payment is authorized. Confirm the PaymentIntent here.</td>
          </tr>
          <tr>
            <td><code>@cancel</code></td>
            <td>void</td>
            <td>Fired when the customer cancels the payment sheet</td>
          </tr>
          <tr>
            <td><code>@shippingaddresschange</code></td>
            <td>{ address, name }</td>
            <td>Fired when shipping address changes (if shipping enabled)</td>
          </tr>
          <tr>
            <td><code>@shippingratechange</code></td>
            <td>{ shippingRate }</td>
            <td>Fired when shipping rate changes (if shipping enabled)</td>
          </tr>
        </tbody>
      </table>

      <h4>Exposed Properties</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>element</code></td>
            <td>StripeExpressCheckoutElement | null</td>
            <td>Direct access to the underlying Stripe element</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td>boolean</td>
            <td>Whether the element is still loading</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td>string | null</td>
            <td>Error message if element creation failed</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Card -->
    <div class="card card-info">
      <h3>About Express Checkout Element</h3>

      <h4>What is Express Checkout?</h4>
      <p>
        Express Checkout provides one-click payment buttons for digital wallets like Apple Pay,
        Google Pay, and Stripe Link. Customers can pay instantly using payment methods saved
        in their wallets without entering card details.
      </p>

      <h4>Supported Payment Methods</h4>
      <ul>
        <li><strong>Apple Pay</strong> - Available on Safari (macOS, iOS) with Apple Wallet</li>
        <li><strong>Google Pay</strong> - Available on Chrome/Android with Google Pay configured</li>
        <li><strong>Link</strong> - Stripe's saved payment method system</li>
      </ul>

      <h4>Pairing Recommendation</h4>
      <div class="alert alert-info mt-3">
        <strong>Tip:</strong> Place Express Checkout at the top of your checkout page as a
        fast-path option, with traditional payment methods below as a fallback.
      </div>

      <h4>Click Event Handling</h4>
      <p>
        The <code>@click</code> event must call <code>event.resolve()</code> to continue
        with the payment sheet. You can pass options to customize the payment:
      </p>
      <pre><code>const onClick = (event) => {
  event.resolve({
    lineItems: [{ name: 'Product', amount: 1000 }],
    shippingOptions: [...]
  })
}</code></pre>

      <h4>Requirements</h4>
      <ul>
        <li>Requires a <code>clientSecret</code> from a PaymentIntent</li>
        <li>Must be placed within <code>StripeElements</code></li>
        <li>Payment methods must be enabled in Stripe Dashboard</li>
        <li>HTTPS required (except localhost for testing)</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.card-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
}

.config-section h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
  color: var(--color-text);
}

.config-info {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.config-info ul {
  margin: var(--space-2) 0 0 0;
  padding-left: var(--space-5);
}

.config-info li {
  margin-bottom: var(--space-1);
}

/* Secret Form */
.secret-form h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-base);
  color: var(--color-text);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-input.is-valid {
  border-color: var(--color-success);
}

.form-input-mono {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: var(--text-xs);
}

.instructions {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.instructions h5 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.instructions ol {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.instructions li {
  margin-bottom: var(--space-2);
}

.link {
  color: var(--color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Secret Status */
.secret-status {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.secret-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.secret-value {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  background: var(--color-bg-tertiary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.btn-ghost:hover {
  color: var(--color-text);
  background: var(--color-bg-tertiary);
}

.demo-container {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.express-checkout-wrapper {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
  min-height: 60px;
}

/* Wallet Status */
.wallet-status {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.wallet-status h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.status-loading {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.wallet-list {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.wallet-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  background: var(--color-success-light);
  color: var(--color-success-dark);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: capitalize;
}

.no-wallets {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.no-wallets ul {
  margin: var(--space-2) 0 0 0;
  padding-left: var(--space-5);
}

.no-wallets li {
  margin-bottom: var(--space-1);
}

/* Event Log */
.event-log {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  max-height: 300px;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: var(--text-xs);
}

.event-empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-4);
}

.event-entry {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.event-entry:last-child {
  border-bottom: none;
}

.event-time {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.event-name {
  color: var(--color-primary);
  font-weight: 500;
  flex-shrink: 0;
}

.event-data {
  color: var(--color-text);
  word-break: break-word;
}

/* Info Card */
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

.card-info p {
  color: var(--color-text-muted);
  line-height: 1.6;
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

.card-info pre {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  overflow-x: auto;
  font-size: var(--text-xs);
}

.card-info code {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.card-info .alert {
  font-size: var(--text-sm);
}
</style>
