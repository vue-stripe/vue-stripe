<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement
} from '@vue-stripe/vue-stripe'
import type { StripeLinkAuthenticationElementChangeEvent } from '@stripe/stripe-js'

// Ref to the link auth element component
const linkAuthRef = ref<InstanceType<typeof StripeLinkAuthenticationElement> | null>(null)

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Local client secret state (separate from global config)
const localClientSecret = ref('')
const clientSecret = computed(() => localClientSecret.value.trim())
const showSecretForm = computed(() => publishableKey.value && !clientSecret.value)

// Default email for pre-filling
const useDefaultEmail = ref(false)
const defaultEmail = 'test@example.com'

// Element key to force remount when options change
const elementKey = ref(0)

// Collected link auth data
const authData = ref<{
  complete: boolean
  value: { email: string } | null
}>({
  complete: false,
  value: null
})

// Watch for option changes and remount
watch([useDefaultEmail], () => {
  elementKey.value++
  authData.value = { complete: false, value: null }
})

// Computed options for the element
const elementOptions = computed(() => {
  if (useDefaultEmail.value) {
    return {
      defaultValues: {
        email: defaultEmail
      }
    }
  }

  return {}
})

// Event log
const eventLog = ref<Array<{ time: string; event: string; data: string | undefined }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 15) {
    eventLog.value.pop()
  }
}

// Event handlers
const onReady = () => {
  logEvent('ready', 'Link Authentication Element mounted')
}

const onChange = (event: StripeLinkAuthenticationElementChangeEvent) => {
  authData.value = {
    complete: event.complete,
    value: event.value
  }

  if (event.complete) {
    logEvent('change', `complete: true, email: ${event.value.email}`)
  } else {
    logEvent('change', `complete: false`)
  }
}

// Call focus on the element
const handleFocus = () => {
  linkAuthRef.value?.focus()
  logEvent('focus() called')
}

// Call blur on the element
const handleBlur = () => {
  linkAuthRef.value?.blur()
  logEvent('blur() called')
}

// Call clear on the element
const handleClear = () => {
  linkAuthRef.value?.clear()
  authData.value = { complete: false, value: null }
  logEvent('clear() called')
}
</script>

