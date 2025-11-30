<script setup lang="ts">
import { ref, inject, computed, defineComponent, h } from 'vue'
import { VueStripeProvider, VueStripeElements, VueStripeCardElement, useStripe } from '@vue-stripe/vue-stripe'
import type { StripeCardElement as StripeCardElementType, StripeCardElementChangeEvent } from '@stripe/stripe-js'

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

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  if (events.value.length > 20) events.value.pop()
  console.info(`[CardElement Test] ${type}:`, message)
}

// Card element ref for programmatic access
const cardElementRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)

// Card state from change events
const cardState = ref<{
  complete: boolean
  empty: boolean
  brand: string | null
  error: string | null
}>({
  complete: false,
  empty: true,
  brand: null,
  error: null
})

// Style options
const styleOption = ref<'default' | 'minimal' | 'custom'>('default')

const styleOptions = computed(() => {
  switch (styleOption.value) {
    case 'minimal':
      return {
        style: {
          base: {
            fontSize: '16px',
            color: '#333',
            '::placeholder': { color: '#aab7c4' }
          }
        },
        hidePostalCode: true
      }
    case 'custom':
      return {
        style: {
          base: {
            fontSize: '18px',
            color: '#1a1a2e',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#87bbfd' },
            iconColor: '#635bff'
          },
          invalid: {
            color: '#dc3545',
            iconColor: '#dc3545'
          }
        }
      }
    default:
      return {}
  }
})

// Event handlers
const handleReady = (_element: StripeCardElementType) => {
  log('ready', 'Card element mounted and ready')
}

const handleChange = (event: StripeCardElementChangeEvent) => {
  cardState.value = {
    complete: event.complete,
    empty: event.empty,
    brand: event.brand || null,
    error: event.error?.message || null
  }

  if (event.error) {
    log('error', event.error.message)
  } else if (event.complete) {
    log('complete', `Card complete - Brand: ${event.brand}`)
  } else if (!event.empty) {
    log('change', `Typing... Brand: ${event.brand || 'unknown'}`)
  }
}

const handleFocus = () => {
  log('focus', 'Card element focused')
}

const handleBlur = () => {
  log('blur', 'Card element blurred')
}

const handleEscape = () => {
  log('escape', 'Escape key pressed')
}

// Programmatic methods
const focusCard = () => {
  cardElementRef.value?.focus()
  log('action', 'Called focus()')
}

const clearCard = () => {
  cardElementRef.value?.clear()
  log('action', 'Called clear()')
}

// Test card numbers
const testCards = [
  { number: '4242 4242 4242 4242', brand: 'Visa', description: 'Successful payment' },
  { number: '4000 0000 0000 3220', brand: 'Visa', description: '3D Secure 2 authentication' },
  { number: '4000 0000 0000 9995', brand: 'Visa', description: 'Declined (insufficient funds)' },
  { number: '5555 5555 5555 4444', brand: 'Mastercard', description: 'Successful payment' },
  { number: '3782 822463 10005', brand: 'Amex', description: 'Successful payment' }
]

// Get active client secret (from header config or local input)
const activeClientSecret = computed(() => {
  return localClientSecret.value.trim() || stripeConfig?.clientSecret || ''
})

// Show secret form if no client secret is provided (when in payment mode)
const showSecretForm = computed(() => {
  return showPaymentSection.value && !activeClientSecret.value
})

