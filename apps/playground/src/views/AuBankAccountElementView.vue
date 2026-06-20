<script setup lang="ts">
import { ref, inject, computed, defineComponent, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueStripeProvider, VueStripeElements, VueStripeAuBankAccountElement, useStripe } from '@vue-stripe/vue-stripe'
import type { StripeAuBankAccountElement as StripeAuBankAccountElementType, StripeAuBankAccountElementChangeEvent } from '@stripe/stripe-js'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Label,
  Input,
} from '@/components/ui'

// Mark VueStripeElements as used (it's used in template)
void VueStripeElements

// Child component for BECS payment confirmation (needs to be inside VueStripeProvider)
const BecsPaymentForm = defineComponent({
  name: 'BecsPaymentForm',
  props: {
    clientSecret: { type: String, default: '' },
    formComplete: { type: Boolean, default: false },
    auBankAccountElement: { type: Object, default: null }
  },
  emits: ['payment-success', 'payment-error', 'log'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const processing = ref(false)

    const handleConfirmPayment = async () => {
      if (!stripe.value || !props.auBankAccountElement) {
        emit('payment-error', 'Stripe or AU Bank Account element not ready')
        return
      }

      if (!props.clientSecret) {
        emit('payment-error', 'Client secret is required')
        return
      }

      processing.value = true
      emit('log', 'confirm', 'Starting BECS Direct Debit payment confirmation...')

      try {
        const { error, paymentIntent } = await stripe.value.confirmAuBecsDebitPayment(
          props.clientSecret,
          {
            payment_method: {
              au_becs_debit: props.auBankAccountElement,
              billing_details: {
                name: 'Test Customer',
                email: 'test@example.com'
              }
            },
          }
        )

        if (error) {
          emit('payment-error', error.message || 'Payment failed')
          emit('log', 'error', error.message || 'Payment failed')
        } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
          emit('payment-success', `PaymentIntent ${paymentIntent.status}!`)
          emit('log', 'success', `PaymentIntent ${paymentIntent.id} - ${paymentIntent.status}`)
        } else {
          emit('log', 'info', `PaymentIntent status: ${paymentIntent?.status}`)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Confirmation failed'
        emit('payment-error', message)
        emit('log', 'error', message)
      } finally {
        processing.value = false
      }
    }

    const canConfirm = computed(() =>
      props.formComplete && props.clientSecret && !processing.value
    )

    return () => h('div', { class: 'mt-4 pt-4 border-t border-border' }, [
      h(Button, {
        class: 'w-full',
        size: 'lg',
        disabled: !canConfirm.value,
        onClick: handleConfirmPayment
      }, () => processing.value ? 'Processing...' : 'Confirm BECS Direct Debit Payment'),
      h('p', {
        class: 'text-muted-foreground text-xs mt-2 text-center'
      }, 'Note: BECS Direct Debit payments are processed asynchronously'),
      !props.clientSecret && h('p', {
        class: 'text-muted-foreground text-sm mt-2 text-center'
      }, 'Enter a client secret above to enable confirmation'),
      props.clientSecret && !props.formComplete && h('p', {
        class: 'text-muted-foreground text-sm mt-2 text-center'
      }, 'Enter valid BSB and account number to enable confirmation')
    ])
  }
})

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const route = useRoute()
const router = useRouter()

// Redirect status from payment processing
const redirectStatus = ref<'succeeded' | 'failed' | null>(null)
const paymentIntentId = ref<string | null>(null)

// Check for redirect status on mount
onMounted(() => {
  const status = route.query.redirect_status as string | undefined
  const piId = route.query.payment_intent as string | undefined

  if (status === 'succeeded' || status === 'failed') {
    redirectStatus.value = status
    paymentIntentId.value = piId || null

    // Log the redirect result
    if (status === 'succeeded') {
      log('redirect', `Payment succeeded! PaymentIntent: ${piId}`)
    } else {
      log('redirect', `Payment failed. PaymentIntent: ${piId}`)
    }

    // Clean up URL query params
    router.replace({ query: {} })
  }
})

// Dismiss redirect status alert
const dismissRedirectStatus = () => {
  redirectStatus.value = null
  paymentIntentId.value = null
}

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  if (events.value.length > 20) events.value.pop()
  console.info(`[AuBankAccountElement Test] ${type}:`, message)
}

// AU Bank Account element ref for programmatic access
const auBankAccountElementRef = ref<InstanceType<typeof VueStripeAuBankAccountElement> | null>(null)

// Store the actual Stripe AU Bank Account element for confirmation
const stripeAuBankAccountElement = ref<StripeAuBankAccountElementType | null>(null)

