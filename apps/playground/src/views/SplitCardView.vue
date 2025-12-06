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

    return () => h(Button, {
      variant: 'default',
      class: 'bg-green-600 hover:bg-green-700',
      disabled: !props.cardComplete || processing.value || !props.clientSecret,
      onClick: handlePayment
    }, () => processing.value ? 'Processing...' : 'Confirm Payment')
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
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Split Card Elements</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Three separate inputs for card number, expiry, and CVC.
          Provides more control over layout and styling than the unified CardElement.
        </p>
        <p class="text-sm mb-4">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>

        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <VueStripeProvider v-else :publishable-key="publishableKey">
          <VueStripeElements>
            <div class="bg-secondary rounded-lg p-6 mt-4">
              <!-- Card Number -->
              <div class="mb-4">
                <Label class="flex justify-between items-center mb-2">
                  <span>Card Number</span>
                  <span class="text-xs text-muted-foreground">{{ brandIcon }}</span>
                </Label>
                <VueStripeCardNumberElement
                  ref="cardNumberRef"
                  :options="elementStyle"
                  @ready="onCardNumberReady"
                  @change="onCardNumberChange"
                  @focus="onCardNumberFocus"
                />
                <div v-if="cardNumberError" class="text-destructive text-xs mt-1">{{ cardNumberError }}</div>
                <div v-else-if="cardNumberComplete" class="text-green-600 text-xs mt-1">Valid card number</div>
              </div>

              <!-- Expiry and CVC Row -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <Label class="mb-2">Expiration</Label>
                  <VueStripeCardExpiryElement
                    ref="cardExpiryRef"
                    :options="elementStyle"
                    @ready="onCardExpiryReady"
                    @change="onCardExpiryChange"
                    @focus="onCardExpiryFocus"
                  />
                  <div v-if="cardExpiryError" class="text-destructive text-xs mt-1">{{ cardExpiryError }}</div>
                  <div v-else-if="cardExpiryComplete" class="text-green-600 text-xs mt-1">Valid</div>
                </div>

                <div class="flex-1">
                  <Label class="mb-2">CVC</Label>
                  <VueStripeCardCvcElement
                    ref="cardCvcRef"
                    :options="elementStyle"
                    @ready="onCardCvcReady"
                    @change="onCardCvcChange"
                    @focus="onCardCvcFocus"
                  />
                  <div v-if="cardCvcError" class="text-destructive text-xs mt-1">{{ cardCvcError }}</div>
                  <div v-else-if="cardCvcComplete" class="text-green-600 text-xs mt-1">Valid</div>
                </div>
              </div>

              <!-- Status -->
              <div class="flex gap-4 justify-center bg-card rounded-md p-3 mt-4">
                <span :class="['text-sm', cardNumberComplete ? 'text-green-600 font-medium' : 'text-muted-foreground']">
                  Number {{ cardNumberComplete ? '✓' : '○' }}
                </span>
                <span :class="['text-sm', cardExpiryComplete ? 'text-green-600 font-medium' : 'text-muted-foreground']">
                  Expiry {{ cardExpiryComplete ? '✓' : '○' }}
                </span>
                <span :class="['text-sm', cardCvcComplete ? 'text-green-600 font-medium' : 'text-muted-foreground']">
                  CVC {{ cardCvcComplete ? '✓' : '○' }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 mt-4 flex-wrap">
                <Button size="sm" variant="secondary" @click="focusCardNumber">
                  Focus Number
                </Button>
                <Button size="sm" variant="secondary" @click="clearAll">
                  Clear All
                </Button>
                <Button
                  size="sm"
                  :variant="showPaymentSection ? 'default' : 'secondary'"
                  @click="showPaymentSection = !showPaymentSection"
                >
                  {{ showPaymentSection ? 'Hide Payment' : 'Test Payment' }}
                </Button>
              </div>

              <!-- Payment Mode: Client Secret Form -->
              <div v-if="showSecretForm" class="bg-card rounded-lg p-5 mt-4">
                <h4 class="font-semibold mb-3">Enter Client Secret</h4>
                <p class="text-muted-foreground text-sm mb-4">
                  To test payment confirmation, you need a <code>client_secret</code> from a PaymentIntent.
                </p>

                <div class="mb-4">
                  <Label class="mb-2">Client Secret</Label>
                  <Input
                    v-model="localClientSecret"
                    type="text"
                    placeholder="pi_xxx_secret_xxx"
                    class="font-mono"
                  />
                </div>

                <div class="border-t pt-4 mt-4">
                  <h5 class="font-medium text-sm mb-2">How to get a Client Secret:</h5>
                  <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
                    <li>Go to <a href="https://dashboard.stripe.com/test/payments" target="_blank" class="text-primary hover:underline">Stripe Dashboard → Payments</a></li>
                    <li>Click <strong>"+ Create"</strong> → <strong>"Create payment"</strong></li>
                    <li>Enter an amount (e.g., $10.00)</li>
                    <li>Copy the <code>client_secret</code> from the response</li>
                  </ol>
                  <p class="text-muted-foreground text-sm mt-2">
                    The client secret looks like: <code>pi_xxx_secret_xxx</code>
                  </p>
                </div>
              </div>

              <!-- Payment Mode: Ready to Pay -->
              <div v-else-if="showPaymentSection && activeClientSecret" class="mt-4">
                <div class="flex items-center gap-3 p-3 bg-info/10 border border-info rounded-md flex-wrap">
                  <span class="text-sm font-medium text-info">Client Secret:</span>
                  <code class="font-mono text-xs bg-card px-2 py-0.5 rounded flex-1 min-w-0 truncate">{{ activeClientSecret.slice(0, 15) }}...{{ activeClientSecret.slice(-8) }}</code>
                  <Button size="sm" variant="ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
                    Clear
                  </Button>
                </div>

                <div class="flex gap-2 mt-3">
                  <PaymentButton
                    v-if="cardNumberRef?.element"
                    :client-secret="activeClientSecret"
                    :card-complete="allComplete"
                    :card-number-element="cardNumberRef.element"
                    @payment-success="handlePaymentSuccess"
                    @payment-error="handlePaymentError"
                    @payment-processing="handlePaymentProcessing"
                  />
                  <Button
                    v-if="paymentStatus !== 'idle'"
                    size="sm"
                    variant="secondary"
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
                  Use test card <code>4242 4242 4242 4242</code> with any future date and CVC.
                  <br><small>For split elements, Stripe collects data from all three fields when you pass the cardNumber element.</small>
                </p>
              </div>
            </div>
          </VueStripeElements>
        </VueStripeProvider>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log">
          <div v-if="eventLog.length === 0" class="text-muted-foreground italic">
            Interact with the card fields to see events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1 text-sm">
            <span class="text-muted-foreground">{{ entry.time }}</span>
            <span class="font-medium text-primary">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-muted-foreground">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>

<style scoped>
/* Override default element styles */
:deep(.vue-stripe-cardNumber-element-mount),
:deep(.vue-stripe-cardExpiry-element-mount),
:deep(.vue-stripe-cardCvc-element-mount) {
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  background: hsl(var(--card));
  transition: all 0.15s ease;
}

:deep(.vue-stripe-cardNumber-element-mount:focus-within),
:deep(.vue-stripe-cardExpiry-element-mount:focus-within),
:deep(.vue-stripe-cardCvc-element-mount:focus-within) {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
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
  .flex.gap-4 {
    flex-direction: column;
  }
}
</style>