<template>
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">StripeLinkAuthenticationElement</h2>
      <p class="text-secondary">
        Stripe's Link Authentication Element collects the customer's email address and
        authenticates them for Stripe Link, enabling a faster checkout experience.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <!-- Client Secret Form -->
      <div v-else-if="showSecretForm" class="secret-form mt-4">
        <h4>Enter Client Secret</h4>
        <p class="text-secondary text-sm">The Link Authentication Element requires a <code>clientSecret</code> from a PaymentIntent.</p>

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

      <!-- Configuration Controls -->
      <div v-if="publishableKey && clientSecret" class="config-section mt-4">
        <h4>Configuration</h4>

        <div class="control-grid">
          <div class="control-group">
            <label>Pre-fill Email</label>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn btn-secondary', { active: !useDefaultEmail }]"
                @click="useDefaultEmail = false"
              >
                Empty
              </button>
              <button
                :class="['btn btn-secondary', { active: useDefaultEmail }]"
                @click="useDefaultEmail = true"
              >
                test@example.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Demo -->
    <div v-if="publishableKey && clientSecret" class="card">
      <h3>Live Demo</h3>
      <p class="text-secondary text-sm mb-4">
        Enter an email address. If the email is associated with a Stripe Link account,
        the user can authenticate for faster checkout.
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
            <!-- Email / Link Authentication -->
            <div class="link-auth-wrapper">
              <label class="field-label">Email</label>
              <StripeLinkAuthenticationElement
                ref="linkAuthRef"
                :key="elementKey"
                :options="elementOptions"
                @ready="onReady"
                @change="onChange"
              />
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons mt-4">
              <button class="btn btn-secondary" @click="handleFocus">Focus</button>
              <button class="btn btn-secondary" @click="handleBlur">Blur</button>
              <button class="btn btn-secondary" @click="handleClear">Clear</button>
            </div>
          </StripeElements>
        </StripeProvider>
      </div>

      <!-- Collected Data Display -->
      <div class="collected-data mt-4">
        <h4>Collected Data</h4>
        <div class="data-status">
          <span :class="['status-badge', authData.complete ? 'complete' : 'incomplete']">
            {{ authData.complete ? '✅ Complete' : '⏳ Incomplete' }}
          </span>
        </div>

        <div v-if="authData.value" class="data-preview">
          <div class="preview-row">
            <span class="preview-label">Email:</span>
            <span class="preview-value">{{ authData.value.email }}</span>
          </div>
        </div>

        <div v-else class="no-data">
          Enter an email address to see collected data here.
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
          Interact with the Link Authentication Element to see events...
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
            <td>StripeLinkAuthenticationElementOptions</td>
            <td>Configuration for the link authentication element</td>
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
            <td>StripeLinkAuthenticationElement</td>
            <td>Fired when the element is mounted and ready</td>
          </tr>
          <tr>
            <td><code>@change</code></td>
            <td>StripeLinkAuthenticationElementChangeEvent</td>
            <td>Fired when the email value changes</td>
          </tr>
        </tbody>
      </table>

      <h4>Exposed Methods (via ref)</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Returns</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>focus()</code></td>
            <td>void</td>
            <td>Focus the email input</td>
          </tr>
          <tr>
            <td><code>blur()</code></td>
            <td>void</td>
            <td>Remove focus from the email input</td>
          </tr>
          <tr>
            <td><code>clear()</code></td>
            <td>void</td>
            <td>Clear the email input</td>
          </tr>
          <tr>
            <td><code>element</code></td>
            <td>StripeLinkAuthenticationElement | null</td>
            <td>Direct access to the underlying Stripe element</td>
          </tr>
        </tbody>
      </table>

      <h4>Key Options</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>defaultValues.email</code></td>
            <td>string</td>
            <td>Pre-fill the email field with a default value</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Card -->
    <div class="card card-info">
      <h3>About Link Authentication Element</h3>

      <h4>What is Stripe Link?</h4>
      <p>
        Stripe Link is a one-click checkout solution that remembers customer payment details
        across Stripe merchants. When a customer enters an email associated with a Link account,
        they can authenticate and autofill their saved information.
      </p>

      <h4>Key Features</h4>
      <ul>
        <li><strong>Email Collection</strong> - Validates and collects customer email</li>
        <li><strong>Link Detection</strong> - Automatically detects Link accounts</li>
        <li><strong>OTP Authentication</strong> - Secure one-time password verification</li>
        <li><strong>Pre-fill Support</strong> - Set default email for logged-in users</li>
      </ul>

      <h4>Integration Pattern</h4>
      <div class="alert alert-info mt-3">
        <strong>Tip:</strong> Use StripeLinkAuthenticationElement alongside StripePaymentElement
        for a complete checkout experience. Place it above the PaymentElement so customers
        can authenticate before entering payment details.
      </div>

      <h4>Requirements</h4>
      <ul>
        <li>Requires a <code>clientSecret</code> from a PaymentIntent or SetupIntent</li>
        <li>Must be placed within <code>StripeElements</code></li>
        <li>Link must be enabled in your Stripe Dashboard</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* View uses .test-page from design-system.css for consistent 900px width */

.card-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
}

.config-section h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
  color: var(--color-text);
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.control-group label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-group-sm .btn {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
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

.link-auth-wrapper {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
}

.field-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.collected-data {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.collected-data h4 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.data-status {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.status-badge.complete {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.status-badge.incomplete {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.data-preview {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
}

.preview-row {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
}

.preview-label {
  color: var(--color-text-muted);
  min-width: 60px;
  flex-shrink: 0;
}

.preview-value {
  color: var(--color-text);
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  padding: var(--space-4);
}

.action-buttons {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
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

.card-info .alert {
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .control-grid {
    grid-template-columns: 1fr;
  }
}
</style>