// Payment confirmation state
const confirmationStatus = ref<'idle' | 'success' | 'error'>('idle')
const confirmationMessage = ref<string>('')

// AU Bank Account state from change events
const auBankAccountState = ref<{
  complete: boolean
  empty: boolean
  bankName: string | null
  branchName: string | null
  error: string | null
}>({
  complete: false,
  empty: true,
  bankName: null,
  branchName: null,
  error: null
})

// Event handlers
const handleReady = (element: StripeAuBankAccountElementType) => {
  stripeAuBankAccountElement.value = element
  log('ready', 'AU Bank Account element mounted and ready')
}

// Confirmation event handlers
const handlePaymentSuccess = (message: string) => {
  confirmationStatus.value = 'success'
  confirmationMessage.value = message
}

const handlePaymentError = (message: string) => {
  confirmationStatus.value = 'error'
  confirmationMessage.value = message
}

const handleChange = (event: StripeAuBankAccountElementChangeEvent) => {
  auBankAccountState.value = {
    complete: event.complete,
    empty: event.empty,
    bankName: event.bankName || null,
    branchName: event.branchName || null,
    error: event.error?.message || null
  }

  if (event.error) {
    log('error', event.error.message)
  } else if (event.complete) {
    log('complete', `Bank: ${event.bankName || 'Unknown'}, Branch: ${event.branchName || 'Unknown'}`)
  } else if (!event.empty) {
    log('change', 'Entering bank details...')
  }
}

const handleFocus = () => {
  log('focus', 'AU Bank Account element focused')
}

const handleBlur = () => {
  log('blur', 'AU Bank Account element blurred')
}

const handleEscape = () => {
  log('escape', 'Escape key pressed')
}

// Programmatic methods
const focusAuBankAccount = () => {
  auBankAccountElementRef.value?.focus()
  log('action', 'Called focus()')
}

const clearAuBankAccount = () => {
  auBankAccountElementRef.value?.clear()
  log('action', 'Called clear()')
}

// Client secret for BECS payment confirmation
const clientSecret = ref<string>('')

// Validate client secret format
const clientSecretStatus = computed(() => {
  if (!clientSecret.value) {
    return { valid: false, type: 'none', message: 'No client secret provided (required for confirming BECS payments)' }
  }

  const value = clientSecret.value.trim()

  if (value.startsWith('pi_') && value.includes('_secret_')) {
    return { valid: true, type: 'payment_intent', message: 'Valid PaymentIntent client secret' }
  }

  if (value.startsWith('seti_') && value.includes('_secret_')) {
    return { valid: true, type: 'setup_intent', message: 'Valid SetupIntent client secret' }
  }

  return { valid: false, type: 'invalid', message: 'Invalid format. Expected pi_xxx_secret_xxx or seti_xxx_secret_xxx' }
})

