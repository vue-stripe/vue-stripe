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
/* View-specific styles - most styles are now in design-system.css */

.error-demo {
  background: #fff5f5;
  border: 1px solid #fecaca;
}

.loading-state {
  text-align: center;
  padding: var(--space-8) var(--space-6);
}

.consumer-output {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

.consumer-output h4 {
  margin: 0 0 var(--space-4) 0;
  color: var(--color-text);
}

.consumer-output h5 {
  margin: var(--space-4) 0 var(--space-3) 0;
  color: var(--color-text);
}

.value-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.value-item {
  background: var(--color-bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.value-item label {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}

.value-item code {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.stripe-methods {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}

.stripe-methods ul {
  margin: 0;
  padding-left: var(--space-5);
  font-size: var(--text-sm);
}

.stripe-methods li {
  margin-bottom: var(--space-2);
  line-height: 1.5;
}

.error-result {
  text-align: center;
  padding: var(--space-4);
}

.error-result strong {
  display: block;
  color: var(--color-danger);
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
}

.error-result code {
  display: block;
  background: rgba(220, 53, 69, 0.1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
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

.event-type.error {
  color: #ff6b6b;
}

@media (max-width: 768px) {
  .value-grid {
    grid-template-columns: 1fr;
  }
}
</style>
