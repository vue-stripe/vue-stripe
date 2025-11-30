<script setup lang="ts">
import { ref, inject, computed, watch, defineComponent, h } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  useSetupIntent,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

// Child component for setup submission (needs to be inside VueStripeElements)
const SetupForm = defineComponent({
  name: 'SetupForm',
  props: {
    clientSecret: { type: String, required: true },
    setupComplete: { type: Boolean, default: false }
  },
  emits: ['setup-success', 'setup-error'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const { elements } = useStripeElements()
    const { confirmSetup, loading, error } = useSetupIntent()

    const handleSubmit = async () => {
      if (!stripe.value || !elements.value) {
        emit('setup-error', 'Stripe not ready')
        return
      }

      try {
        // IMPORTANT: Must call elements.submit() before confirmCardSetup
        const { error: submitError } = await elements.value.submit()
        if (submitError) {
          emit('setup-error', submitError.message)
          return
        }

        // Confirm the setup using the composable
        const result = await confirmSetup({
          clientSecret: props.clientSecret,
          confirmParams: {
            return_url: window.location.href
          },
          redirect: 'if_required'
        })

        if (result.error) {
          emit('setup-error', result.error.message)
        } else if (result.setupIntent?.status === 'succeeded') {
          emit('setup-success', result.setupIntent)
        }
      } catch (err: any) {
        emit('setup-error', err.message || 'Setup failed')
      }
    }

    return () => h('div', { class: 'setup-form-actions' }, [
      h('div', { class: 'composable-state mb-3' }, [
        h('span', { class: 'state-label' }, 'useSetupIntent state:'),
        h('span', { class: `state-value ${loading.value ? 'loading' : ''}` },
          loading.value ? 'Processing...' : 'Ready'),
        error.value ? h('span', { class: 'state-error' }, error.value) : null
      ]),
      h('button', {
        class: 'btn btn-primary btn-lg',
        disabled: !props.setupComplete || loading.value,
        onClick: handleSubmit
      }, loading.value ? 'Saving Card...' : 'Save Card'),
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
  setupSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Local setup secret state (separate from global config)
const localSetupSecret = ref('')
const setupSecret = computed(() => localSetupSecret.value.trim())
const showSecretForm = computed(() => publishableKey.value && !setupSecret.value)

// Setup state
const setupComplete = ref(false)
const setupError = ref<string | null>(null)
const setupStatus = ref<string>('')
const savedSetupIntent = ref<any>(null)

// Element state
const elementReady = ref(false)
const elementLoading = ref(true)

// Key to force remount when options change
const elementKey = ref(0)

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
  setupComplete.value = event.complete
  if (event.value?.type) {
    logEvent('change', `type: ${event.value.type}, complete: ${event.complete}`)
  } else {
    logEvent('change', `complete: ${event.complete}`)
  }
}

const onFocus = () => logEvent('focus')
const onBlur = () => logEvent('blur')

const handleSetupSuccess = (setupIntent: any) => {
  setupStatus.value = 'succeeded'
  savedSetupIntent.value = setupIntent
  logEvent('setup-success', `SetupIntent ID: ${setupIntent.id}`)
}

const handleSetupError = (msg: string) => {
  setupError.value = msg
  logEvent('setup-error', msg)
}

const resetForm = () => {
  localSetupSecret.value = ''
  setupComplete.value = false
  setupError.value = null
  setupStatus.value = ''
  savedSetupIntent.value = null
  elementKey.value++
}
</script>

<template>
  <div class="test-page">
    <div class="card">
      <h2 class="card-title">useSetupIntent</h2>
      <p class="text-secondary">
        Save a payment method for future use without charging the customer.
        This is used for subscriptions, saved cards, and pay-later flows.
      </p>

      <!-- Warning if no publishable key -->
      <div v-if="!publishableKey" class="alert alert-warning mt-4">
        Add your Stripe publishable key using the header button to test this composable.
      </div>

      <!-- Setup Secret Form -->
      <div v-else-if="showSecretForm" class="secret-form mt-4">
        <h4>Enter Setup Secret</h4>
        <p class="text-secondary text-sm">A SetupIntent is required to save a payment method.</p>

        <div class="form-group mt-4">
          <label class="form-label">Setup Secret</label>
          <input
            v-model="localSetupSecret"
            type="text"
            placeholder="seti_xxx_secret_xxx"
            class="form-input form-input-mono"
            :class="{ 'is-valid': localSetupSecret.includes('_secret_') }"
          />
        </div>

        <div class="instructions mt-4">
          <h5>How to get a Setup Secret:</h5>
          <ol>
            <li>Create a SetupIntent via the Stripe API or Dashboard</li>
            <li>
              <strong>Quick method with cURL:</strong>
              <pre class="code-block">curl https://api.stripe.com/v1/setup_intents \
  -u sk_test_YOUR_SECRET_KEY: \
  -d "payment_method_types[]"=card</pre>
            </li>
            <li>Copy the <code>client_secret</code> from the response</li>
          </ol>
          <p class="text-muted text-sm mt-2">
            The setup secret looks like: <code>seti_xxx_secret_xxx</code>
          </p>
        </div>
      </div>

      <!-- Setup Element -->
      <div v-else class="setup-form mt-4">
        <!-- Success State -->
        <div v-if="setupStatus === 'succeeded'" class="success-state">
          <div class="alert alert-success">
            <h4>Card Saved Successfully!</h4>
            <p>The payment method has been attached and can be used for future payments.</p>
          </div>

          <div class="setup-details mt-4">
            <h5>SetupIntent Details</h5>
            <div class="detail-row">
              <span class="detail-label">ID:</span>
              <code class="detail-value">{{ savedSetupIntent?.id }}</code>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="badge badge-success">{{ savedSetupIntent?.status }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <code class="detail-value">{{ savedSetupIntent?.payment_method }}</code>
            </div>
          </div>

          <button class="btn btn-secondary mt-4" @click="resetForm">
            Save Another Card
          </button>
        </div>

        <!-- Form State -->
        <template v-else>
          <!-- Show current secret and allow clearing -->
          <div class="secret-status">
            <span class="secret-label">Setup Secret:</span>
            <code class="secret-value">{{ setupSecret.slice(0, 15) }}...{{ setupSecret.slice(-8) }}</code>
            <button class="btn btn-sm btn-ghost" @click="localSetupSecret = ''" title="Clear and enter new secret">
              Clear
            </button>
          </div>

          <div class="setup-element-wrapper">
            <VueStripeProvider :publishable-key="publishableKey">
              <VueStripeElements
                :key="elementKey"
                :client-secret="setupSecret"
                :options="{ appearance: { theme: 'stripe' } }"
              >
                <VueStripePaymentElement
                  @ready="onReady"
                  @change="onChange"
                  @focus="onFocus"
                  @blur="onBlur"
                />

                <!-- Setup Form Child Component -->
                <SetupForm
                  :client-secret="setupSecret"
                  :setup-complete="setupComplete"
                  @setup-success="handleSetupSuccess"
                  @setup-error="handleSetupError"
                />
              </VueStripeElements>
            </VueStripeProvider>
          </div>

          <!-- Error display -->
          <div v-if="setupError" class="alert alert-danger mt-4">
            {{ setupError }}
          </div>
        </template>
      </div>
    </div>

    <!-- Event Log -->
    <div class="card">
      <h3>Event Log</h3>
      <div class="event-log">
        <div v-if="eventLog.length === 0" class="event-empty">
          Interact with the element to see events...
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
      <h3>About useSetupIntent</h3>

      <h4>What is a SetupIntent?</h4>
      <p>
        A SetupIntent is used to collect payment method details without charging the customer.
        Use it when you want to save a card for future payments.
      </p>

      <h4>Common Use Cases</h4>
      <ul>
        <li><strong>Subscriptions</strong> - Save card before starting a subscription</li>
        <li><strong>Saved cards</strong> - Let customers add cards to their account</li>
        <li><strong>Free trials</strong> - Collect card for after trial ends</li>
        <li><strong>Pay later</strong> - Authorize now, charge later</li>
      </ul>

      <h4>The Composable</h4>
      <pre class="code-block">const { confirmSetup, loading, error } = useSetupIntent()

// Save the card
const result = await confirmSetup({
  clientSecret: 'seti_xxx_secret_xxx',
  confirmParams: {
    return_url: 'https://yoursite.com/account'
  },
  redirect: 'if_required'
})

if (result.setupIntent?.status === 'succeeded') {
  // Card saved! Use result.setupIntent.payment_method
}</pre>

      <h4>Test Cards</h4>
      <ul>
        <li><code>4242 4242 4242 4242</code> - Succeeds</li>
        <li><code>4000 0000 0000 0002</code> - Declined</li>
        <li><code>4000 0025 0000 3155</code> - Requires 3D Secure</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
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

.code-block {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  font-size: var(--text-xs);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.secret-status {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-info-light);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.secret-status .secret-label {
  color: var(--color-info-dark);
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

.setup-element-wrapper {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  background: white;
  border: 1px solid var(--color-border-light);
}

.setup-form-actions {
  margin-top: var(--space-5);
}

.composable-state {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.state-label {
  color: var(--color-text-muted);
}

.state-value {
  font-weight: 500;
  color: var(--color-success);
}

.state-value.loading {
  color: var(--color-warning);
}

.state-error {
  color: var(--color-danger);
  margin-left: auto;
}

.btn-lg {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-base);
}

/* Success State */
.success-state .alert h4 {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-success-dark);
}

.success-state .alert p {
  margin: 0;
  font-size: var(--text-sm);
}

.setup-details {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.setup-details h5 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  min-width: 120px;
}

.detail-value {
  font-size: var(--text-sm);
}

.badge {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

/* Info Card */
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

@media (max-width: 768px) {
  .secret-status {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .secret-status .btn {
    align-self: flex-end;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .detail-label {
    min-width: auto;
  }
}
</style>
