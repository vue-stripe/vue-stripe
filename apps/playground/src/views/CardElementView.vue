<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { StripeProvider, StripeElements, StripeCardElement } from '@vue-stripe/vue-stripe'
import type { StripeCardElement as StripeCardElementType, StripeCardElementChangeEvent } from '@stripe/stripe-js'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  if (events.value.length > 20) events.value.pop()
  console.info(`[CardElement Test] ${type}:`, message)
}

// Card element ref for programmatic access
const cardElementRef = ref<InstanceType<typeof StripeCardElement> | null>(null)

// Card state from change events
const cardState = ref<{
  complete: boolean
  empty: boolean
  brand: string | null
  error: string | null
}>({
  complete: false,
  empty: true,
  brand: null,
  error: null
})

// Style options
const styleOption = ref<'default' | 'minimal' | 'custom'>('default')

const styleOptions = computed(() => {
  switch (styleOption.value) {
    case 'minimal':
      return {
        style: {
          base: {
            fontSize: '16px',
            color: '#333',
            '::placeholder': { color: '#aab7c4' }
          }
        },
        hidePostalCode: true
      }
    case 'custom':
      return {
        style: {
          base: {
            fontSize: '18px',
            color: '#1a1a2e',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#87bbfd' },
            iconColor: '#635bff'
          },
          invalid: {
            color: '#dc3545',
            iconColor: '#dc3545'
          }
        }
      }
    default:
      return {}
  }
})

// Event handlers
const handleReady = (element: StripeCardElementType) => {
  log('ready', 'Card element mounted and ready')
}

const handleChange = (event: StripeCardElementChangeEvent) => {
  cardState.value = {
    complete: event.complete,
    empty: event.empty,
    brand: event.brand || null,
    error: event.error?.message || null
  }

  if (event.error) {
    log('error', event.error.message)
  } else if (event.complete) {
    log('complete', `Card complete - Brand: ${event.brand}`)
  } else if (!event.empty) {
    log('change', `Typing... Brand: ${event.brand || 'unknown'}`)
  }
}

const handleFocus = () => {
  log('focus', 'Card element focused')
}

const handleBlur = () => {
  log('blur', 'Card element blurred')
}

const handleEscape = () => {
  log('escape', 'Escape key pressed')
}

// Programmatic methods
const focusCard = () => {
  cardElementRef.value?.focus()
  log('action', 'Called focus()')
}

const clearCard = () => {
  cardElementRef.value?.clear()
  log('action', 'Called clear()')
}

// Test card numbers
const testCards = [
  { number: '4242 4242 4242 4242', brand: 'Visa', description: 'Successful payment' },
  { number: '4000 0000 0000 3220', brand: 'Visa', description: '3D Secure 2 authentication' },
  { number: '4000 0000 0000 9995', brand: 'Visa', description: 'Declined (insufficient funds)' },
  { number: '5555 5555 5555 4444', brand: 'Mastercard', description: 'Successful payment' },
  { number: '3782 822463 10005', brand: 'Amex', description: 'Successful payment' }
]
</script>

