<script setup lang="ts">
import { ref, inject } from 'vue'
import { StripeProvider } from '@vue-stripe/vue-stripe'
import type { Stripe } from '@stripe/stripe-js'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  console.info(`[StripeProvider Test] ${type}:`, message)
}

// Track load event
const onLoad = (stripe: Stripe) => {
  // Stripe instance is ready - you can now use it for payments
  // The stripe object has methods like confirmPayment, confirmSetup, etc.
  log('load', `Stripe.js loaded successfully! Instance ready for payments.`)
  console.info('[StripeProvider Test] Stripe instance:', stripe)
}

// Track error event
const onError = (error: Error) => {
  log('error', `Failed to load: ${error.message}`)
}

// State for testing different scenarios
const testScenario = ref<'normal' | 'custom-loading' | 'custom-error' | 'invalid-key'>('normal')
const showInvalidKey = ref(false)
</script>

<template>
  <div class="test-page">
    <div class="demo-card">
      <h2>StripeProvider Component Test</h2>
      <p>
        The root component that loads Stripe.js and provides the Stripe instance
        to all child components via Vue's provide/inject system.
      </p>

      <div class="api-reference">
        <h3>API Reference</h3>
        <table class="props-table">
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>publishableKey</code></td>
              <td>string</td>
              <td>Yes*</td>
              <td>Your Stripe publishable key (pk_test_...)</td>
            </tr>
            <tr>
              <td><code>stripeKey</code></td>
              <td>string</td>
              <td>Yes*</td>
              <td>Alias for publishableKey (backwards compat)</td>
            </tr>
            <tr>
              <td><code>stripeAccount</code></td>
              <td>string</td>
              <td>No</td>
              <td>Connected account ID for Stripe Connect</td>
            </tr>
            <tr>
              <td><code>apiVersion</code></td>
              <td>string</td>
              <td>No</td>
              <td>Override Stripe API version</td>
            </tr>
            <tr>
              <td><code>locale</code></td>
              <td>string</td>
              <td>No</td>
              <td>Locale for Stripe.js (e.g., 'en', 'es')</td>
            </tr>
          </tbody>
        </table>
        <p class="note">* Either publishableKey or stripeKey is required</p>

        <h4>Events</h4>
        <ul>
          <li><code>@load</code> - Emitted when Stripe.js loads successfully. Payload: Stripe instance</li>
          <li><code>@error</code> - Emitted when Stripe.js fails to load. Payload: Error object</li>
        </ul>

        <h4>Slots</h4>
        <ul>
          <li><code>#default</code> - Content shown when Stripe is ready</li>
          <li><code>#loading</code> - Custom loading indicator</li>
          <li><code>#error="{ error }"</code> - Custom error display</li>
        </ul>
      </div>
    </div>

    <!-- Test Scenario Selector -->
    <div class="demo-card">
      <h3>Test Scenarios</h3>
      <div class="scenario-buttons">
        <button
          :class="['btn', { active: testScenario === 'normal' }]"
          @click="testScenario = 'normal'; showInvalidKey = false"
        >
          Normal Load
        </button>
        <button
          :class="['btn', { active: testScenario === 'custom-loading' }]"
          @click="testScenario = 'custom-loading'; showInvalidKey = false"
        >
          Custom Loading Slot
        </button>
        <button
          :class="['btn', { active: testScenario === 'custom-error' }]"
          @click="testScenario = 'custom-error'; showInvalidKey = true"
        >
          Custom Error Slot
        </button>
        <button
          :class="['btn btn-danger', { active: testScenario === 'invalid-key' }]"
          @click="testScenario = 'invalid-key'; showInvalidKey = true"
        >
          Invalid Key (Error)
        </button>
      </div>
    </div>

    <!-- Live Demo -->
    <div class="demo-card">
      <h3>Live Demo</h3>

      <!-- Normal scenario with valid key -->
      <div v-if="testScenario === 'normal' && stripeConfig?.publishableKey" class="demo-container">
        <StripeProvider
          :publishable-key="stripeConfig.publishableKey"
          @load="onLoad"
          @error="onError"
        >
          <div class="success-content">
            <span class="success-icon">✅</span>
            <strong>Stripe Loaded Successfully!</strong>
            <p>The Stripe.js library has been loaded and is ready to use.</p>
            <p class="hint">Child components can now use useStripe() to access the Stripe instance.</p>
          </div>
        </StripeProvider>
      </div>

      <!-- Custom loading slot -->
      <div v-else-if="testScenario === 'custom-loading' && stripeConfig?.publishableKey" class="demo-container">
        <StripeProvider
          :publishable-key="stripeConfig.publishableKey"
          @load="onLoad"
          @error="onError"
        >
          <template #loading>
            <div class="custom-loading">
              <div class="spinner"></div>
              <p>Custom loading message: Connecting to Stripe...</p>
            </div>
          </template>

          <div class="success-content">
            <span class="success-icon">✅</span>
            <strong>Stripe Ready (Custom Loading Used)</strong>
          </div>
        </StripeProvider>
      </div>

      <!-- Custom error slot with invalid key -->
      <div v-else-if="testScenario === 'custom-error'" class="demo-container">
        <StripeProvider
          publishable-key="pk_test_invalid_key_12345"
          @load="onLoad"
          @error="onError"
        >
          <template #error="{ error }">
            <div class="custom-error">
              <span class="error-icon">🚨</span>
              <strong>Custom Error Display</strong>
              <p>{{ error }}</p>
              <button class="btn btn-small" @click="testScenario = 'normal'">
                Try Again with Valid Key
              </button>
            </div>
          </template>

          <div class="success-content">
            <strong>This won't show - key is invalid</strong>
          </div>
        </StripeProvider>
      </div>

      <!-- Invalid key (default error) -->
      <div v-else-if="testScenario === 'invalid-key'" class="demo-container">
        <StripeProvider
          publishable-key="pk_test_invalid_key_12345"
          @load="onLoad"
          @error="onError"
        >
          <div class="success-content">
            <strong>This won't show - key is invalid</strong>
          </div>
        </StripeProvider>
      </div>

      <!-- No key configured -->
      <div v-else class="no-key-warning">
        <p>⚠️ No Stripe key configured. Click <strong>"🔑 Add Key"</strong> in the header above.</p>
      </div>
    </div>

    <!-- Event Log -->
    <div class="demo-card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="events.length === 0" class="event empty">
          No events yet. Events will appear as they fire.
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
      <button v-if="events.length > 0" class="btn btn-small" @click="events = []">
        Clear Log
      </button>
    </div>

    <!-- Code Examples -->
    <div class="demo-card">
      <h3>Code Examples</h3>

      <h4>Basic Usage</h4>
      <pre class="code-block"><code>&lt;template&gt;
  &lt;StripeProvider
    publishable-key="pk_test_..."
    @load="onStripeLoaded"
    @error="onStripeError"
  &gt;
    &lt;!-- Your payment components here --&gt;
    &lt;StripeElements&gt;
      &lt;StripePaymentElement /&gt;
    &lt;/StripeElements&gt;
  &lt;/StripeProvider&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { StripeProvider, StripeElements, StripePaymentElement } from '@vue-stripe/vue-stripe'

