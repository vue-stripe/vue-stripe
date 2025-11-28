<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Local client secret state (separate from global config)
const localClientSecret = ref('')
const clientSecret = computed(() => localClientSecret.value.trim())
const showSecretForm = computed(() => publishableKey.value && !clientSecret.value)

// Payment state
const paymentComplete = ref(false)
const paymentError = ref<string | null>(null)
const paymentStatus = ref<string>('')

// Element state
const elementReady = ref(false)
const elementLoading = ref(true)

// Event log
const eventLog = ref<Array<{ time: string; event: string; data?: string }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 15) {
    eventLog.value.pop()
  }
}

// Event handlers
const onReady = () => {
  elementReady.value = true
  elementLoading.value = false
  logEvent('ready', 'Payment Element mounted')
}

const onChange = (event: any) => {
  paymentComplete.value = event.complete
  if (event.value?.type) {
    logEvent('change', `type: ${event.value.type}, complete: ${event.complete}`)
  } else {
    logEvent('change', `complete: ${event.complete}`)
  }
}

const onFocus = () => logEvent('focus')
const onBlur = () => logEvent('blur')
const onLoaderStart = () => {
  elementLoading.value = true
  logEvent('loaderstart')
}
const onLoaderStop = () => {
  elementLoading.value = false
  logEvent('loaderstop')
}

// Appearance options
const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#635bff'
  }
}
</script>

<template>
  <div class="payment-element-view">
    <div class="demo-card">
      <h2>StripePaymentElement</h2>
      <p class="description">
        The Payment Element is Stripe's recommended all-in-one payment UI.
        It automatically handles cards, wallets, bank transfers, and more.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="warning">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <!-- Client Secret Form -->
      <div v-else-if="showSecretForm" class="secret-form">
        <h4>Enter Client Secret</h4>
        <p>The Payment Element requires a <code>clientSecret</code> from a PaymentIntent.</p>

        <div class="form-group">
          <label for="clientSecret">Client Secret</label>
          <input
            id="clientSecret"
            v-model="localClientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx"
            class="input"
            :class="{ 'input-valid': localClientSecret.includes('_secret_') }"
          />
        </div>

        <div class="instructions">
          <h5>How to get a Client Secret:</h5>
          <ol>
            <li>Go to <a href="https://dashboard.stripe.com/test/payments" target="_blank">Stripe Dashboard → Payments</a></li>
            <li>Click <strong>"+ Create"</strong> → <strong>"Create payment"</strong></li>
            <li>Enter an amount (e.g., $10.00)</li>
            <li>Copy the <code>client_secret</code> from the response</li>
          </ol>
          <p class="hint">
            The client secret looks like: <code>pi_xxx_secret_xxx</code>
          </p>
        </div>
      </div>

      <!-- Payment Element -->
      <div v-else class="payment-form">
        <!-- Show current secret and allow clearing -->
        <div class="secret-status">
          <span class="secret-label">Client Secret:</span>
          <code class="secret-value">{{ clientSecret.slice(0, 15) }}...{{ clientSecret.slice(-8) }}</code>
          <button class="btn-clear" @click="localClientSecret = ''" title="Clear and enter new secret">
            Clear
          </button>
        </div>

        <StripeProvider :publishable-key="publishableKey">
          <StripeElements
            :client-secret="clientSecret"
            :options="{ appearance }"
          >
            <StripePaymentElement
              @ready="onReady"
              @change="onChange"
              @focus="onFocus"
              @blur="onBlur"
              @loaderstart="onLoaderStart"
              @loaderstop="onLoaderStop"
            />

            <!-- Payment Form Child Component -->
            <PaymentForm
              :client-secret="clientSecret"
              :payment-complete="paymentComplete"
              @payment-success="paymentStatus = 'succeeded'"
              @payment-error="(msg) => paymentError = msg"
            />
          </StripeElements>
        </StripeProvider>

        <!-- Status display -->
        <div v-if="paymentStatus === 'succeeded'" class="success-message">
          Payment successful! Check your Stripe Dashboard.
        </div>
        <div v-if="paymentError" class="error-message">
          {{ paymentError }}
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="demo-card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="no-events">
          Interact with the Payment Element to see events...
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
      <h3>About Payment Element</h3>
      <ul>
        <li><strong>All-in-one</strong> - Cards, Apple Pay, Google Pay, bank transfers</li>
        <li><strong>Dynamic</strong> - Shows relevant payment methods based on customer</li>
        <li><strong>Localized</strong> - Automatically adapts to customer's locale</li>
        <li><strong>Optimized</strong> - Stripe handles conversion optimization</li>
      </ul>
      <h4>Test Cards:</h4>
      <ul>
        <li><code>4242 4242 4242 4242</code> - Succeeds</li>
        <li><code>4000 0000 0000 0002</code> - Declined</li>
        <li><code>4000 0025 0000 3155</code> - Requires 3D Secure</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStripe, useStripeElements, usePaymentIntent } from '@vue-stripe/vue-stripe'

