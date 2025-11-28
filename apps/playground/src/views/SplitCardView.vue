<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement
} from '@vue-stripe/vue-stripe'

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Track element states
const cardNumberComplete = ref(false)
const cardExpiryComplete = ref(false)
const cardCvcComplete = ref(false)
const cardNumberError = ref<string | null>(null)
const cardExpiryError = ref<string | null>(null)
const cardCvcError = ref<string | null>(null)
const cardBrand = ref<string>('unknown')

// Refs for element components
const cardNumberRef = ref<InstanceType<typeof StripeCardNumberElement> | null>(null)
const cardExpiryRef = ref<InstanceType<typeof StripeCardExpiryElement> | null>(null)
const cardCvcRef = ref<InstanceType<typeof StripeCardCvcElement> | null>(null)

// All fields complete?
const allComplete = computed(() =>
  cardNumberComplete.value && cardExpiryComplete.value && cardCvcComplete.value
)

// Event log for demonstration
const eventLog = ref<Array<{ time: string; event: string; data?: string }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 10) {
    eventLog.value.pop()
  }
}

// Event handlers
const onCardNumberChange = (event: any) => {
  cardNumberComplete.value = event.complete
  cardNumberError.value = event.error?.message || null
  if (event.brand) {
    cardBrand.value = event.brand
  }
  logEvent('cardNumber:change', `complete: ${event.complete}, brand: ${event.brand}`)
}

const onCardExpiryChange = (event: any) => {
  cardExpiryComplete.value = event.complete
  cardExpiryError.value = event.error?.message || null
  logEvent('cardExpiry:change', `complete: ${event.complete}`)
}

const onCardCvcChange = (event: any) => {
  cardCvcComplete.value = event.complete
  cardCvcError.value = event.error?.message || null
  logEvent('cardCvc:change', `complete: ${event.complete}`)
}

const onCardNumberReady = () => {
  logEvent('cardNumber:ready')
}

const onCardExpiryReady = () => {
  logEvent('cardExpiry:ready')
}

const onCardCvcReady = () => {
  logEvent('cardCvc:ready')
}

// Focus handlers for sequential navigation
const onCardNumberFocus = () => logEvent('cardNumber:focus')
const onCardExpiryFocus = () => logEvent('cardExpiry:focus')
const onCardCvcFocus = () => logEvent('cardCvc:focus')

// Exposed methods demo
const focusCardNumber = () => cardNumberRef.value?.focus()
const clearAll = () => {
  cardNumberRef.value?.clear()
  cardExpiryRef.value?.clear()
  cardCvcRef.value?.clear()
  cardNumberComplete.value = false
  cardExpiryComplete.value = false
  cardCvcComplete.value = false
  cardBrand.value = 'unknown'
  logEvent('all:clear')
}

// Style options for elements
const elementStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
}

// Brand icons mapping
const brandIcon = computed(() => {
  const icons: Record<string, string> = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 Amex',
    discover: '💳 Discover',
    diners: '💳 Diners',
    jcb: '💳 JCB',
    unionpay: '💳 UnionPay',
    unknown: '💳'
  }
  return icons[cardBrand.value] || '💳'
})
</script>