// PaymentButton component to use inside VueStripeElements
const PaymentButton = defineComponent({
  name: 'PaymentButton',
  props: {
    clientSecret: { type: String, required: true },
    cardComplete: { type: Boolean, default: false },
    cardElement: { type: Object as () => StripeCardElementType | null, default: null }
  },
  emits: ['payment-success', 'payment-error', 'payment-processing'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const processing = ref(false)

    const handlePayment = async () => {
      if (!stripe.value || !props.cardElement) {
        emit('payment-error', 'Stripe not initialized')
        return
      }

      processing.value = true
      emit('payment-processing')

      try {
        const { error, paymentIntent } = await stripe.value.confirmCardPayment(
          props.clientSecret,
          {
            payment_method: {
              card: props.cardElement
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
  log('payment', `SUCCESS - PaymentIntent: ${paymentIntent.id}`)
}

const handlePaymentError = (message: string) => {
  paymentStatus.value = 'error'
  paymentMessage.value = message
  log('payment', `ERROR - ${message}`)
}

const handlePaymentProcessing = () => {
  paymentStatus.value = 'processing'
  paymentMessage.value = 'Processing payment...'
  log('payment', 'Processing...')
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
      <h2 class="card-title">StripeCardElement Component Test</h2>
      <p class="text-secondary">
        A single unified card input for collecting card number, expiry, CVC, and postal code.
        This is the classic Stripe card input - simpler than PaymentElement but card-only.
      </p>

      <div class="api-section">
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
              <td>StripeCardElementOptions</td>
              <td>Style and configuration options</td>
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
              <td>StripeCardElement</td>
              <td>Fired when element is mounted</td>
            </tr>
            <tr>
              <td><code>@change</code></td>
              <td>StripeCardElementChangeEvent</td>
              <td>Fired on input change (includes complete, empty, brand, error)</td>
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
          </tbody>
        </table>

        <h4>Exposed Methods (via ref)</h4>
        <ul class="method-list">
          <li><code>focus()</code> - Focus the card input</li>
          <li><code>blur()</code> - Blur the card input</li>
          <li><code>clear()</code> - Clear the card input</li>
          <li><code>element</code> - Access the underlying Stripe element</li>
        </ul>
      </div>
    </div>

    <!-- Style Options -->
    <div class="card">
      <h3>Style Options</h3>
      <div class="btn-group">
        <button
          :class="['btn btn-secondary', { active: styleOption === 'default' }]"
          @click="styleOption = 'default'"
        >
          Default
        </button>
        <button
          :class="['btn btn-secondary', { active: styleOption === 'minimal' }]"
          @click="styleOption = 'minimal'"
        >
          Minimal (no postal)
        </button>
        <button
          :class="['btn btn-secondary', { active: styleOption === 'custom' }]"
          @click="styleOption = 'custom'"
        >
          Custom Styled
        </button>
      </div>
    </div>

    <!-- Live Demo -->
    <div class="card">
      <h3>Live Demo</h3>

      <div v-if="!stripeConfig?.publishableKey" class="alert alert-warning">
        <p>No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.</p>
      </div>

      <div v-else class="demo-container">
        <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
          <VueStripeElements>
            <template #loading>
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Initializing Stripe Elements...</p>
              </div>
            </template>

            <div class="card-form">
              <label class="form-label">Card Details</label>
              <VueStripeCardElement
                ref="cardElementRef"
                :options="styleOptions"
                @ready="handleReady"
                @change="handleChange"
                @focus="handleFocus"
                @blur="handleBlur"
                @escape="handleEscape"
              />

              <!-- Card State Display -->
              <div class="card-state">
                <div class="state-item">
                  <span class="state-label">Complete:</span>
                  <span :class="['state-value', cardState.complete ? 'success' : '']">
                    {{ cardState.complete ? '✅ Yes' : '❌ No' }}
                  </span>
                </div>
                <div class="state-item">
                  <span class="state-label">Empty:</span>
                  <span class="state-value">{{ cardState.empty ? 'Yes' : 'No' }}</span>
                </div>
                <div class="state-item">
                  <span class="state-label">Brand:</span>
                  <span class="state-value brand">{{ cardState.brand || '-' }}</span>
                </div>
                <div v-if="cardState.error" class="state-item error">
                  <span class="state-label">Error:</span>
                  <span class="state-value">{{ cardState.error }}</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="btn-group mt-4">
                <button class="btn btn-sm btn-secondary" @click="focusCard">Focus</button>
                <button class="btn btn-sm btn-secondary" @click="clearCard">Clear</button>
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
                    v-if="cardElementRef?.element"
                    :client-secret="activeClientSecret"
                    :card-complete="cardState.complete"
                    :card-element="cardElementRef.element"
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
                  Use test card <code>4242 4242 4242 4242</code> with any future date and CVC
                </p>
              </div>
            </div>
          </VueStripeElements>
        </VueStripeProvider>
      </div>
    </div>

    <!-- Test Cards -->
    <div class="card">
      <h3>Test Card Numbers</h3>
      <p class="text-secondary text-sm mb-4">Use these test card numbers with any future expiry date and any 3-digit CVC.</p>
      <table class="table">
        <thead>
          <tr>
            <th>Card Number</th>
            <th>Brand</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="card in testCards" :key="card.number">
            <td><code>{{ card.number }}</code></td>
            <td>{{ card.brand }}</td>
            <td>{{ card.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="events.length === 0" class="event-empty">
          No events yet. Interact with the card input to see events.
        </div>
        <div
          v-for="(event, index) in events"
          :key="index"
          class="event-entry"
        >
          <span class="event-time">{{ event.time }}</span>
          <span :class="['event-type', event.type]">{{ event.type }}</span>
          <span class="event-message">{{ event.message }}</span>
        </div>
      </div>
    </div>

    <!-- Code Examples -->
    <div class="card">
      <h3>Code Examples</h3>

      <h4>Basic Usage</h4>
      <pre class="code-block"><code>&lt;template&gt;
  &lt;StripeProvider :publishable-key="publishableKey"&gt;
    &lt;StripeElements&gt;
      &lt;StripeCardElement
        @ready="onReady"
        @change="onChange"
      /&gt;
    &lt;/StripeElements&gt;
  &lt;/StripeProvider&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { VueStripeProvider, VueStripeElements, VueStripeCardElement } from '@vue-stripe/vue-stripe'

const onReady = (element) => console.log('Card ready!')
const onChange = (event) => {
  if (event.complete) {
    console.log('Card details complete')
  }
}
&lt;/script&gt;</code></pre>

      <h4>With Custom Styling</h4>
      <pre class="code-block"><code>&lt;StripeCardElement
  :options="{
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': { color: '#aab7c4' }
      },
      invalid: {
        color: '#9e2146'
      }
    },
    hidePostalCode: true
  }"
/&gt;</code></pre>

      <h4>Creating a Payment Method</h4>
      <pre class="code-block"><code>&lt;script setup&gt;
import { ref } from 'vue'
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const cardRef = ref()
const { stripe } = useStripe()
const { elements } = useStripeElements()

const handleSubmit = async () => {
  const cardElement = cardRef.value.element

  const { paymentMethod, error } = await stripe.value.createPaymentMethod({
    type: 'card',
    card: cardElement
  })

  if (error) {
    console.error(error.message)
  } else {
    console.log('PaymentMethod:', paymentMethod.id)
    // Send paymentMethod.id to your server
  }
}
&lt;/script&gt;</code></pre>
    </div>

    <!-- Learning Notes -->
    <div class="card card-info">
      <h3>Learning Notes</h3>
      <ul>
        <li><strong>No clientSecret needed:</strong> CardElement works without a clientSecret on StripeElements.</li>
        <li><strong>Events:</strong> Use @change to track card state (complete, empty, brand, error).</li>
        <li><strong>Styling:</strong> Use the style option with base/invalid/complete states.</li>
        <li><strong>Postal Code:</strong> Set <code>hidePostalCode: true</code> to hide it.</li>
        <li><strong>Programmatic Access:</strong> Use ref to call focus(), blur(), clear() methods.</li>
        <li><strong>Payment Flow:</strong> Use <code>stripe.createPaymentMethod()</code> or <code>stripe.createToken()</code> with the card element.</li>
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

.api-section {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border-light);
}

.api-section h3 {
  margin: 0 0 var(--space-4) 0;
}

.api-section h4 {
  margin: var(--space-5) 0 var(--space-3) 0;
  color: var(--color-text);
}

.method-list {
  margin: var(--space-3) 0 0 0;
  padding-left: var(--space-5);
}

.method-list li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

.demo-container {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.loading-state {
  text-align: center;
  padding: var(--space-8) var(--space-6);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-form {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-state {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.state-item {
  display: flex;
  gap: var(--space-2);
}

.state-item.error {
  flex-basis: 100%;
  color: var(--color-danger);
  margin-top: var(--space-2);
}

.state-label {
  color: var(--color-text-muted);
}

.state-value {
  font-weight: 500;
}

.state-value.success {
  color: var(--color-success);
}

.state-value.brand {
  text-transform: capitalize;
}

.secret-form {
  background: var(--color-bg-secondary);
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

.payment-ready h4 {
  margin: 0 0 var(--space-3) 0;
}

.card-info {
  background: linear-gradient(135deg, var(--color-info-light) 0%, #f0f7fa 100%);
  border-left: 4px solid var(--color-info);
}

.card-info h3 {
  color: var(--color-info-dark);
  margin-bottom: var(--space-4);
}

.card-info ul {
  margin: 0;
  padding-left: var(--space-5);
}

.card-info li {
  margin-bottom: var(--space-3);
  line-height: 1.7;
}
</style>
