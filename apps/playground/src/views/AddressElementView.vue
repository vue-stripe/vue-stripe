<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeAddressElement
} from '@vue-stripe/vue-stripe'
import type { StripeAddressElementChangeEvent } from '@stripe/stripe-js'

// Ref to the address element component
const addressElementRef = ref<InstanceType<typeof StripeAddressElement> | null>(null)

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Address mode toggle
const addressMode = ref<'shipping' | 'billing'>('shipping')

// Autocomplete toggle
const autocompleteEnabled = ref(true)

// Default values for pre-filling
const useDefaultValues = ref(false)
const defaultValues = {
  name: 'John Doe',
  address: {
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'US'
  }
}

// Collected address data
const addressData = ref<{
  complete: boolean
  isNewAddress: boolean
  value: {
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
    address: {
      line1: string
      line2: string | null
      city: string
      state: string
      postal_code: string
      country: string
    }
  } | null
}>({
  complete: false,
  isNewAddress: true,
  value: null
})

// Element key to force remount when options change
const elementKey = ref(0)

// getValue result
const getValueResult = ref<{
  complete: boolean
  isNewAddress: boolean
  value: typeof addressData.value['value']
} | null>(null)
const getValueError = ref<string | null>(null)
const isGettingValue = ref(false)

// Watch for option changes and remount
watch([addressMode, autocompleteEnabled, useDefaultValues], () => {
  elementKey.value++
  addressData.value = { complete: false, isNewAddress: true, value: null }
  getValueResult.value = null
  getValueError.value = null
})

