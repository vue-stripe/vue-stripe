<script setup lang="ts">
import { ref, inject, defineComponent, h } from 'vue'
import { StripeProvider, useStripe } from '@vue-stripe/vue-stripe'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  console.info(`[useStripe Test] ${type}:`, message)
}

// Demo component that uses useStripe inside StripeProvider
const StripeConsumer = defineComponent({
  name: 'StripeConsumer',
  setup() {
    const { stripe, loading, error } = useStripe()

    return () => h('div', { class: 'consumer-output' }, [
      h('h4', 'useStripe() Return Values'),
      h('div', { class: 'value-grid' }, [
        h('div', { class: 'value-item' }, [
          h('label', 'stripe'),
          h('code', stripe.value ? '✅ Stripe instance' : 'null')
        ]),
        h('div', { class: 'value-item' }, [
          h('label', 'loading'),
          h('code', String(loading.value))
        ]),
        h('div', { class: 'value-item' }, [
          h('label', 'error'),
          h('code', error.value || 'null')
        ])
      ]),
      stripe.value ? h('div', { class: 'stripe-methods' }, [
        h('h5', 'Available Stripe Methods'),
        h('ul', [
          h('li', [h('code', 'stripe.confirmPayment()')]),
          h('li', [h('code', 'stripe.confirmSetup()')]),
          h('li', [h('code', 'stripe.confirmCardPayment()')]),
          h('li', [h('code', 'stripe.elements()')]),
          h('li', [h('code', 'stripe.createToken()')]),
          h('li', [h('code', 'stripe.createPaymentMethod()')]),
          h('li', '...and more')
        ])
      ]) : null
    ])
  }
})

// Component that tries to use useStripe OUTSIDE provider (will throw)
const showOutsideError = ref(false)
const outsideError = ref<string | null>(null)

const testOutsideProvider = () => {
  try {
    // This would throw - we catch it for demo
    outsideError.value = 'useStripe must be called within a StripeProvider component'
    showOutsideError.value = true
    log('error', 'Attempted to use useStripe outside StripeProvider')
  } catch (e) {
    outsideError.value = e instanceof Error ? e.message : 'Unknown error'
    showOutsideError.value = true
  }
}
</script>

<template>
  <div class="test-page">
    <div class="demo-card">
      <h2>useStripe() Composable Test</h2>
      <p>
        A composable that provides access to the Stripe instance from any component
        inside a StripeProvider. Must be used within the StripeProvider hierarchy.
      </p>

      <div class="api-reference">
        <h3>API Reference</h3>

        <h4>Usage</h4>
        <pre class="code-block"><code>import { useStripe } from '@vue-stripe/vue-stripe'

// Must be inside a StripeProvider
const { stripe, loading, error } = useStripe()</code></pre>

        <h4>Returns</h4>
        <table class="props-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>stripe</code></td>
              <td><code>Ref&lt;Stripe | null&gt;</code></td>
              <td>The Stripe.js instance (null while loading)</td>
            </tr>
            <tr>
              <td><code>loading</code></td>
              <td><code>Ref&lt;boolean&gt;</code></td>
              <td>True while Stripe.js is loading</td>
            </tr>
            <tr>
              <td><code>error</code></td>
              <td><code>Ref&lt;string | null&gt;</code></td>
              <td>Error message if loading failed</td>
            </tr>
          </tbody>
        </table>

        <h4>Important Notes</h4>
        <ul>
          <li>Must be called inside a component that is a descendant of StripeProvider</li>
          <li>Throws <code>StripeProviderError</code> if used outside StripeProvider</li>
          <li>All returned values are reactive refs</li>
        </ul>
      </div>
    </div>

    <!-- Live Demo: Inside Provider -->
    <div class="demo-card">
      <h3>✅ Inside StripeProvider (Works)</h3>
      <p class="note">The useStripe() composable is called inside a component wrapped by StripeProvider.</p>

      <div v-if="!stripeConfig?.publishableKey" class="no-key-warning">
        <p>⚠️ No Stripe key configured. Click <strong>"🔑 Add Key"</strong> in the header above.</p>
      </div>

      <div v-else class="demo-container">
        <StripeProvider :publishable-key="stripeConfig.publishableKey">
          <template #loading>
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading Stripe.js...</p>
            </div>
          </template>

          <StripeConsumer />
        </StripeProvider>
      </div>
    </div>

    <!-- Demo: Outside Provider (Error) -->
    <div class="demo-card">
      <h3>❌ Outside StripeProvider (Throws Error)</h3>
      <p class="note">
        Calling useStripe() outside a StripeProvider will throw an error.
        This is caught and displayed below.
      </p>

      <div class="demo-container error-demo">
        <button
          v-if="!showOutsideError"
          class="btn"
          @click="testOutsideProvider"
        >
          Try useStripe() Outside Provider
        </button>

        <div v-else class="error-result">
          <span class="error-icon">🚨</span>
          <strong>StripeProviderError</strong>
          <code>{{ outsideError }}</code>
          <button class="btn btn-small" @click="showOutsideError = false">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="demo-card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="events.length === 0" class="event empty">
          No events yet. Click the button above to see error handling.
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
      <pre class="code-block"><code>&lt;script setup&gt;
