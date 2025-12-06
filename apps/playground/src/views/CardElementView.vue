<script setup lang="ts">
import { ref, inject, computed, defineComponent, h } from 'vue'
import { VueStripeProvider, VueStripeElements, VueStripeCardElement, useStripe } from '@vue-stripe/vue-stripe'
import type { StripeCardElement as StripeCardElementType, StripeCardElementChangeEvent } from '@stripe/stripe-js'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

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

    return () => h(Button, {
      variant: 'success',
      disabled: !props.cardComplete || processing.value || !props.clientSecret,
      onClick: handlePayment
    }, () => processing.value ? 'Processing...' : 'Confirm Payment')
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
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripeCardElement Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          A single unified card input for collecting card number, expiry, CVC, and postal code.
          This is the classic Stripe card input - simpler than PaymentElement but card-only.
        </p>
        <p class="text-sm">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>
      </CardContent>
    </Card>

    <!-- Style Options -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Style Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <Label class="text-xs uppercase tracking-wide text-muted-foreground">Card Style</Label>
          <Tabs v-model="styleOption" class="w-full">
            <TabsList class="grid w-full grid-cols-3">
              <TabsTrigger value="default">Default</TabsTrigger>
              <TabsTrigger value="minimal">Minimal</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
          <AlertDescription>
            No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
          </AlertDescription>
        </Alert>

        <div v-else class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements>
              <template #loading>
                <div class="text-center py-8">
                  <div class="w-12 h-12 border-3 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p class="text-muted-foreground">Initializing Stripe Elements...</p>
                </div>
              </template>

              <div class="bg-card rounded-lg p-6 shadow-sm">
                <Label class="mb-2 block">Card Details</Label>
                <div class="stripe-element-wrapper">
                  <VueStripeCardElement
                    ref="cardElementRef"
                    :options="styleOptions"
                    @ready="handleReady"
                    @change="handleChange"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    @escape="handleEscape"
                  />
                </div>

                <!-- Card State Display -->
                <div class="flex flex-wrap gap-4 mt-4 p-3 bg-secondary rounded-md text-sm">
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Complete:</span>
                    <span :class="cardState.complete ? 'text-success' : ''">
                      {{ cardState.complete ? '✅ Yes' : '❌ No' }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Empty:</span>
                    <span>{{ cardState.empty ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted-foreground">Brand:</span>
                    <span class="capitalize">{{ cardState.brand || '-' }}</span>
                  </div>
                  <div v-if="cardState.error" class="w-full text-destructive mt-2">
                    <span class="text-muted-foreground">Error:</span>
                    <span>{{ cardState.error }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <Button variant="secondary" size="sm" @click="focusCard">Focus</Button>
                  <Button variant="secondary" size="sm" @click="clearCard">Clear</Button>
                  <Button
                    :variant="showPaymentSection ? 'default' : 'secondary'"
                    size="sm"
                    @click="showPaymentSection = !showPaymentSection"
                  >
                    {{ showPaymentSection ? 'Hide Payment' : 'Test Payment' }}
                  </Button>
                </div>

                <!-- Payment Mode: Client Secret Form -->
                <div v-if="showSecretForm" class="bg-secondary rounded-lg p-5 mt-4">
                  <h4 class="font-medium mb-3">Enter Client Secret</h4>
                  <p class="text-muted-foreground text-sm mb-4">
                    To test payment confirmation, you need a <code class="bg-muted px-1 rounded">client_secret</code> from a PaymentIntent.
                  </p>

                  <div class="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      v-model="localClientSecret"
                      type="text"
                      placeholder="pi_xxx_secret_xxx"
                      class="font-mono text-sm"
                      :class="{ 'border-success': localClientSecret.includes('_secret_') }"
                    />
                  </div>
                </div>

                <!-- Payment Mode: Ready to Pay -->
                <div v-else-if="showPaymentSection && activeClientSecret" class="mt-4">
                  <div class="flex items-center gap-3 p-3 bg-info/10 border border-info/30 rounded-md">
                    <span class="text-sm text-info font-medium">Client Secret:</span>
                    <code class="text-xs bg-background px-2 py-0.5 rounded font-mono">
                      {{ activeClientSecret.slice(0, 15) }}...{{ activeClientSecret.slice(-8) }}
                    </code>
                    <Button variant="ghost" size="sm" class="ml-auto" @click="localClientSecret = ''">
                      Clear
                    </Button>
                  </div>

                  <div class="flex flex-wrap gap-2 mt-3">
                    <PaymentButton
                      v-if="cardElementRef?.element"
                      :client-secret="activeClientSecret"
                      :card-complete="cardState.complete"
                      :card-element="cardElementRef.element"
                      @payment-success="handlePaymentSuccess"
                      @payment-error="handlePaymentError"
                      @payment-processing="handlePaymentProcessing"
                    />
                    <Button
                      v-if="paymentStatus !== 'idle'"
                      variant="secondary"
                      size="sm"
                      @click="resetPaymentState"
                    >
                      Reset
                    </Button>
                  </div>

                  <!-- Payment Status -->
                  <Alert
                    v-if="paymentMessage"
                    :variant="paymentStatus === 'succeeded' ? 'success' : paymentStatus === 'error' ? 'destructive' : 'warning'"
                    class="mt-3"
                  >
                    <AlertDescription>{{ paymentMessage }}</AlertDescription>
                  </Alert>

                  <p class="text-muted-foreground text-sm mt-3">
                    Use test card <code class="bg-muted px-1 rounded">4242 4242 4242 4242</code> with any future date and CVC
                  </p>
                </div>
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log">
          <div v-if="events.length === 0" class="text-slate-400 text-center py-4">
            No events yet. Interact with the card input to see events.
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
