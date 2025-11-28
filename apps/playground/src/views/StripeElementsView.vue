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
/* View-specific styles - most styles are now in design-system.css */

.input-group {
  display: flex;
  gap: var(--space-3);
}

.input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: border-color var(--transition-base);
}

.input-valid {
  border-color: var(--color-success);
  background-color: #f8fff9;
}

.input-invalid {
  border-color: var(--color-danger);
  background-color: #fff8f8;
}

.secret-status {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.status-valid {
  background: var(--color-success-light);
  color: #155724;
}

.status-invalid {
  background: var(--color-danger-light);
  color: #721c24;
}

.status-none {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.secret-type {
  font-weight: 500;
}

.how-to-get {
  background: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}

.how-to-get h4 {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-base);
  color: #004085;
}

.how-to-get ol {
  margin: 0;
  padding-left: var(--space-5);
  font-size: var(--text-sm);
}

.how-to-get li {
  margin-bottom: var(--space-3);
  line-height: 1.6;
}

.how-to-get a {
  color: var(--color-primary);
}

.code-snippet {
  display: inline-block;
  background: var(--color-bg-dark) !important;
  color: #00ff88 !important;
  padding: var(--space-1) var(--space-2) !important;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  margin-top: var(--space-1);
}

.error-display {
  text-align: center;
  color: var(--color-danger);
  padding: var(--space-5);
}

.elements-status {
  margin-top: var(--space-5);
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-lg);
  text-align: left;
  font-size: var(--text-sm);
}

.demo-container.dark .elements-status {
  background: rgba(255, 255, 255, 0.1);
}

.elements-status h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
}

.elements-status ul {
  margin: 0 0 var(--space-3) 0;
  padding-left: var(--space-5);
}

.elements-note {
  margin: var(--space-3) 0 0 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
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
  color: var(--color-success);
}

.secret-not-provided {
  color: var(--color-text-secondary);
}

.elements-status li {
  margin-bottom: var(--space-2);
  line-height: 1.5;
}

.code-inline {
  background: rgba(0, 0, 0, 0.05);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  text-align: left;
  overflow-x: auto;
  margin-top: var(--space-3);
}

.demo-container.dark .code-inline {
  background: rgba(255, 255, 255, 0.1);
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
</style>