<template>
  <div class="test-page">
    <div class="demo-card">
      <h2>StripeCardElement Component Test</h2>
      <p>
        A single unified card input for collecting card number, expiry, CVC, and postal code.
        This is the classic Stripe card input - simpler than PaymentElement but card-only.
      </p>

      <div class="api-reference">
        <h3>API Reference</h3>
        <table class="props-table">
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
              <td>StripeCardElementOptions</td>
              <td>Style and configuration options</td>
            </tr>
          </tbody>
        </table>

        <h4>Events</h4>
        <table class="props-table">
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
              <td>StripeCardElement</td>
              <td>Fired when element is mounted</td>
            </tr>
            <tr>
              <td><code>@change</code></td>
              <td>StripeCardElementChangeEvent</td>
              <td>Fired on input change (includes complete, empty, brand, error)</td>
            </tr>
            <tr>
              <td><code>@focus</code></td>
              <td>-</td>
              <td>Fired when element gains focus</td>
            </tr>
            <tr>
              <td><code>@blur</code></td>
              <td>-</td>
              <td>Fired when element loses focus</td>
            </tr>
            <tr>
              <td><code>@escape</code></td>
              <td>-</td>
              <td>Fired when escape key is pressed</td>
            </tr>
          </tbody>
        </table>

        <h4>Exposed Methods (via ref)</h4>
        <ul>
          <li><code>focus()</code> - Focus the card input</li>
          <li><code>blur()</code> - Blur the card input</li>
          <li><code>clear()</code> - Clear the card input</li>
          <li><code>element</code> - Access the underlying Stripe element</li>
        </ul>
      </div>
    </div>

    <!-- Style Options -->
    <div class="demo-card">
      <h3>Style Options</h3>
      <div class="scenario-buttons">
        <button
          :class="['btn', { active: styleOption === 'default' }]"
          @click="styleOption = 'default'"
        >
          Default
        </button>
        <button
          :class="['btn', { active: styleOption === 'minimal' }]"
          @click="styleOption = 'minimal'"
        >
          Minimal (no postal)
        </button>
        <button
          :class="['btn', { active: styleOption === 'custom' }]"
          @click="styleOption = 'custom'"
        >
          Custom Styled
        </button>
      </div>
    </div>

    <!-- Live Demo -->
    <div class="demo-card">
      <h3>Live Demo</h3>

      <div v-if="!stripeConfig?.publishableKey" class="no-key-warning">
        <p>⚠️ No Stripe key configured. Click <strong>"🔑 Add Key"</strong> in the header above.</p>
      </div>

      <div v-else class="demo-container">
        <StripeProvider :publishable-key="stripeConfig.publishableKey">
          <StripeElements>
            <template #loading>
              <div class="custom-loading">
                <div class="spinner"></div>
                <p>Initializing Stripe Elements...</p>
              </div>
            </template>

            <div class="card-form">
              <label class="card-label">Card Details</label>
              <StripeCardElement
                ref="cardElementRef"
                :options="styleOptions"
                @ready="handleReady"
                @change="handleChange"
                @focus="handleFocus"
                @blur="handleBlur"
                @escape="handleEscape"
              />

              <!-- Card State Display -->
              <div class="card-state">
                <div class="state-item">
                  <span class="state-label">Complete:</span>
                  <span :class="['state-value', cardState.complete ? 'success' : '']">
                    {{ cardState.complete ? '✅ Yes' : '❌ No' }}
                  </span>
                </div>
                <div class="state-item">
                  <span class="state-label">Empty:</span>
                  <span class="state-value">{{ cardState.empty ? 'Yes' : 'No' }}</span>
                </div>
                <div class="state-item">
                  <span class="state-label">Brand:</span>
                  <span class="state-value brand">{{ cardState.brand || '-' }}</span>
                </div>
                <div v-if="cardState.error" class="state-item error">
                  <span class="state-label">Error:</span>
                  <span class="state-value">{{ cardState.error }}</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="btn btn-small" @click="focusCard">Focus</button>
                <button class="btn btn-small" @click="clearCard">Clear</button>
              </div>
            </div>
          </StripeElements>
        </StripeProvider>
      </div>
    </div>

    <!-- Test Cards -->
    <div class="demo-card">
      <h3>Test Card Numbers</h3>
      <p class="note">Use these test card numbers with any future expiry date and any 3-digit CVC.</p>
      <table class="test-cards-table">
        <thead>
          <tr>
            <th>Card Number</th>
            <th>Brand</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="card in testCards" :key="card.number">
            <td><code>{{ card.number }}</code></td>
            <td>{{ card.brand }}</td>
            <td>{{ card.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Event Log -->
    <div class="demo-card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="events.length === 0" class="event empty">
          No events yet. Interact with the card input to see events.
        </div>
        <div
          v-for="(event, index) in events"
          :key="index"
          class="event"
        >
          <span class="timestamp">{{ event.time }}</span>
          <span :class="['event-type', event.type]">{{ event.type }}</span>
          <span class="event-message">{{ event.message }}</span>
        </div>
      </div>
    </div>

    <!-- Code Examples -->
    <div class="demo-card">
      <h3>Code Examples</h3>

      <h4>Basic Usage</h4>
      <pre class="code-block"><code>&lt;template&gt;
  &lt;StripeProvider :publishable-key="publishableKey"&gt;
    &lt;StripeElements&gt;
      &lt;StripeCardElement
        @ready="onReady"
        @change="onChange"
      /&gt;
    &lt;/StripeElements&gt;
  &lt;/StripeProvider&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { StripeProvider, StripeElements, StripeCardElement } from '@vue-stripe/vue-stripe'

const onReady = (element) => console.log('Card ready!')
const onChange = (event) => {
  if (event.complete) {
    console.log('Card details complete')
  }
}
&lt;/script&gt;</code></pre>

      <h4>With Custom Styling</h4>
      <pre class="code-block"><code>&lt;StripeCardElement
  :options="{
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': { color: '#aab7c4' }
      },
      invalid: {
        color: '#9e2146'
      }
    },
    hidePostalCode: true
  }"
