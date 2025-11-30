<script setup lang="ts">
import { ref, inject, computed, defineComponent, h } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeCardNumberElement,
  VueStripeCardExpiryElement,
  VueStripeCardCvcElement,
  useStripe
} from '@vue-stripe/vue-stripe'
import type { StripeCardNumberElement as StripeCardNumberElementType } from '@stripe/stripe-js'

// Mark VueStripeElements as used (it's used in template)
void VueStripeElements

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

// Payment confirmation state
const localClientSecret = ref('')
const paymentStatus = ref<'idle' | 'processing' | 'succeeded' | 'error'>('idle')
const paymentMessage = ref('')
const showPaymentSection = ref(false)

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
const cardNumberRef = ref<InstanceType<typeof VueStripeCardNumberElement> | null>(null)
const cardExpiryRef = ref<InstanceType<typeof VueStripeCardExpiryElement> | null>(null)
const cardCvcRef = ref<InstanceType<typeof VueStripeCardCvcElement> | null>(null)

// All fields complete?
const allComplete = computed(() =>
  cardNumberComplete.value && cardExpiryComplete.value && cardCvcComplete.value
)

// Event log for demonstration
const eventLog = ref<Array<{ time: string; event: string; data?: string }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  const entry: { time: string; event: string; data?: string } = { time, event }
  if (data !== undefined) entry.data = data
  eventLog.value.unshift(entry)
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

// Get active client secret (from header config or local input)
const activeClientSecret = computed(() => {
  return localClientSecret.value.trim() || stripeConfig?.clientSecret || ''
})

// Show secret form if no client secret is provided (when in payment mode)
const showSecretForm = computed(() => {
  return showPaymentSection.value && !activeClientSecret.value
})

// PaymentButton component to use inside VueStripeElements
// For split elements, we use the cardNumber element for confirmCardPayment
const PaymentButton = defineComponent({
  name: 'PaymentButton',
  props: {
    clientSecret: { type: String, required: true },
    cardComplete: { type: Boolean, default: false },
    cardNumberElement: { type: Object as () => StripeCardNumberElementType | null, default: null }
  },
  emits: ['payment-success', 'payment-error', 'payment-processing'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const processing = ref(false)

    const handlePayment = async () => {
      if (!stripe.value || !props.cardNumberElement) {
        emit('payment-error', 'Stripe not initialized')
        return
      }

      processing.value = true
      emit('payment-processing')

      try {
        // For split elements, use the cardNumber element
        const { error, paymentIntent } = await stripe.value.confirmCardPayment(
          props.clientSecret,
          {
            payment_method: {
              card: props.cardNumberElement
            }
          }
        )

        if (error) {
          emit('payment-error', error.message || 'Payment failed')
        } else if (paymentIntent?.status === 'succeeded') {
          emit('payment-success', paymentIntent)
        } else {
          emit('payment-error', `Payment status: ${paymentIntent?.status}`)
        }
      } catch (err: any) {
        emit('payment-error', err.message || 'Payment failed')
      } finally {
        processing.value = false
      }
    }

    return () => h('button', {
      class: 'btn btn-success',
      disabled: !props.cardComplete || processing.value || !props.clientSecret,
      onClick: handlePayment
    }, processing.value ? 'Processing...' : 'Confirm Payment')
  }
})

// Payment event handlers
const handlePaymentSuccess = (paymentIntent: any) => {
  paymentStatus.value = 'succeeded'
  paymentMessage.value = `Payment succeeded! ID: ${paymentIntent.id}`
  logEvent('payment:success', `PaymentIntent: ${paymentIntent.id}`)
}

const handlePaymentError = (message: string) => {
  paymentStatus.value = 'error'
  paymentMessage.value = message
  logEvent('payment:error', message)
}

const handlePaymentProcessing = () => {
  paymentStatus.value = 'processing'
  paymentMessage.value = 'Processing payment...'
  logEvent('payment:processing')
}

const resetPaymentState = () => {
  paymentStatus.value = 'idle'
  paymentMessage.value = ''
  localClientSecret.value = ''
}
</script>