// Computed options for the element
const elementOptions = computed(() => {
  const options: any = {
    mode: addressMode.value,
    autocomplete: autocompleteEnabled.value ? { mode: 'automatic' } : { mode: 'disabled' },
    fields: {
      phone: 'always'
    },
    validation: {
      phone: {
        required: 'never'
      }
    }
  }

  if (useDefaultValues.value) {
    options.defaultValues = defaultValues
  }

  return options
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
  logEvent('ready', 'Address Element mounted')
}

const onChange = (event: StripeAddressElementChangeEvent) => {
  addressData.value = {
    complete: event.complete,
    isNewAddress: event.isNewAddress,
    value: event.value
  }

  if (event.complete) {
    logEvent('change', `complete: true, country: ${event.value.address.country}`)
  } else {
    logEvent('change', `complete: false`)
  }
}

const onFocus = () => logEvent('focus')
const onBlur = () => logEvent('blur')
const onEscape = () => logEvent('escape')
const onLoadError = (event: { elementType: 'address'; error: string }) => {
  logEvent('loaderror', event.error)
}

// Call getValue on the address element
const handleGetValue = async () => {
  if (!addressElementRef.value) {
    getValueError.value = 'Address element ref not available'
    logEvent('getValue error', 'ref not available')
    return
  }

  isGettingValue.value = true
  getValueError.value = null

  try {
    const result = await addressElementRef.value.getValue()
    getValueResult.value = result
    logEvent('getValue', `complete: ${result.complete}, isNewAddress: ${result.isNewAddress}`)
  } catch (err) {
    getValueError.value = err instanceof Error ? err.message : 'Unknown error'
    logEvent('getValue error', getValueError.value)
  } finally {
    isGettingValue.value = false
  }
}

// Call focus on the address element
const handleFocus = () => {
  addressElementRef.value?.focus()
  logEvent('focus() called')
}

// Call clear on the address element
const handleClear = () => {
  addressElementRef.value?.clear()
  getValueResult.value = null
  logEvent('clear() called')
}
</script>

<template>
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">StripeAddressElement</h2>
      <p class="text-secondary">
        Stripe's Address Element collects shipping or billing addresses with built-in
        autocomplete powered by Google Maps. Works without a clientSecret.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <!-- Configuration Controls -->
      <div v-else class="config-section mt-4">
        <h4>Configuration</h4>

        <div class="control-grid">
          <div class="control-group">
            <label>Mode</label>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn btn-secondary', { active: addressMode === 'shipping' }]"
                @click="addressMode = 'shipping'"
              >
                Shipping
              </button>
              <button
                :class="['btn btn-secondary', { active: addressMode === 'billing' }]"
                @click="addressMode = 'billing'"
              >
                Billing
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>Autocomplete</label>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn btn-secondary', { active: autocompleteEnabled }]"
                @click="autocompleteEnabled = true"
              >
                Enabled
              </button>
              <button
                :class="['btn btn-secondary', { active: !autocompleteEnabled }]"
                @click="autocompleteEnabled = false"
              >
                Disabled
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>Pre-fill</label>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn btn-secondary', { active: !useDefaultValues }]"
                @click="useDefaultValues = false"
              >
                Empty
              </button>
              <button
                :class="['btn btn-secondary', { active: useDefaultValues }]"
                @click="useDefaultValues = true"
              >
                With Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Demo -->
    <div v-if="publishableKey" class="card">
      <h3>Live Demo</h3>
      <p class="text-secondary text-sm mb-4">
        Try the address autocomplete. Start typing an address to see suggestions.
      </p>

      <div class="demo-container">
        <StripeProvider :publishable-key="publishableKey">
          <StripeElements>
            <div class="address-wrapper">
              <StripeAddressElement
                ref="addressElementRef"
                :key="elementKey"
                :options="elementOptions"
                @ready="onReady"
                @change="onChange"
                @focus="onFocus"
                @blur="onBlur"
                @escape="onEscape"
                @load-error="onLoadError"
              />
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons mt-4">
              <button
                class="btn btn-primary"
                :disabled="isGettingValue"
                @click="handleGetValue"
              >
                {{ isGettingValue ? 'Getting...' : 'Get Value' }}
              </button>
              <button
                class="btn btn-secondary"
                @click="handleFocus"
              >
                Focus
              </button>
              <button
                class="btn btn-secondary"
                @click="handleClear"
              >
                Clear
              </button>
            </div>
          </StripeElements>
        </StripeProvider>
      </div>

      <!-- Collected Data Display -->
      <div class="collected-data mt-4">
        <h4>Collected Address Data</h4>
        <div class="data-status">
          <span :class="['status-badge', addressData.complete ? 'complete' : 'incomplete']">
            {{ addressData.complete ? '✅ Complete' : '⏳ Incomplete' }}
          </span>
          <span v-if="addressData.isNewAddress" class="status-badge new">
            New Address
          </span>
        </div>

        <div v-if="addressData.value" class="address-preview">
          <div class="preview-row" v-if="addressData.value.name">
            <span class="preview-label">Name:</span>
            <span class="preview-value">{{ addressData.value.name }}</span>
          </div>
          <div class="preview-row" v-if="addressData.value.phone">
            <span class="preview-label">Phone:</span>
            <span class="preview-value">{{ addressData.value.phone }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Address:</span>
            <span class="preview-value">
              {{ addressData.value.address.line1 }}
              <span v-if="addressData.value.address.line2">, {{ addressData.value.address.line2 }}</span>
            </span>
          </div>
          <div class="preview-row">
            <span class="preview-label">City/State:</span>
            <span class="preview-value">
              {{ addressData.value.address.city }}, {{ addressData.value.address.state }} {{ addressData.value.address.postal_code }}
            </span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Country:</span>
            <span class="preview-value">{{ addressData.value.address.country }}</span>
          </div>
        </div>

        <div v-else class="no-data">
          Fill in the address form to see collected data here.
        </div>
      </div>

      <!-- getValue() Result -->
      <div class="getvalue-section mt-4">
        <h4>getValue() Result</h4>
        <p class="text-secondary text-sm mb-3">
          Click "Get Value" above to programmatically retrieve the current address data.
          This is useful for validation before form submission.
        </p>

        <div v-if="getValueError" class="alert alert-error">
          {{ getValueError }}
        </div>

        <div v-else-if="getValueResult" class="getvalue-result">
          <div class="data-status">
            <span :class="['status-badge', getValueResult.complete ? 'complete' : 'incomplete']">
              {{ getValueResult.complete ? '✅ Valid' : '❌ Incomplete' }}
            </span>
            <span v-if="getValueResult.isNewAddress" class="status-badge new">
              New Address
            </span>
          </div>

          <div class="result-json">
            <pre>{{ JSON.stringify(getValueResult, null, 2) }}</pre>
          </div>
        </div>

        <div v-else class="no-data">
          Click "Get Value" to retrieve the current address data.
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
          Interact with the Address Element to see events...
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
            <td>StripeAddressElementOptions</td>
            <td>Configuration for the address element</td>
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
            <td>-</td>
            <td>Fired when the element is mounted</td>
          </tr>
          <tr>
            <td><code>@change</code></td>
            <td>StripeAddressElementChangeEvent</td>
            <td>Fired when address data changes (includes complete, value)</td>
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
          <tr>
            <td><code>@load-error</code></td>
            <td>{ elementType, error }</td>
            <td>Fired if the element fails to load</td>
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
            <td><code>getValue()</code></td>
            <td>Promise&lt;{ complete, isNewAddress, value }&gt;</td>
            <td>Get current address data programmatically</td>
          </tr>
          <tr>
            <td><code>focus()</code></td>
            <td>void</td>
            <td>Focus the first input in the address form</td>
          </tr>
          <tr>
            <td><code>clear()</code></td>
            <td>void</td>
            <td>Clear all address form fields</td>
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
            <td><code>mode</code></td>
            <td>'shipping' | 'billing'</td>
            <td>Address collection mode (affects labels)</td>
          </tr>
          <tr>
            <td><code>autocomplete</code></td>
            <td>{ mode: 'automatic' | 'disabled' }</td>
            <td>Enable/disable Google Maps autocomplete</td>
          </tr>
          <tr>
            <td><code>defaultValues</code></td>
            <td>{ name, address, phone }</td>
            <td>Pre-fill values for the form</td>
          </tr>
          <tr>
            <td><code>fields</code></td>
            <td>{ phone: 'always' | 'never' | 'auto' }</td>
            <td>Control which fields are shown</td>
          </tr>
          <tr>
            <td><code>validation</code></td>
            <td>{ phone: { required: 'always' | 'never' } }</td>
            <td>Field validation requirements</td>
          </tr>
          <tr>
            <td><code>allowedCountries</code></td>
            <td>string[]</td>
            <td>Limit country selection (e.g., ['US', 'CA'])</td>
          </tr>
          <tr>
            <td><code>blockPoBox</code></td>
            <td>boolean</td>
            <td>Prevent P.O. Box addresses</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Card -->
    <div class="card card-info">
      <h3>About Address Element</h3>

      <h4>Key Features</h4>
      <ul>
        <li><strong>Google Maps Autocomplete</strong> - Built-in address suggestions</li>
        <li><strong>No clientSecret Required</strong> - Works with just StripeElements</li>
        <li><strong>Phone Number Support</strong> - Optional phone field with country-aware formatting</li>
        <li><strong>International</strong> - Supports addresses from all countries</li>
        <li><strong>Validation</strong> - Built-in address validation</li>
      </ul>

      <h4>Use Cases</h4>
      <ul>
        <li>Collecting shipping addresses for orders</li>
        <li>Collecting billing addresses for payments</li>
        <li>Pre-filling address from customer profiles</li>
        <li>Address verification before checkout</li>
      </ul>

      <h4>Integration with Payment</h4>
      <div class="alert alert-info mt-3">
        <strong>Tip:</strong> The collected address can be passed to <code>confirmPayment()</code>
        via <code>confirmParams.shipping</code> or used with <code>StripePaymentElement</code>'s
        <code>defaultValues.billingDetails</code> option.
      </div>
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

.demo-container {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.address-wrapper {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
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

.status-badge.new {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}

.address-preview {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
}

.preview-row {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--text-sm);
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-label {
  color: var(--color-text-muted);
  min-width: 80px;
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

.getvalue-section {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.getvalue-section h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.getvalue-result {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
}

.result-json {
  margin-top: var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  overflow-x: auto;
}

.result-json pre {
  margin: 0;
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
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

@media (max-width: 768px) {
  .control-grid {
    grid-template-columns: 1fr;
  }
}
</style>