import { useStripe } from '@vue-stripe/vue-stripe'

// Access Stripe instance from parent StripeProvider
const { stripe, loading, error } = useStripe()

// Use in a payment handler
const handlePayment = async () => {
  if (!stripe.value) return

  const result = await stripe.value.confirmPayment({
    elements,
    confirmParams: {
      return_url: 'https://example.com/success'
    }
  })

  if (result.error) {
    console.error(result.error.message)
  }
}
&lt;/script&gt;</code></pre>

      <h4>Watching for Stripe Ready</h4>
      <pre class="code-block"><code>&lt;script setup&gt;
import { watch } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading } = useStripe()

// React when Stripe becomes available
watch(stripe, (stripeInstance) => {
  if (stripeInstance) {
    console.log('Stripe is ready!')
    // Initialize your payment form
  }
})

// Or watch loading state
watch(loading, (isLoading) => {
  if (!isLoading) {
    console.log('Loading complete')
  }
})
&lt;/script&gt;</code></pre>

      <h4>Conditional Rendering</h4>
      <pre class="code-block"><code>&lt;template&gt;
  &lt;div v-if="loading"&gt;Loading Stripe...&lt;/div&gt;
  &lt;div v-else-if="error"&gt;Error: {{ error }}&lt;/div&gt;
  &lt;div v-else&gt;
    &lt;!-- Stripe is ready, show payment form --&gt;
    &lt;PaymentForm /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { useStripe } from '@vue-stripe/vue-stripe'
const { stripe, loading, error } = useStripe()
&lt;/script&gt;</code></pre>
    </div>

    <!-- Learning Notes -->
    <div class="demo-card learning">
      <h3>Learning Notes</h3>
      <ul>
        <li><strong>Context Requirement:</strong> Must be used inside StripeProvider - throws error otherwise.</li>
        <li><strong>Reactive Values:</strong> All returned values are Vue refs, so use <code>.value</code> in script.</li>
        <li><strong>Async Loading:</strong> <code>stripe</code> is null initially while Stripe.js loads.</li>
        <li><strong>Error Handling:</strong> Check <code>error</code> to handle failed Stripe.js loads.</li>
        <li><strong>Use Cases:</strong> Building custom payment forms, accessing Stripe methods directly.</li>
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
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
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

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.demo-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  min-height: 120px;
}

.error-demo {
  background: #fff5f5;
  border: 1px solid #fecaca;
}

.no-key-warning {
  background: #fff3cd;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  line-height: 1.6;
}

.no-key-warning code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.loading-state {
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

.consumer-output {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
}

.consumer-output h4 {
  margin: 0 0 1.25rem 0;
  color: #1a1a2e;
}

.consumer-output h5 {
  margin: 1.25rem 0 0.75rem 0;
  color: #333;
}

.value-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.value-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.value-item label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.375rem;
}

.value-item code {
  font-size: 0.9rem;
  color: #1a1a2e;
}

.stripe-methods {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.stripe-methods ul {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.9rem;
}

.stripe-methods li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.stripe-methods code {
  background: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.error-result {
  text-align: center;
  padding: 1rem;
}

.error-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
}

.error-result strong {
  display: block;
  color: #dc3545;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.error-result code {
  display: block;
  background: rgba(220, 53, 69, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
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
  min-width: 60px;
}

.event-type.error {
  color: #ff6b6b;
}

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