/&gt;</code></pre>

      <h4>Creating a Payment Method</h4>
      <pre class="code-block"><code>&lt;script setup&gt;
import { ref } from 'vue'
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const cardRef = ref()
const { stripe } = useStripe()
const { elements } = useStripeElements()

const handleSubmit = async () => {
  const cardElement = cardRef.value.element

  const { paymentMethod, error } = await stripe.value.createPaymentMethod({
    type: 'card',
    card: cardElement
  })

  if (error) {
    console.error(error.message)
  } else {
    console.log('PaymentMethod:', paymentMethod.id)
    // Send paymentMethod.id to your server
  }
}
&lt;/script&gt;</code></pre>
    </div>

    <!-- Learning Notes -->
    <div class="demo-card learning">
      <h3>Learning Notes</h3>
      <ul>
        <li><strong>No clientSecret needed:</strong> CardElement works without a clientSecret on StripeElements.</li>
        <li><strong>Events:</strong> Use @change to track card state (complete, empty, brand, error).</li>
        <li><strong>Styling:</strong> Use the style option with base/invalid/complete states.</li>
        <li><strong>Postal Code:</strong> Set <code>hidePostalCode: true</code> to hide it.</li>
        <li><strong>Programmatic Access:</strong> Use ref to call focus(), blur(), clear() methods.</li>
        <li><strong>Payment Flow:</strong> Use <code>stripe.createPaymentMethod()</code> or <code>stripe.createToken()</code> with the card element.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.test-page {
  max-width: 900px;
  margin: 0 auto;
}

.api-reference {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.api-reference h3 {
  margin: 0 0 1.5rem 0;
  color: #1a1a2e;
}

.api-reference h4 {
  margin: 2rem 0 1rem 0;
  color: #333;
}

.api-reference ul {
  margin: 1rem 0 0 0;
  padding-left: 1.5rem;
}

.api-reference li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.props-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.props-table th,
.props-table td {
  text-align: left;
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
}

.props-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.props-table code {
  background: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.note {
  font-size: 0.875rem;
  color: #666;
  margin: 1rem 0 1.5rem 0;
  line-height: 1.6;
}

.scenario-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  background: #635bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.625rem 1.25rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #5a52e8;
}

.btn.active {
  background: #4840d6;
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.3);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.demo-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
}

.no-key-warning {
  background: #fff3cd;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  line-height: 1.6;
}

.custom-loading {
  text-align: center;
  padding: 3rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #eee;
  border-top-color: #635bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1a1a2e;
  font-size: 0.95rem;
}

.card-state {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
}

.state-item {
  display: flex;
  gap: 0.5rem;
}

.state-item.error {
  flex-basis: 100%;
  color: #dc3545;
  margin-top: 0.5rem;
}

.state-label {
  color: #666;
}

.state-value {
  font-weight: 500;
}

.state-value.success {
  color: #28a745;
}

.state-value.brand {
  text-transform: capitalize;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.test-cards-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.test-cards-table th,
.test-cards-table td {
  text-align: left;
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
}

.test-cards-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.test-cards-table code {
  background: #e9ecef;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
}

.event-log {
  background: #1a1a2e;
  color: #00ff88;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  padding: 1.25rem;
  border-radius: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.event {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.event.empty {
  color: #888;
  font-style: italic;
}

.timestamp {
  color: #888;
}

.event-type {
  font-weight: bold;
  min-width: 80px;
}

.event-type.ready { color: #00ff88; }
.event-type.change { color: #87ceeb; }
.event-type.complete { color: #00ff88; }
.event-type.focus { color: #ffd700; }
.event-type.blur { color: #ffa500; }
.event-type.error { color: #ff6b6b; }
.event-type.action { color: #da70d6; }
.event-type.escape { color: #ff69b4; }

.code-block {
  background: #1a1a2e;
  color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 1rem 0 1.5rem 0;
  line-height: 1.5;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', monospace;
}

.learning {
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f7fa 100%);
  border-left: 4px solid #17a2b8;
}

.learning h3 {
  color: #17a2b8;
  margin-bottom: 1.25rem;
}

.learning ul {
  margin: 0;
  padding-left: 1.5rem;
}

.learning li {
  margin-bottom: 0.875rem;
  line-height: 1.7;
}

.learning code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}
</style>
