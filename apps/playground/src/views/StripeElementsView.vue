<script setup lang="ts">
import { ref, inject, defineComponent, h, computed } from 'vue'
import { StripeProvider, StripeElements, useStripeElements } from '@vue-stripe/vue-stripe'
import type { StripeElements as StripeElementsType } from '@stripe/stripe-js'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  console.info(`[StripeElements Test] ${type}:`, message)
}

// State for testing different scenarios
const testScenario = ref<'basic' | 'with-options' | 'appearance' | 'dark-theme'>('basic')

// Mock client secret (in real app, this comes from your backend)
const clientSecret = ref<string>('')
const showClientSecretInput = ref(true)

// Validate client secret format
const clientSecretStatus = computed(() => {
  if (!clientSecret.value) {
    return { valid: false, type: 'none', message: 'No client secret provided (optional for CardElement)' }
  }

  const value = clientSecret.value.trim()

  if (value.startsWith('pi_') && value.includes('_secret_')) {
    return { valid: true, type: 'payment_intent', message: '✅ Valid PaymentIntent client secret' }
  }

  if (value.startsWith('seti_') && value.includes('_secret_')) {
    return { valid: true, type: 'setup_intent', message: '✅ Valid SetupIntent client secret' }
  }

  return { valid: false, type: 'invalid', message: '❌ Invalid format. Expected pi_xxx_secret_xxx or seti_xxx_secret_xxx' }
})

// Computed for clean client secret value
const cleanClientSecret = computed(() => clientSecret.value.trim() || undefined)

// Child component that uses useStripeElements to verify provide/inject works
const ElementsConsumer = defineComponent({
  name: 'ElementsConsumer',
  props: {
    clientSecret: String
  },
  setup(props) {
    const { elements, loading, error } = useStripeElements()

    return () => h('div', { class: 'elements-status' }, [
      h('h4', 'useStripeElements() Status'),
      h('ul', [
        h('li', [h('strong', 'loading: '), String(loading.value)]),
        h('li', [h('strong', 'error: '), error.value || 'null']),
        h('li', [
          h('strong', 'elements: '),
          elements.value ? '✅ StripeElements instance available' : '❌ null'
        ]),
        h('li', [
          h('strong', 'clientSecret: '),
          props.clientSecret
            ? h('span', { class: 'secret-provided' }, ['✅ Provided (', props.clientSecret.slice(0, 10), '...)'])
            : h('span', { class: 'secret-not-provided' }, '⚪ Not provided')
        ])
      ]),
      props.clientSecret
        ? h('p', { class: 'elements-note success' }, '→ PaymentElement can be used')
        : h('p', { class: 'elements-note info' }, '→ CardElement can be used (no clientSecret needed)')
    ])
  }
})

// Appearance options for customization demo
const appearanceOptions = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px'
  }
}

const darkAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#7c3aed'
  }
}
</script>