// Child component for payment submission (needs to be inside StripeElements)
const PaymentForm = defineComponent({
  name: 'PaymentForm',
  props: {
    clientSecret: { type: String, required: true },
    paymentComplete: { type: Boolean, default: false }
  },
  emits: ['payment-success', 'payment-error'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const { elements } = useStripeElements()
    const { confirmPayment, loading, error } = usePaymentIntent()

    const processing = ref(false)

    const handleSubmit = async () => {
      if (!stripe.value || !elements.value) {
        emit('payment-error', 'Stripe not ready')
        return
      }

      processing.value = true

      const result = await confirmPayment({
        clientSecret: props.clientSecret,
        confirmParams: {
          return_url: window.location.href
        },
        redirect: 'if_required'
      })

      processing.value = false

      if (result.error) {
        emit('payment-error', result.error.message)
      } else if (result.paymentIntent?.status === 'succeeded') {
        emit('payment-success')
      }
    }

    return {
      handleSubmit,
      processing,
      loading,
      error
    }
  },
  template: `
    <div class="payment-actions">
      <button
        class="btn btn-primary"
        :disabled="!paymentComplete || processing"
        @click="handleSubmit"
      >
        {{ processing ? 'Processing...' : 'Pay Now' }}
      </button>
      <p class="payment-hint">
        Use test card <code>4242 4242 4242 4242</code> with any future date and CVC
      </p>
    </div>
  `
})

export default {
  components: { PaymentForm }
}
</script>

<style scoped>
.payment-element-view {
  max-width: 600px;
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
  padding: 1.25rem;
  color: #856404;
}

.secret-form {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
}

.secret-form h4 {
  margin: 0 0 0.5rem 0;
  color: #1a1a2e;
}

.secret-form > p {
  margin: 0 0 1.25rem 0;
  color: #666;
  font-size: 0.9rem;
}

.secret-form .form-group {
  margin-bottom: 1.25rem;
}

.secret-form label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.secret-form .input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
  transition: all 0.2s ease;
}

.secret-form .input:focus {
  outline: none;
  border-color: #635bff;
  box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
}

.secret-form .input-valid {
  border-color: #28a745;
}

.secret-form .instructions {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
}

.secret-form .instructions h5 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.9rem;
}

.secret-form .instructions ol {
  margin: 0 0 0.75rem 0;
  padding-left: 1.25rem;
}

.secret-form .instructions li {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.secret-form .instructions code {
  background: #e9ecef;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.secret-form .hint {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
}

.secret-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #d4edda;
  border: 1px solid #28a745;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.secret-label {
  color: #155724;
  font-weight: 500;
}

.secret-value {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  flex: 1;
}

.btn-clear {
  padding: 0.25rem 0.75rem;
  background: white;
  border: 1px solid #28a745;
  border-radius: 4px;
  color: #28a745;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: #28a745;
  color: white;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payment-actions {
  margin-top: 1.5rem;
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  width: 100%;
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

.payment-hint {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #666;
  text-align: center;
}

.payment-hint code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.success-message {
  background: #d4edda;
  border: 1px solid #28a745;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #dc3545;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
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
</style>