<template>
  <div class="split-card-view">
    <div class="demo-card">
      <h2>Split Card Elements</h2>
      <p class="description">
        Three separate inputs for card number, expiry, and CVC.
        Provides more control over layout and styling than the unified CardElement.
      </p>

      <div v-if="!publishableKey" class="warning">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <StripeProvider v-else :publishable-key="publishableKey">
        <StripeElements>
          <div class="split-card-form">
            <!-- Card Number -->
            <div class="form-group">
              <label class="form-label">
                Card Number
                <span class="brand-indicator">{{ brandIcon }}</span>
              </label>
              <StripeCardNumberElement
                ref="cardNumberRef"
                :options="elementStyle"
                @ready="onCardNumberReady"
                @change="onCardNumberChange"
                @focus="onCardNumberFocus"
              />
              <div v-if="cardNumberError" class="field-error">{{ cardNumberError }}</div>
              <div v-else-if="cardNumberComplete" class="field-success">Valid card number</div>
            </div>

            <!-- Expiry and CVC Row -->
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">Expiration</label>
                <StripeCardExpiryElement
                  ref="cardExpiryRef"
                  :options="elementStyle"
                  @ready="onCardExpiryReady"
                  @change="onCardExpiryChange"
                  @focus="onCardExpiryFocus"
                />
                <div v-if="cardExpiryError" class="field-error">{{ cardExpiryError }}</div>
                <div v-else-if="cardExpiryComplete" class="field-success">Valid</div>
              </div>

              <div class="form-group half">
                <label class="form-label">CVC</label>
                <StripeCardCvcElement
                  ref="cardCvcRef"
                  :options="elementStyle"
                  @ready="onCardCvcReady"
                  @change="onCardCvcChange"
                  @focus="onCardCvcFocus"
                />
                <div v-if="cardCvcError" class="field-error">{{ cardCvcError }}</div>
                <div v-else-if="cardCvcComplete" class="field-success">Valid</div>
              </div>
            </div>

            <!-- Status -->
            <div class="status-bar">
              <span :class="['status-item', { complete: cardNumberComplete }]">
                Number {{ cardNumberComplete ? '✓' : '○' }}
              </span>
              <span :class="['status-item', { complete: cardExpiryComplete }]">
                Expiry {{ cardExpiryComplete ? '✓' : '○' }}
              </span>
              <span :class="['status-item', { complete: cardCvcComplete }]">
                CVC {{ cardCvcComplete ? '✓' : '○' }}
              </span>
            </div>

            <!-- Actions -->
            <div class="actions">
              <button
                class="btn btn-primary"
                :disabled="!allComplete"
              >
                {{ allComplete ? 'Ready to Pay' : 'Complete all fields' }}
              </button>
              <button class="btn btn-secondary" @click="focusCardNumber">
                Focus Number
              </button>
              <button class="btn btn-secondary" @click="clearAll">
                Clear All
              </button>
            </div>
          </div>
        </StripeElements>
      </StripeProvider>
    </div>

    <!-- Event Log -->
    <div class="demo-card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="no-events">
          Interact with the card fields to see events...
        </div>
        <div v-for="(entry, index) in eventLog" :key="index" class="event-entry">
          <span class="event-time">{{ entry.time }}</span>
          <span class="event-name">{{ entry.event }}</span>
          <span v-if="entry.data" class="event-data">{{ entry.data }}</span>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="demo-card info">
      <h3>About Split Card Elements</h3>
      <ul>
        <li><strong>StripeCardNumberElement</strong> - Card number with brand detection</li>
        <li><strong>StripeCardExpiryElement</strong> - MM/YY expiration date</li>
        <li><strong>StripeCardCvcElement</strong> - 3 or 4 digit security code</li>
      </ul>
      <h4>When to use Split Elements:</h4>
      <ul>
        <li>Custom form layouts (horizontal, multi-column)</li>
        <li>Different styling per field</li>
        <li>Custom validation UI per field</li>
        <li>Accessibility requirements with separate labels</li>
      </ul>
      <h4>Test Cards:</h4>
      <ul>
        <li><code>4242 4242 4242 4242</code> - Visa</li>
        <li><code>5555 5555 5555 4444</code> - Mastercard</li>
        <li><code>3782 822463 10005</code> - American Express</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.split-card-view {
  max-width: 900px;
  margin: 0 auto;
}

.demo-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.demo-card h2 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.demo-card h3 {
  margin: 0 0 1rem 0;
  color: #1a1a2e;
  font-size: 1.1rem;
}

.demo-card h4 {
  margin: 1.5rem 0 0.5rem 0;
  color: #1a1a2e;
  font-size: 1rem;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  color: #856404;
}

.split-card-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.brand-indicator {
  font-size: 0.8rem;
  color: #6b7280;
}

.field-error {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.375rem;
}

.field-success {
  color: #28a745;
  font-size: 0.8rem;
  margin-top: 0.375rem;
}

.status-bar {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  justify-content: center;
}

.status-item {
  font-size: 0.875rem;
  color: #6b7280;
  transition: color 0.2s ease;
}

.status-item.complete {
  color: #28a745;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #635bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a52e8;
}

.btn-primary:disabled {
  background: #c4c1ff;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.event-log {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.no-events {
  color: #9ca3af;
  font-style: italic;
}

.event-entry {
  display: flex;
  gap: 0.75rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.event-entry:last-child {
  border-bottom: none;
}

.event-time {
  color: #9ca3af;
  min-width: 80px;
}

.event-name {
  color: #635bff;
  font-weight: 500;
}

.event-data {
  color: #6b7280;
}

.info ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #666;
}

.info li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.info code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Override default element styles */
:deep(.vue-stripe-cardNumber-element-mount),
:deep(.vue-stripe-cardExpiry-element-mount),
:deep(.vue-stripe-cardCvc-element-mount) {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
}

:deep(.vue-stripe-cardNumber-element-mount:focus-within),
:deep(.vue-stripe-cardExpiry-element-mount:focus-within),
:deep(.vue-stripe-cardCvc-element-mount:focus-within) {
  border-color: #635bff;
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
}

:deep(.vue-stripe-cardNumber-element-error),
:deep(.vue-stripe-cardExpiry-element-error),
:deep(.vue-stripe-cardCvc-element-error) {
  display: none; /* We handle errors ourselves */
}

:deep(.vue-stripe-cardNumber-element-loader),
:deep(.vue-stripe-cardExpiry-element-loader),
:deep(.vue-stripe-cardCvc-element-loader) {
  display: none;
}
</style>