<template>
  <div class="test-page">
    <div class="demo-card">
      <h2>StripeElements Component Test</h2>
      <p>
        Creates a Stripe Elements instance and provides it to child element components.
        Must be used within a StripeProvider.
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
              <td><code>clientSecret</code></td>
              <td>string</td>
              <td>No*</td>
              <td>Client secret from PaymentIntent or SetupIntent</td>
            </tr>
            <tr>
              <td><code>options</code></td>
              <td>object</td>
              <td>No</td>
              <td>Elements configuration (appearance, fonts, locale)</td>
            </tr>
          </tbody>
        </table>
        <p class="note">* Required for Payment Element. Optional for Card Element.</p>

        <h4>Slots</h4>
        <ul>
          <li><code>#default</code> - Content shown when Elements is ready</li>
          <li><code>#loading</code> - Custom loading indicator</li>
          <li><code>#error="{ error }"</code> - Custom error display</li>
        </ul>

        <h4>Provides (via useStripeElements)</h4>
        <ul>
          <li><code>elements</code> - Ref&lt;StripeElements | null&gt;</li>
          <li><code>loading</code> - Ref&lt;boolean&gt;</li>
          <li><code>error</code> - Ref&lt;string | null&gt;</li>
        </ul>
      </div>
    </div>

    <!-- Test Scenario Selector -->
    <div class="demo-card">
      <h3>Test Scenarios</h3>
      <div class="scenario-buttons">
        <button
          :class="['btn', { active: testScenario === 'basic' }]"
          @click="testScenario = 'basic'"
        >
          Basic (No clientSecret)
        </button>
        <button
          :class="['btn', { active: testScenario === 'with-options' }]"
          @click="testScenario = 'with-options'"
        >
          With Options
        </button>
        <button
          :class="['btn', { active: testScenario === 'appearance' }]"
          @click="testScenario = 'appearance'"
        >
          Custom Appearance
        </button>
        <button
          :class="['btn', { active: testScenario === 'dark-theme' }]"
          @click="testScenario = 'dark-theme'"
        >
          Dark Theme
        </button>
      </div>
    </div>

    <!-- Client Secret Input (optional) -->
    <div class="demo-card">
      <h3>Client Secret (Optional)</h3>
      <p class="note">
        For Payment Element, you need a clientSecret from a PaymentIntent.
        For Card Element, clientSecret is not required on StripeElements.
      </p>

      <div class="how-to-get">
        <h4>How to get a Client Secret:</h4>
        <ol>
          <li>
            <strong>Stripe Dashboard (easiest):</strong>
            <a href="https://dashboard.stripe.com/test/payments" target="_blank">Dashboard → Payments</a>
            → Click <strong>+ Create</strong> → Set amount → Create → Copy the <code>client_secret</code> from the response
          </li>
          <li>
            <strong>Stripe CLI:</strong>
            <code class="code-snippet">stripe payment_intents create --amount=1000 --currency=usd</code>
          </li>
          <li>
            <strong>Your Backend API:</strong>
            Create a PaymentIntent via <code>stripe.paymentIntents.create()</code> and return the <code>client_secret</code>
          </li>
        </ol>
      </div>

      <div class="input-group">
        <input
          v-model="clientSecret"
          type="text"
          placeholder="pi_xxx_secret_xxx (optional)"
          class="input"
          :class="{
            'input-valid': clientSecretStatus.valid,
            'input-invalid': clientSecretStatus.type === 'invalid'
          }"
        />
        <button class="btn btn-small" @click="clientSecret = ''">Clear</button>
      </div>
      <div
        class="secret-status"
        :class="{
          'status-valid': clientSecretStatus.valid,
          'status-invalid': clientSecretStatus.type === 'invalid',
          'status-none': clientSecretStatus.type === 'none'
        }"
      >
        {{ clientSecretStatus.message }}
        <span v-if="clientSecretStatus.valid" class="secret-type">
          ({{ clientSecretStatus.type === 'payment_intent' ? 'PaymentIntent' : 'SetupIntent' }})
        </span>
      </div>
    </div>

    <!-- Live Demo -->
    <div class="demo-card">
      <h3>Live Demo</h3>

      <div v-if="!stripeConfig?.publishableKey" class="no-key-warning">
        <p>⚠️ No Stripe key configured. Click <strong>"🔑 Add Key"</strong> in the header above.</p>
      </div>

      <!-- Basic scenario -->
      <div v-else-if="testScenario === 'basic'" class="demo-container">
        <StripeProvider :publishable-key="stripeConfig.publishableKey">
          <StripeElements :client-secret="cleanClientSecret">
            <template #loading>
              <div class="custom-loading">
                <div class="spinner"></div>
                <p>Initializing Stripe Elements...</p>
              </div>
            </template>

            <template #error="{ error }">
              <div class="error-display">
                <span class="error-icon">❌</span>
                <p>{{ error }}</p>
              </div>
            </template>

            <div class="success-content">
              <span class="success-icon">✅</span>
              <strong>StripeElements Ready!</strong>
              <p>The Elements instance is now available to child components.</p>
              <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
            </div>
          </StripeElements>
        </StripeProvider>
      </div>

      <!-- With options -->
      <div v-else-if="testScenario === 'with-options'" class="demo-container">
        <StripeProvider :publishable-key="stripeConfig.publishableKey">
          <StripeElements
            :client-secret="cleanClientSecret"
            :options="{ locale: 'en' }"
          >
            <template #loading>
              <div class="custom-loading">
                <div class="spinner"></div>
                <p>Initializing with options...</p>
              </div>
            </template>

            <div class="success-content">
              <span class="success-icon">✅</span>
              <strong>StripeElements with Options</strong>
              <p>Initialized with <code>locale: 'en'</code></p>
              <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
            </div>
          </StripeElements>
        </StripeProvider>
      </div>

      <!-- Custom appearance -->
      <div v-else-if="testScenario === 'appearance'" class="demo-container">
        <StripeProvider :publishable-key="stripeConfig.publishableKey">
          <StripeElements
            :client-secret="cleanClientSecret"
            :options="{ appearance: appearanceOptions }"
          >
            <div class="success-content">
              <span class="success-icon">🎨</span>
              <strong>Custom Appearance</strong>
              <p>Using the Stripe Appearance API for styling.</p>
              <pre class="code-inline">{{ JSON.stringify(appearanceOptions, null, 2) }}</pre>
              <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
            </div>
          </StripeElements>
        </StripeProvider>
      </div>

      <!-- Dark theme -->
      <div v-else-if="testScenario === 'dark-theme'" class="demo-container dark">
        <StripeProvider :publishable-key="stripeConfig.publishableKey">
          <StripeElements
            :client-secret="cleanClientSecret"
            :options="{ appearance: darkAppearance }"
          >
            <div class="success-content">
              <span class="success-icon">🌙</span>
              <strong>Dark Theme</strong>
              <p>Using <code>theme: 'night'</code> with custom primary color.</p>
              <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
            </div>
          </StripeElements>
        </StripeProvider>
      </div>
    </div>

    <!-- Event Log -->
    <div class="demo-card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="events.length === 0" class="event empty">
          No events yet. StripeElements doesn't emit events directly -
          use useStripeElements() to access state.
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
    &lt;StripeElements :client-secret="clientSecret"&gt;
      &lt;StripePaymentElement /&gt;
    &lt;/StripeElements&gt;
  &lt;/StripeProvider&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { StripeProvider, StripeElements, StripePaymentElement } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
