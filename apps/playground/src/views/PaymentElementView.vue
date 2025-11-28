<script setup lang="ts">
import { ref, inject, computed, watch, defineComponent, h } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  usePaymentIntent,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

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

    const processing = ref(false)

    const handleSubmit = async () => {
      if (!stripe.value || !elements.value) {
        emit('payment-error', 'Stripe not ready')
        return
      }

      processing.value = true

      try {
        // IMPORTANT: Must call elements.submit() before confirmPayment
        const { error: submitError } = await elements.value.submit()
        if (submitError) {
          emit('payment-error', submitError.message)
          processing.value = false
          return
        }

        // Now confirm the payment
        const { error, paymentIntent } = await stripe.value.confirmPayment({
          elements: elements.value,
          clientSecret: props.clientSecret,
          confirmParams: {
            return_url: window.location.href
          },
          redirect: 'if_required'
        })

        if (error) {
          emit('payment-error', error.message)
        } else if (paymentIntent?.status === 'succeeded') {
          emit('payment-success')
        }
      } catch (err: any) {
        emit('payment-error', err.message || 'Payment failed')
      } finally {
        processing.value = false
      }
    }

    return () => h('div', { class: 'payment-form-actions' }, [
      h('button', {
        class: 'btn btn-primary btn-lg',
        disabled: !props.paymentComplete || processing.value,
        onClick: handleSubmit
      }, processing.value ? 'Processing...' : 'Pay Now'),
      h('p', { class: 'text-muted text-sm mt-3 text-center' }, [
        'Use test card ',
        h('code', '4242 4242 4242 4242'),
        ' with any future date and CVC'
      ])
    ])
  }
})

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
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">StripePaymentElement</h2>
      <p class="text-secondary">
        The Payment Element is Stripe's recommended all-in-one payment UI.
        It automatically handles cards, wallets, bank transfers, and more.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this component.
      </div>

      <!-- Client Secret Form -->
      <div v-else-if="showSecretForm" class="secret-form mt-4">
        <h4>Enter Client Secret</h4>
        <p class="text-secondary text-sm">The Payment Element requires a <code>clientSecret</code> from a PaymentIntent.</p>

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

      <!-- Payment Element -->
      <div v-else class="payment-form mt-4">
        <!-- Show current secret and allow clearing -->
        <div class="secret-status">
          <span class="secret-label">Client Secret:</span>
          <code class="secret-value">{{ clientSecret.slice(0, 15) }}...{{ clientSecret.slice(-8) }}</code>
          <button class="btn btn-sm btn-ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
            Clear
          </button>
        </div>

        <!-- Variant Controls -->
        <div class="variant-controls mt-4">
          <div class="control-group">
            <label>Layout</label>
            <div class="btn-group btn-group-sm">
              <button
                v-for="layout in ['tabs', 'accordion', 'auto']"
                :key="layout"
                :class="['btn btn-secondary', { active: selectedLayout === layout }]"
                @click="selectedLayout = layout as any"
              >
                {{ layout }}
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>Theme</label>
            <div class="btn-group btn-group-sm">
              <button
                v-for="theme in ['stripe', 'night', 'flat']"
                :key="theme"
                :class="['btn btn-secondary', { active: selectedTheme === theme }]"
                @click="selectedTheme = theme as any"
              >
                {{ theme }}
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>Wallets</label>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn btn-secondary', { active: showWallets }]"
                @click="showWallets = true"
              >
                Show
              </button>
              <button
                :class="['btn btn-secondary', { active: !showWallets }]"
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
              class="form-input form-input-sm"
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
        <div v-if="paymentStatus === 'succeeded'" class="alert alert-success mt-4">
          Payment successful! Check your Stripe Dashboard.
        </div>
        <div v-if="paymentError" class="alert alert-danger mt-4">
          {{ paymentError }}
        </div>
      </div>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
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
    <div class="card card-info">
      <h3>About Payment Element Variants</h3>

      <h4>Layout Options</h4>
      <ul>
        <li><strong>tabs</strong> - Payment methods shown as tabs (default)</li>
        <li><strong>accordion</strong> - Collapsible accordion sections</li>
        <li><strong>auto</strong> - Stripe chooses the best layout</li>
      </ul>
      <div class="alert alert-info mt-3">
        <strong>Note:</strong> Tabs/accordion only appear when multiple payment methods are enabled.
        If you only see a card form, your PaymentIntent may only have <code>card</code> enabled.
        Enable more methods in <a href="https://dashboard.stripe.com/settings/payment_methods" target="_blank" class="link">Dashboard → Payment Methods</a>.
      </div>

      <h4>Theme Options</h4>
      <ul>
        <li><strong>stripe</strong> - Default Stripe appearance</li>
        <li><strong>night</strong> - Dark mode theme</li>
        <li><strong>flat</strong> - Minimal flat design</li>
      </ul>

      <h4>Wallets (Apple Pay / Google Pay)</h4>
      <div class="alert alert-info mt-3">
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

<style scoped>
/* View uses .test-page from design-system.css for consistent width */

.card-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-xl);
}

.secret-form {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.secret-form h4 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text);
}

.instructions {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);
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
  font-size: var(--text-sm);
}

.secret-status {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-success-light);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.secret-status .secret-label {
  color: var(--color-success-dark);
  font-weight: 500;
  font-size: var(--text-sm);
}

.secret-status .secret-value {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Variant Controls */
.variant-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.control-group.full-width {
  grid-column: 1 / -1;
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
  text-transform: capitalize;
}

/* Payment Element Wrapper with theme backgrounds */
.payment-element-wrapper {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  transition: background-color var(--transition-base);
}

.payment-element-wrapper.theme-stripe {
  background: white;
  border: 1px solid var(--color-border-light);
}

.payment-element-wrapper.theme-night {
  background: #1a1a2e;
  border: 1px solid #333;
}

.payment-element-wrapper.theme-flat {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
}

.payment-form-actions {
  margin-top: var(--space-5);
}

.btn-lg {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-base);
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
  .variant-controls {
    grid-template-columns: 1fr;
  }

  .secret-status {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .secret-status .btn {
    align-self: flex-end;
  }
}
</style>