// Computed for clean client secret value
const cleanClientSecret = computed(() => clientSecret.value.trim() || undefined)
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <!-- Redirect Status Alert -->
    <Alert
      v-if="redirectStatus === 'succeeded'"
      variant="default"
      class="bg-success/10 border-success text-success"
    >
      <AlertDescription class="flex items-center justify-between">
        <div>
          <strong>Payment Succeeded!</strong>
          <span v-if="paymentIntentId" class="ml-2 text-sm opacity-80">
            PaymentIntent: {{ paymentIntentId }}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-success hover:text-success hover:bg-success/20"
          @click="dismissRedirectStatus"
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
    <Alert
      v-if="redirectStatus === 'failed'"
      variant="destructive"
    >
      <AlertDescription class="flex items-center justify-between">
        <div>
          <strong>Payment Failed</strong>
          <span v-if="paymentIntentId" class="ml-2 text-sm opacity-80">
            PaymentIntent: {{ paymentIntentId }}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2"
          @click="dismissRedirectStatus"
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>VueStripeAuBankAccountElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The AU Bank Account Element collects BSB number and account number for BECS Direct Debit payments.
          BECS (Bulk Electronic Clearing System) is Australia's direct debit payment system.
        </p>
        <p class="text-sm">
          <a
            href="https://vuestripe.com"
            target="_blank"
            class="text-primary hover:underline"
          >
            View full documentation →
          </a>
        </p>
      </CardContent>
    </Card>

    <!-- Client Secret Input -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">
          Client Secret
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground mb-4">
          For BECS payments, you need a client secret from a PaymentIntent
          created with <code class="bg-muted px-1 rounded">au_becs_debit</code> payment method type.
        </p>

        <div class="flex gap-3">
          <Input
            v-model="clientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx or seti_xxx_secret_xxx"
            :class="{
              'border-success': clientSecretStatus.valid,
              'border-destructive': clientSecretStatus.type === 'invalid'
            }"
            class="flex-1 font-mono text-sm"
          />
          <Button
            variant="secondary"
            size="sm"
            @click="clientSecret = ''"
          >
            Clear
          </Button>
        </div>
        <div
          class="mt-3 p-3 rounded-md text-sm"
          :class="{
            'bg-success/10 text-success': clientSecretStatus.valid,
            'bg-destructive/10 text-destructive': clientSecretStatus.type === 'invalid',
            'bg-secondary text-muted-foreground': clientSecretStatus.type === 'none'
          }"
        >
          {{ clientSecretStatus.valid ? '✅ ' : clientSecretStatus.type === 'invalid' ? '❌ ' : '' }}{{ clientSecretStatus.message }}
          <span
            v-if="clientSecretStatus.valid"
            class="font-medium ml-1"
          >
            ({{ clientSecretStatus.type === 'payment_intent' ? 'PaymentIntent' : 'SetupIntent' }})
          </span>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">
          Live Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert
          v-if="!stripeConfig?.publishableKey"
          variant="warning"
        >
          <AlertDescription>
            No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
          </AlertDescription>
        </Alert>

        <div
          v-else
          class="bg-secondary rounded-lg p-6"
        >
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements :client-secret="cleanClientSecret">
              <template #loading>
                <div class="text-center py-8">
                  <div class="w-12 h-12 border-3 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p class="text-muted-foreground">
                    Initializing Stripe Elements...
                  </p>
                </div>
              </template>

              <div class="bg-card rounded-lg p-6 shadow-sm">
                <Label class="mb-2 block">Bank Account Details (BECS - Australia)</Label>
                <div class="stripe-element-wrapper">
                  <VueStripeAuBankAccountElement
                    ref="auBankAccountElementRef"
                    @ready="handleReady"
                    @change="handleChange"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    @escape="handleEscape"
                  />
                </div>

                <!-- AU Bank Account State Display -->
                <div class="flex flex-wrap gap-4 mt-4 p-3 bg-secondary rounded-md text-sm">
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Complete:</span>
                    <span :class="auBankAccountState.complete ? 'text-success' : ''">
                      {{ auBankAccountState.complete ? '✅ Yes' : '❌ No' }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Empty:</span>
                    <span>{{ auBankAccountState.empty ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Bank:</span>
                    <span>{{ auBankAccountState.bankName || '-' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Branch:</span>
                    <span>{{ auBankAccountState.branchName || '-' }}</span>
                  </div>
                  <div
                    v-if="auBankAccountState.error"
                    class="w-full text-destructive mt-2"
                  >
                    <span class="text-muted-foreground">Error:</span>
                    <span>{{ auBankAccountState.error }}</span>
                  </div>
                </div>

                <!-- Test Data -->
                <div class="mt-4 p-3 bg-muted/50 rounded-md text-sm">
                  <p class="font-medium mb-2">Test BSB & Account Numbers:</p>
                  <ul class="space-y-1 text-muted-foreground">
                    <li>BSB: <code class="bg-muted px-1 rounded">000-000</code></li>
                    <li>Account: <code class="bg-muted px-1 rounded">000123456</code></li>
                  </ul>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="focusAuBankAccount"
                  >
                    Focus
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="clearAuBankAccount"
                  >
                    Clear
                  </Button>
                </div>

                <!-- Confirmation Form -->
                <BecsPaymentForm
                  :client-secret="cleanClientSecret || ''"
                  :form-complete="auBankAccountState.complete"
                  :au-bank-account-element="stripeAuBankAccountElement"
                  @payment-success="handlePaymentSuccess"
                  @payment-error="handlePaymentError"
                  @log="log"
                />

                <!-- Confirmation Status -->
                <Alert
                  v-if="confirmationStatus === 'success'"
                  variant="default"
                  class="mt-4 bg-success/10 border-success text-success"
                >
                  <AlertDescription>
                    {{ confirmationMessage }}
                  </AlertDescription>
                </Alert>
                <Alert
                  v-if="confirmationStatus === 'error'"
                  variant="destructive"
                  class="mt-4"
                >
                  <AlertDescription>
                    {{ confirmationMessage }}
                  </AlertDescription>
                </Alert>
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">
          Event Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log">
          <div
            v-if="events.length === 0"
            class="text-slate-400 text-center py-4"
          >
            No events yet. Enter bank details to see events.
          </div>
          <div
            v-for="(event, index) in events"
            :key="index"
            class="event-entry"
          >
            <span class="event-time">{{ event.time }}</span>
            <span :class="['event-type', event.type]">{{ event.type }}</span>
            <span class="event-data">{{ event.message }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
