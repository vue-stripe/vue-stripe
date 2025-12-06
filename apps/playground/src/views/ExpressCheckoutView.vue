<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeExpressCheckoutElement
} from '@vue-stripe/vue-stripe'
import type {
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent
} from '@stripe/stripe-js'
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
  Badge,
} from '@/components/ui'

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Local client secret state
const localClientSecret = ref('')
const clientSecret = computed(() => localClientSecret.value.trim())
const showSecretForm = computed(() => publishableKey.value && !clientSecret.value)

// Express checkout ref
const expressCheckoutRef = ref<InstanceType<typeof VueStripeExpressCheckoutElement> | null>(null)

// Track available wallets
const availableWallets = ref<string[]>([])
const isReady = ref(false)

// Event log
const eventLog = ref<Array<{ time: string; event: string; data: string | undefined }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 20) {
    eventLog.value.pop()
  }
}

// Options for the express checkout element
const expressCheckoutOptions = computed(() => ({
  buttonType: {
    applePay: 'buy' as const,
    googlePay: 'buy' as const
  },
  buttonTheme: {
    applePay: 'black' as const,
    googlePay: 'black' as const
  },
  layout: {
    maxColumns: 3,
    maxRows: 1
  }
}))

// Event handlers
const onReady = (event: StripeExpressCheckoutElementReadyEvent) => {
  isReady.value = true
  if (event.availablePaymentMethods) {
    const methods = Object.entries(event.availablePaymentMethods)
      .filter(([, available]) => available)
      .map(([method]) => method)
    availableWallets.value = methods
    logEvent('ready', `Available: ${methods.join(', ') || 'none'}`)
  } else {
    logEvent('ready', 'No payment methods available')
  }
}

const onClick = (event: StripeExpressCheckoutElementClickEvent) => {
  logEvent('click', `Wallet: ${event.expressPaymentType}`)
  // Resolve the event to continue with the payment sheet
  event.resolve({})
}

const onConfirm = (event: StripeExpressCheckoutElementConfirmEvent) => {
  logEvent('confirm', `Payment type: ${event.expressPaymentType}`)
  // In a real app, you would confirm the payment here
  console.info('Express checkout confirm event:', event)
}

const onCancel = () => {
  logEvent('cancel', 'User cancelled payment')
}

const onShippingAddressChange = (event: unknown) => {
  logEvent('shippingaddresschange', JSON.stringify(event))
}

const onShippingRateChange = (event: unknown) => {
  logEvent('shippingratechange', JSON.stringify(event))
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripeExpressCheckoutElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The Express Checkout Element displays wallet payment buttons like Apple Pay, Google Pay,
          and Link, enabling one-click checkout for customers with saved payment methods.
        </p>
        <p class="text-sm mb-4">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>

        <!-- Warning if no publishable key -->
        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <!-- Client Secret Form -->
        <div v-else-if="showSecretForm" class="bg-secondary rounded-lg p-5 mt-4">
          <h4 class="font-semibold mb-2">Enter Client Secret</h4>
          <p class="text-muted-foreground text-sm mb-4">The Express Checkout Element requires a <code>clientSecret</code> from a PaymentIntent.</p>

          <div class="mb-4">
            <Label class="mb-2">Client Secret</Label>
            <Input
              v-model="localClientSecret"
              type="text"
              placeholder="pi_xxx_secret_xxx"
              class="font-mono"
              :class="{ 'border-success': localClientSecret.includes('_secret_') }"
            />
          </div>

          <div class="bg-card rounded-md border p-4 mt-4">
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

        <!-- Configuration info -->
        <div v-if="publishableKey && clientSecret" class="mt-4">
          <h4 class="font-semibold mb-3">Configuration</h4>
          <div class="p-4 bg-secondary rounded-lg">
            <p class="text-muted-foreground text-sm">
              Express Checkout buttons are configured with <code>buy</code> button type and <code>black</code> theme.
              The actual availability of payment methods depends on:
            </p>
            <ul class="text-muted-foreground text-sm mt-2 pl-5 list-disc space-y-1">
              <li>Customer's device and browser (Apple Pay requires Safari on Apple devices)</li>
              <li>Whether the customer has a wallet set up</li>
              <li>Your Stripe Dashboard payment method settings</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card v-if="publishableKey && clientSecret">
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground text-sm mb-4">
          Wallet payment buttons will appear below if available on your device.
          Testing typically requires a real device with a configured wallet.
        </p>

        <!-- Show current secret and allow clearing -->
        <div class="flex items-center gap-3 p-3 bg-secondary rounded-md flex-wrap mb-4">
          <span class="text-sm text-muted-foreground">Client Secret:</span>
          <code class="font-mono text-xs bg-card px-2 py-0.5 rounded">{{ clientSecret.slice(0, 15) }}...{{ clientSecret.slice(-8) }}</code>
          <Button size="sm" variant="ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
            Clear
          </Button>
        </div>

        <div class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements :client-secret="clientSecret">
              <div class="bg-card rounded-md p-4 border min-h-[60px]">
                <VueStripeExpressCheckoutElement
                  ref="expressCheckoutRef"
                  :options="expressCheckoutOptions"
                  @ready="onReady"
                  @click="onClick"
                  @confirm="onConfirm"
                  @cancel="onCancel"
                  @shippingaddresschange="onShippingAddressChange"
                  @shippingratechange="onShippingRateChange"
                />
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <!-- Available Wallets Display -->
        <div class="bg-secondary rounded-lg p-4 mt-4">
          <h4 class="font-semibold text-sm mb-3">Available Payment Methods</h4>
          <div v-if="!isReady" class="text-muted-foreground text-sm">
            Loading available payment methods...
          </div>
          <div v-else-if="availableWallets.length > 0" class="flex gap-2 flex-wrap">
            <Badge
              v-for="wallet in availableWallets"
              :key="wallet"
              variant="success"
              class="capitalize"
            >
              {{ wallet }}
            </Badge>
          </div>
          <div v-else class="text-muted-foreground text-sm">
            <p>No wallet payment methods available on this device/browser.</p>
            <p class="text-sm mt-2">
              This is normal when testing. Express Checkout requires:
            </p>
            <ul class="text-sm mt-2 pl-5 list-disc space-y-1">
              <li>Apple Pay: Safari on macOS/iOS with Apple Wallet configured</li>
              <li>Google Pay: Chrome with Google Pay configured</li>
              <li>Link: Customer must have a Stripe Link account</li>
            </ul>
          </div>
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
          <div v-if="eventLog.length === 0" class="text-muted-foreground italic">
            Interact with the Express Checkout Element to see events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1 text-sm">
            <span class="text-muted-foreground">{{ entry.time }}</span>
            <span class="font-medium text-primary">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-muted-foreground break-words">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>