&lt;/script&gt;</code></pre>

      <h4>With Appearance Customization</h4>
      <pre class="code-block"><code>&lt;StripeElements
  :client-secret="clientSecret"
  :options="{
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        borderRadius: '8px'
      },
      rules: {
        '.Input': {
          border: '1px solid #e6e6e6'
        }
      }
    }
  }"
&gt;
  &lt;StripePaymentElement /&gt;
&lt;/StripeElements&gt;</code></pre>

      <h4>Card Element (No clientSecret)</h4>
      <pre class="code-block"><code>&lt;!-- Card Element doesn't require clientSecret on StripeElements --&gt;
&lt;StripeProvider :publishable-key="publishableKey"&gt;
  &lt;StripeElements&gt;
    &lt;StripeCardElement /&gt;
  &lt;/StripeElements&gt;
&lt;/StripeProvider&gt;</code></pre>

      <h4>Using useStripeElements</h4>
      <pre class="code-block"><code>&lt;script setup&gt;
import { useStripeElements } from '@vue-stripe/vue-stripe'

// Must be used within StripeElements
const { elements, loading, error } = useStripeElements()

// Access the Elements instance
if (elements.value) {
  // Create individual elements, get element by type, etc.
  const paymentElement = elements.value.getElement('payment')
}
&lt;/script&gt;</code></pre>
    </div>

    <!-- Learning Notes -->
    <div class="demo-card learning">
      <h3>Learning Notes</h3>
      <ul>
        <li><strong>Hierarchy:</strong> StripeElements must be used within StripeProvider.</li>
        <li><strong>clientSecret:</strong> Required for PaymentElement, optional for CardElement.</li>
        <li><strong>Appearance API:</strong> Customize all Elements with themes, variables, and rules.</li>
        <li><strong>Provide/Inject:</strong> Child components access the Elements instance via useStripeElements().</li>
        <li><strong>Reactivity:</strong> When clientSecret changes, Elements is recreated automatically.</li>
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
  font-size: 0.875rem;
  color: #666;
  margin: 1rem 0 0 0;
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

.input-group {
  display: flex;
  gap: 0.75rem;
}

.input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.input-valid {
  border-color: #28a745;
  background-color: #f8fff9;
}

.input-invalid {
  border-color: #dc3545;
  background-color: #fff8f8;
}

.secret-status {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.status-valid {
  background: #d4edda;
  color: #155724;
}

.status-invalid {
  background: #f8d7da;
  color: #721c24;
}

.status-none {
  background: #e9ecef;
  color: #666;
}

.secret-type {
  font-weight: 500;
}

.how-to-get {
  background: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.how-to-get h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #004085;
}

.how-to-get ol {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.9rem;
}

.how-to-get li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.how-to-get a {
  color: #635bff;
}

.how-to-get code {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.code-snippet {
  display: inline-block;
  background: #1a1a2e !important;
  color: #00ff88 !important;
  padding: 0.375rem 0.625rem !important;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-top: 0.375rem;
}

.demo-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  min-height: 180px;
}

.demo-container.dark {
  background: #1a1a2e;
  color: #f8f9fa;
}

.success-content {
  text-align: center;
  padding: 1rem 0;
}

.success-icon,
.error-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
}

.success-content p {
  margin: 0.75rem 0 0 0;
  color: #666;
  line-height: 1.6;
}

.demo-container.dark .success-content p {
  color: #aaa;
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

.error-display {
  text-align: center;
  color: #dc3545;
  padding: 1.5rem;
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

.elements-status {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  text-align: left;
  font-size: 0.9rem;
}

.demo-container.dark .elements-status {
  background: rgba(255, 255, 255, 0.1);
}

.elements-status h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.elements-status ul {
  margin: 0 0 0.75rem 0;
  padding-left: 1.5rem;
}

.elements-note {
  margin: 0.75rem 0 0 0;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.elements-note.success {
  background: rgba(40, 167, 69, 0.1);
  color: #155724;
}

.elements-note.info {
  background: rgba(23, 162, 184, 0.1);
  color: #0c5460;
}

.secret-provided {
  color: #28a745;
}

.secret-not-provided {
  color: #6c757d;
}

.elements-status li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.code-inline {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  text-align: left;
  overflow-x: auto;
  margin-top: 0.75rem;
}

.demo-container.dark .code-inline {
  background: rgba(255, 255, 255, 0.1);
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
  margin-bottom: 0.75rem;
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