<template>
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">Split Card Elements</h2>
      <p class="text-secondary">
        Three separate inputs for card number, expiry, and CVC.
        Provides more control over layout and styling than the unified CardElement.
      </p>

      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <VueStripeProvider v-else :publishable-key="publishableKey">
        <VueStripeElements>
          <div class="split-card-form mt-4">
            <!-- Card Number -->
            <div class="form-group">
              <label class="form-label">
                Card Number
                <span class="brand-indicator">{{ brandIcon }}</span>
              </label>
              <VueStripeCardNumberElement
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
                <VueStripeCardExpiryElement
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
                <VueStripeCardCvcElement
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
            <div class="btn-group mt-4">
              <button class="btn btn-sm btn-secondary" @click="focusCardNumber">
                Focus Number
              </button>
              <button class="btn btn-sm btn-secondary" @click="clearAll">
                Clear All
              </button>
              <button
                :class="['btn btn-sm', showPaymentSection ? 'btn-primary active' : 'btn-secondary']"
                @click="showPaymentSection = !showPaymentSection"
              >
                {{ showPaymentSection ? 'Hide Payment' : 'Test Payment' }}
              </button>
            </div>

            <!-- Payment Mode: Client Secret Form -->
            <div v-if="showSecretForm" class="secret-form mt-4">
              <h4>Enter Client Secret</h4>
              <p class="text-secondary text-sm">
                To test payment confirmation, you need a <code>client_secret</code> from a PaymentIntent.
              </p>

              <div class="form-group">
                <label class="form-label">Client Secret</label>
                <input
                  v-model="localClientSecret"
                  type="text"
                  placeholder="pi_xxx_secret_xxx"
                  class="form-input form-input-mono"
                  :class="{ 'is-valid': localClientSecret.includes('_secret_') }"
                />
              </div>

              <div class="instructions">
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

            <!-- Payment Mode: Ready to Pay -->
            <div v-else-if="showPaymentSection && activeClientSecret" class="payment-ready mt-4">
              <div class="secret-status">
                <span class="secret-label">Client Secret:</span>
                <code class="secret-value">{{ activeClientSecret.slice(0, 15) }}...{{ activeClientSecret.slice(-8) }}</code>
                <button class="btn btn-sm btn-ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
                  Clear
                </button>
              </div>

              <div class="btn-group mt-3">
                <PaymentButton
                  v-if="cardNumberRef?.element"
                  :client-secret="activeClientSecret"
                  :card-complete="allComplete"
                  :card-number-element="cardNumberRef.element"
                  @payment-success="handlePaymentSuccess"
                  @payment-error="handlePaymentError"
                  @payment-processing="handlePaymentProcessing"
                />
                <button
                  v-if="paymentStatus !== 'idle'"
                  class="btn btn-sm btn-secondary"
                  @click="resetPaymentState"
                >
                  Reset
                </button>
              </div>

              <!-- Payment Status -->
              <div
                v-if="paymentMessage"
                :class="['alert mt-3', {
                  'alert-warning': paymentStatus === 'processing',
                  'alert-success': paymentStatus === 'succeeded',
                  'alert-danger': paymentStatus === 'error'
                }]"
              >
                {{ paymentMessage }}
              </div>

              <p class="text-muted text-sm mt-3">
                Use test card <code>4242 4242 4242 4242</code> with any future date and CVC.
                <br><small>For split elements, Stripe collects data from all three fields when you pass the cardNumber element.</small>
              </p>
            </div>
          </div>
        </VueStripeElements>
      </VueStripeProvider>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
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
    <div class="card card-info">
      <h3>About Split Card Elements</h3>
      <ul>
        <li><strong>VueStripeCardNumberElement</strong> - Card number with brand detection</li>
        <li><strong>VueStripeCardExpiryElement</strong> - MM/YY expiration date</li>
        <li><strong>VueStripeCardCvcElement</strong> - 3 or 4 digit security code</li>
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
/* View uses .test-page from design-system.css for consistent width */

.card-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
}

.split-card-form {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.form-row {
  display: flex;
  gap: var(--space-4);
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.brand-indicator {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.field-error {
  color: var(--color-danger);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}

.field-success {
  color: var(--color-success);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}

.status-bar {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  justify-content: center;
  margin-top: var(--space-4);
}

.status-item {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.status-item.complete {
  color: var(--color-success);
  font-weight: 500;
}

.secret-form {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.secret-form h4 {
  margin: 0 0 var(--space-3) 0;
  color: var(--color-text);
}

.instructions {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.instructions h5 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text);
  font-size: var(--text-sm);
}

.instructions ol {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-muted);
}

.instructions li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

.secret-status {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-info-light);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
}

.secret-status .secret-label {
  font-size: var(--text-sm);
  color: var(--color-info-dark);
  font-weight: 500;
}

.secret-status .secret-value {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background: white;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-info-dark);
}

.secret-status .btn-ghost {
  margin-left: auto;
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
  margin: var(--space-4) 0 var(--space-2) 0;
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

/* Override default element styles */
:deep(.vue-stripe-cardNumber-element-mount),
:deep(.vue-stripe-cardExpiry-element-mount),
:deep(.vue-stripe-cardCvc-element-mount) {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  transition: all var(--transition-fast);
}

:deep(.vue-stripe-cardNumber-element-mount:focus-within),
:deep(.vue-stripe-cardExpiry-element-mount:focus-within),
:deep(.vue-stripe-cardCvc-element-mount:focus-within) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
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

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: var(--space-4);
  }

  .status-bar {
    flex-wrap: wrap;
    gap: var(--space-2);
  }
}
</style>
