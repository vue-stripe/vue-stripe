<script setup lang="ts">
import { ref, inject, computed, defineComponent, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueStripeProvider, VueStripeElements, VueStripeEpsBankElement, useStripe } from '@vue-stripe/vue-stripe'
import type { StripeEpsBankElement as StripeEpsBankElementType, StripeEpsBankElementChangeEvent } from '@stripe/stripe-js'
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

// Child component for EPS payment confirmation (needs to be inside VueStripeProvider)
const EpsPaymentForm = defineComponent({
  name: 'EpsPaymentForm',
  props: {
    clientSecret: { type: String, default: '' },
    bankComplete: { type: Boolean, default: false },
    epsElement: { type: Object, default: null }
  },
  emits: ['payment-success', 'payment-error', 'log'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const processing = ref(false)

    const handleConfirmPayment = async () => {
      if (!stripe.value || !props.epsElement) {
        emit('payment-error', 'Stripe or EPS element not ready')
        return
      }

      if (!props.clientSecret) {
        emit('payment-error', 'Client secret is required')
        return
      }

      processing.value = true
      emit('log', 'confirm', 'Starting EPS payment confirmation...')

      try {
        // EPS only supports PaymentIntent (not SetupIntent)
        const { error, paymentIntent } = await stripe.value.confirmEpsPayment(
          props.clientSecret,
          {
            payment_method: {
              eps: props.epsElement,
              billing_details: {
                name: 'Test Customer'
              }
            },
            return_url: window.location.href
          }
        )

        if (error) {
          emit('payment-error', error.message || 'Payment failed')
          emit('log', 'error', error.message || 'Payment failed')
        } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_action') {
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
      props.bankComplete && props.clientSecret && !processing.value
    )

    return () => h('div', { class: 'mt-4 pt-4 border-t border-border' }, [
      h(Button, {
        class: 'w-full',
        size: 'lg',
        disabled: !canConfirm.value,
        onClick: handleConfirmPayment
      }, () => processing.value ? 'Processing...' : 'Confirm EPS Payment'),
      h('p', {
        class: 'text-muted-foreground text-xs mt-2 text-center'
      }, 'Note: EPS payments require a redirect to the bank for authorization'),
      !props.clientSecret && h('p', {
        class: 'text-muted-foreground text-sm mt-2 text-center'
      }, 'Enter a client secret above to enable confirmation'),
      props.clientSecret && !props.bankComplete && h('p', {
        class: 'text-muted-foreground text-sm mt-2 text-center'
      }, 'Select a bank to enable confirmation')
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
  console.info(`[EpsBankElement Test] ${type}:`, message)
}

// EPS element ref for programmatic access
const epsElementRef = ref<InstanceType<typeof VueStripeEpsBankElement> | null>(null)

// Store the actual Stripe EPS element for confirmation
const stripeEpsElement = ref<StripeEpsBankElementType | null>(null)

// Payment confirmation state
const confirmationStatus = ref<'idle' | 'success' | 'error'>('idle')
const confirmationMessage = ref<string>('')

// EPS state from change events
const epsState = ref<{
  complete: boolean
  empty: boolean
  value: string | null
  error: string | null
}>({
  complete: false,
  empty: true,
  value: null,
  error: null
})

// Event handlers
const handleReady = (element: StripeEpsBankElementType) => {
  stripeEpsElement.value = element
  log('ready', 'EPS bank element mounted and ready')
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

const handleChange = (event: StripeEpsBankElementChangeEvent) => {
  epsState.value = {
    complete: event.complete,
    empty: event.empty,
    value: event.value || null,
    error: event.error?.message || null
  }

  if (event.error) {
    log('error', event.error.message)
  } else if (event.complete) {
    log('complete', `Bank selected: ${event.value}`)
  } else if (!event.empty) {
    log('change', 'Selecting bank...')
  }
}

const handleFocus = () => {
  log('focus', 'EPS element focused')
}

const handleBlur = () => {
  log('blur', 'EPS element blurred')
}

const handleEscape = () => {
  log('escape', 'Escape key pressed')
}

// Programmatic methods
const focusEps = () => {
  epsElementRef.value?.focus()
  log('action', 'Called focus()')
}

const clearEps = () => {
  epsElementRef.value?.clear()
  log('action', 'Called clear()')
}

// Client secret for EPS payment confirmation
const clientSecret = ref<string>('')

// Validate client secret format
const clientSecretStatus = computed(() => {
  if (!clientSecret.value) {
    return { valid: false, type: 'none', message: 'No client secret provided (required for confirming EPS payments)' }
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
        <CardTitle>VueStripeEpsBankElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The EPS Bank Element displays a dropdown list of Austrian banks for EPS payments.
          EPS (Electronic Payment Standard) is a popular payment method in Austria used for online bank transfers.
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
          For EPS payments, you need a client secret from a PaymentIntent
          created with <code class="bg-muted px-1 rounded">eps</code> payment method type.
        </p>

        <div class="flex gap-3">
          <Input
            v-model="clientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx"
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
                <Label class="mb-2 block">Select your bank (EPS - Austria)</Label>
                <div class="stripe-element-wrapper">
                  <VueStripeEpsBankElement
                    ref="epsElementRef"
                    @ready="handleReady"
                    @change="handleChange"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    @escape="handleEscape"
                  />
                </div>

                <!-- EPS State Display -->
                <div class="flex flex-wrap gap-4 mt-4 p-3 bg-secondary rounded-md text-sm">
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Complete:</span>
                    <span :class="epsState.complete ? 'text-success' : ''">
                      {{ epsState.complete ? '✅ Yes' : '❌ No' }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Empty:</span>
                    <span>{{ epsState.empty ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Selected Bank:</span>
                    <span>{{ epsState.value || '-' }}</span>
                  </div>
                  <div
                    v-if="epsState.error"
                    class="w-full text-destructive mt-2"
                  >
                    <span class="text-muted-foreground">Error:</span>
                    <span>{{ epsState.error }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="focusEps"
                  >
                    Focus
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="clearEps"
                  >
                    Clear
                  </Button>
                </div>

                <!-- Confirmation Form -->
                <EpsPaymentForm
                  :client-secret="cleanClientSecret || ''"
                  :bank-complete="epsState.complete"
                  :eps-element="stripeEpsElement"
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
            No events yet. Interact with the bank selector to see events.
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