const onStripeLoaded = (stripe) => {
  console.log('Stripe ready!', stripe)
}

const onStripeError = (error) => {
  console.error('Stripe failed to load:', error)
}
&lt;/script&gt;</code></pre>

      <h4>With Custom Slots</h4>
      <pre class="code-block"><code>&lt;StripeProvider publishable-key="pk_test_..."&gt;
  &lt;template #loading&gt;
    &lt;MyCustomSpinner /&gt;
  &lt;/template&gt;

  &lt;template #error="{ error }"&gt;
    &lt;MyErrorComponent :message="error" /&gt;
  &lt;/template&gt;

  &lt;!-- Default slot: shown when ready --&gt;
  &lt;PaymentForm /&gt;
&lt;/StripeProvider&gt;</code></pre>

      <h4>With Stripe Connect</h4>
      <pre class="code-block"><code>&lt;StripeProvider
  publishable-key="pk_test_..."
  stripe-account="acct_connected_account_id"
  locale="es"
&gt;
  &lt;!-- Payment UI for connected account --&gt;
&lt;/StripeProvider&gt;</code></pre>
    </div>

    <!-- Learning Notes -->
    <div class="demo-card learning">
      <h3>Learning Notes</h3>
      <ul>
        <li><strong>Purpose:</strong> StripeProvider is the root component that must wrap all other Stripe components.</li>
        <li><strong>Async Loading:</strong> Stripe.js loads asynchronously. The component handles loading and error states automatically.</li>
        <li><strong>Provide/Inject:</strong> Uses Vue's provide/inject to pass the Stripe instance to child components.</li>
        <li><strong>Error Handling:</strong> Invalid keys or network issues are caught and can be displayed via the error slot.</li>
        <li><strong>Stripe Connect:</strong> Use <code>stripeAccount</code> prop to make API calls on behalf of connected accounts.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* View-specific styles - most styles are now in design-system.css */

.hint {
  font-size: var(--text-sm);
  color: var(--color-text-light);
  font-style: italic;
}

.custom-error {
  text-align: center;
  background: var(--color-warning-light);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
}

/* Event log styles */
.event {
  margin-bottom: var(--space-2);
  display: flex;
  gap: var(--space-3);
  padding: var(--space-1) 0;
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
  min-width: 60px;
}

.event-type.load {
  color: #00ff88;
}

.event-type.error {
  color: #ff6b6b;
}
</style>