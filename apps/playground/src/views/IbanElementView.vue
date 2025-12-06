<script setup lang="ts">
import { ref, inject, computed, defineComponent, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueStripeProvider, VueStripeElements, VueStripeIbanElement, useStripe } from '@vue-stripe/vue-stripe'
import type { StripeIbanElement as StripeIbanElementType, StripeIbanElementChangeEvent } from '@stripe/stripe-js'
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

// Child component for SEPA Direct Debit payment confirmation (needs to be inside VueStripeProvider)
const SepaPaymentForm = defineComponent({
  name: 'SepaPaymentForm',
  props: {
    clientSecret: { type: String, default: '' },
    ibanComplete: { type: Boolean, default: false },
    ibanElement: { type: Object, default: null }
  },
  emits: ['payment-success', 'payment-error', 'log'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const processing = ref(false)

    const handleConfirmPayment = async () => {
      if (!stripe.value || !props.ibanElement) {
        emit('payment-error', 'Stripe or IBAN element not ready')
        return
      }

      if (!props.clientSecret) {
        emit('payment-error', 'Client secret is required')
        return
      }

      processing.value = true
      emit('log', 'confirm', 'Starting SEPA Direct Debit confirmation...')

      try {
        // Determine if it's a PaymentIntent or SetupIntent
        const isSetupIntent = props.clientSecret.startsWith('seti_')

        if (isSetupIntent) {
          const { error, setupIntent } = await stripe.value.confirmSepaDebitSetup(
            props.clientSecret,
            {
              payment_method: {
                sepa_debit: props.ibanElement,
                billing_details: {
                  name: 'Test Customer',
                  email: 'test@example.com'
                }
              }
            }
          )

          if (error) {
            emit('payment-error', error.message || 'Setup failed')
            emit('log', 'error', error.message || 'Setup failed')
          } else if (setupIntent?.status === 'succeeded') {
            emit('payment-success', 'SetupIntent succeeded!')
            emit('log', 'success', `SetupIntent ${setupIntent.id} succeeded`)
          } else {
            emit('log', 'info', `SetupIntent status: ${setupIntent?.status}`)
          }
        } else {
          const { error, paymentIntent } = await stripe.value.confirmSepaDebitPayment(
            props.clientSecret,
            {
              payment_method: {
                sepa_debit: props.ibanElement,
                billing_details: {
                  name: 'Test Customer',
                  email: 'test@example.com'
                }
              }
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
      props.ibanComplete && props.clientSecret && !processing.value
    )

    return () => h('div', { class: 'mt-4 pt-4 border-t border-border' }, [
      h(Button, {
        class: 'w-full',
        size: 'lg',
        disabled: !canConfirm.value,
        onClick: handleConfirmPayment
      }, () => processing.value ? 'Processing...' : 'Confirm SEPA Direct Debit'),
      !props.clientSecret && h('p', {
        class: 'text-muted-foreground text-sm mt-2 text-center'
      }, 'Enter a client secret above to enable confirmation'),
      props.clientSecret && !props.ibanComplete && h('p', {
        class: 'text-muted-foreground text-sm mt-2 text-center'
      }, 'Complete the IBAN field to enable confirmation')
    ])
  }
})

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const route = useRoute()
const router = useRouter()

// Redirect status from bank authorization
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
  console.info(`[IbanElement Test] ${type}:`, message)
}

// IBAN element ref for programmatic access
const ibanElementRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)

// Store the actual Stripe IBAN element for confirmation
const stripeIbanElement = ref<StripeIbanElementType | null>(null)

// Payment confirmation state
const confirmationStatus = ref<'idle' | 'success' | 'error'>('idle')
const confirmationMessage = ref<string>('')

// IBAN state from change events
const ibanState = ref<{
  complete: boolean
  empty: boolean
  country: string | null
  bankName: string | null
  error: string | null
}>({
  complete: false,
  empty: true,
  country: null,
  bankName: null,
  error: null
})

// Event handlers
const handleReady = (element: StripeIbanElementType) => {
  stripeIbanElement.value = element
  log('ready', 'IBAN element mounted and ready')
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

const handleChange = (event: StripeIbanElementChangeEvent) => {
  ibanState.value = {
    complete: event.complete,
    empty: event.empty,
    country: event.country || null,
    bankName: event.bankName || null,
    error: event.error?.message || null
  }

  if (event.error) {
    log('error', event.error.message)
  } else if (event.complete) {
    log('complete', `IBAN complete - Country: ${event.country}, Bank: ${event.bankName}`)
  } else if (!event.empty) {
    log('change', `Typing... Country: ${event.country || 'unknown'}`)
  }
}

const handleFocus = () => {
  log('focus', 'IBAN element focused')
}

const handleBlur = () => {
  log('blur', 'IBAN element blurred')
}

const handleEscape = () => {
  log('escape', 'Escape key pressed')
}

// Programmatic methods
const focusIban = () => {
  ibanElementRef.value?.focus()
  log('action', 'Called focus()')
}

const clearIban = () => {
  ibanElementRef.value?.clear()
  log('action', 'Called clear()')
}

// Client secret for SEPA Direct Debit confirmation
const clientSecret = ref<string>('')

// Validate client secret format
const clientSecretStatus = computed(() => {
  if (!clientSecret.value) {
    return { valid: false, type: 'none', message: 'No client secret provided (required for confirming SEPA Direct Debit)' }
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
        <CardTitle>VueStripeIbanElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The IBAN Element collects IBAN (International Bank Account Number) for SEPA Direct Debit payments.
          This is used for European bank transfers and supports all SEPA countries.
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
          For SEPA Direct Debit payments, you need a client secret from a PaymentIntent or SetupIntent
          created with <code class="bg-muted px-1 rounded">sepa_debit</code> payment method type.
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
                <Label class="mb-2 block">IBAN (International Bank Account Number)</Label>
                <div class="stripe-element-wrapper">
                  <VueStripeIbanElement
                    ref="ibanElementRef"
                    @ready="handleReady"
                    @change="handleChange"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    @escape="handleEscape"
                  />
                </div>

                <!-- IBAN State Display -->
                <div class="flex flex-wrap gap-4 mt-4 p-3 bg-secondary rounded-md text-sm">
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Complete:</span>
                    <span :class="ibanState.complete ? 'text-success' : ''">
                      {{ ibanState.complete ? '✅ Yes' : '❌ No' }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Empty:</span>
                    <span>{{ ibanState.empty ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Country:</span>
                    <span class="uppercase">{{ ibanState.country || '-' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Bank:</span>
                    <span>{{ ibanState.bankName || '-' }}</span>
                  </div>
                  <div
                    v-if="ibanState.error"
                    class="w-full text-destructive mt-2"
                  >
                    <span class="text-muted-foreground">Error:</span>
                    <span>{{ ibanState.error }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="focusIban"
                  >
                    Focus
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="clearIban"
                  >
                    Clear
                  </Button>
                </div>

                <!-- Confirmation Form -->
                <SepaPaymentForm
                  :client-secret="cleanClientSecret || ''"
                  :iban-complete="ibanState.complete"
                  :iban-element="stripeIbanElement"
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
            No events yet. Interact with the IBAN input to see events.
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
