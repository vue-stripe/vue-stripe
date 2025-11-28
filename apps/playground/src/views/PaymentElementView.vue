<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
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

// Layout and appearance variants
const selectedLayout = ref<'tabs' | 'accordion' | 'auto'>('tabs')
const selectedTheme = ref<'stripe' | 'night' | 'flat'>('stripe')
const showWallets = ref(true)
const businessName = ref('')

// Key to force remount when options change
const elementKey = ref(0)

// Watch for layout/theme changes - remount element
watch([selectedLayout, selectedTheme, showWallets], () => {
  elementKey.value++
  elementReady.value = false
  elementLoading.value = true
  paymentComplete.value = false
})

// Computed element options
const elementOptions = computed(() => ({
  layout: {
    type: selectedLayout.value,
    defaultCollapsed: selectedLayout.value === 'accordion',
    radios: selectedLayout.value === 'accordion',
    spacedAccordionItems: selectedLayout.value === 'accordion'
  },
  business: businessName.value ? { name: businessName.value } : undefined,
  wallets: showWallets.value ? { applePay: 'auto', googlePay: 'auto' } : { applePay: 'never', googlePay: 'never' }
}))

// Computed appearance based on theme
const appearance = computed(() => {
  const themes = {
    stripe: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#635bff'
      }
    },
    night: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#635bff',
        colorBackground: '#1a1a2e',
        colorText: '#ffffff'
      }
    },
    flat: {
      theme: 'flat' as const,
      variables: {
        colorPrimary: '#635bff',
        borderRadius: '0px'
      }
    }
  }
  return themes[selectedTheme.value]
})

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

        <!-- Variant Controls -->
        <div class="variant-controls">
          <div class="control-group">
            <label>Layout</label>
            <div class="button-group">
              <button
                v-for="layout in ['tabs', 'accordion', 'auto']"
                :key="layout"
                :class="['variant-btn', { active: selectedLayout === layout }]"
                @click="selectedLayout = layout as any"
              >
                {{ layout }}
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>Theme</label>
            <div class="button-group">
              <button
                v-for="theme in ['stripe', 'night', 'flat']"
                :key="theme"
                :class="['variant-btn', { active: selectedTheme === theme }]"
                @click="selectedTheme = theme as any"
              >
                {{ theme }}
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>Wallets</label>
            <div class="button-group">
              <button
                :class="['variant-btn', { active: showWallets }]"
                @click="showWallets = true"
              >
                Show
              </button>
              <button
                :class="['variant-btn', { active: !showWallets }]"
                @click="showWallets = false"
              >
                Hide
              </button>
            </div>
          </div>

          <div class="control-group full-width">
            <label>Business Name (optional)</label>
            <input
              v-model="businessName"
              type="text"
              placeholder="Your Company Name"
              class="input-small"
            />
          </div>
        </div>

        <div :class="['payment-element-wrapper', `theme-${selectedTheme}`]">
          <StripeProvider :publishable-key="publishableKey">
            <StripeElements
              :key="elementKey"
              :client-secret="clientSecret"
              :options="{ appearance }"
            >
              <StripePaymentElement
                :options="elementOptions"
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
        </div>

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
      <h3>About Payment Element Variants</h3>

      <h4>Layout Options</h4>
      <ul>
        <li><strong>tabs</strong> - Payment methods shown as tabs (default)</li>
        <li><strong>accordion</strong> - Collapsible accordion sections</li>
        <li><strong>auto</strong> - Stripe chooses the best layout</li>
      </ul>
      <div class="note">
        <strong>Note:</strong> Tabs/accordion only appear when multiple payment methods are enabled.
        If you only see a card form, your PaymentIntent may only have <code>card</code> enabled.
        Enable more methods in <a href="https://dashboard.stripe.com/settings/payment_methods" target="_blank">Dashboard → Payment Methods</a>.
      </div>

      <h4>Theme Options</h4>
      <ul>
        <li><strong>stripe</strong> - Default Stripe appearance</li>
        <li><strong>night</strong> - Dark mode theme</li>
        <li><strong>flat</strong> - Minimal flat design</li>
      </ul>

      <h4>Wallets (Apple Pay / Google Pay)</h4>
      <div class="note">
        Wallets require: HTTPS, domain verification, and a supported device/browser.
        They won't appear on localhost unless you use a tunnel service.
      </div>

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
* {
  box-sizing: border-box;
}

.payment-element-view {
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
  padding: 1.25rem;
  color: #856404;
}

.secret-form {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  overflow: hidden;
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
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
  transition: all 0.2s ease;
  word-break: break-all;
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
  flex-wrap: wrap;
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* Variant Controls */
.variant-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group.full-width {
  grid-column: 1 / -1;
}

.control-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-group {
  display: flex;
  gap: 0.25rem;
}

.variant-btn {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: capitalize;
}

.variant-btn:hover {
  border-color: #635bff;
}

.variant-btn.active {
  background: #635bff;
  color: white;
  border-color: #635bff;
}

.input-small {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  width: 100%;
}

.input-small:focus {
  outline: none;
  border-color: #635bff;
  box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.1);
}

/* Payment Element Wrapper with theme backgrounds */
.payment-element-wrapper {
  padding: 1.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.payment-element-wrapper.theme-stripe {
  background: white;
  border: 1px solid #e0e0e0;
}

.payment-element-wrapper.theme-night {
  background: #1a1a2e;
  border: 1px solid #333;
}

.payment-element-wrapper.theme-flat {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.note {
  background: #e8f4f8;
  border-left: 4px solid #17a2b8;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
  font-size: 0.85rem;
  border-radius: 0 4px 4px 0;
  color: #0c5460;
}

.note a {
  color: #0c5460;
  text-decoration: underline;
}

.note code {
  background: rgba(0, 0, 0, 0.1);
}
</style>
