<script setup lang="ts">
import { ref, inject, computed, watch, defineComponent, h } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'
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

// Child component for payment submission (needs to be inside VueStripeElements)
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

    return () => h('div', { class: 'mt-5' }, [
      h(Button, {
        class: 'w-full',
        size: 'lg',
        disabled: !props.paymentComplete || processing.value,
        onClick: handleSubmit
      }, () => processing.value ? 'Processing...' : 'Pay Now'),
      h('p', { class: 'text-muted-foreground text-sm mt-3 text-center' }, [
        'Use test card ',
        h('code', { class: 'bg-muted px-1.5 py-0.5 rounded text-xs' }, '4242 4242 4242 4242'),
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
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripePaymentElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The Payment Element is Stripe's recommended all-in-one payment UI.
          It automatically handles cards, wallets, bank transfers, and more.
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
          <p class="text-muted-foreground text-sm mb-4">The Payment Element requires a <code class="bg-muted px-1.5 py-0.5 rounded text-xs">clientSecret</code> from a PaymentIntent.</p>

          <div class="space-y-2">
            <Label for="client-secret">Client Secret</Label>
            <Input
              id="client-secret"
              v-model="localClientSecret"
              type="text"
              placeholder="pi_xxx_secret_xxx"
              class="font-mono"
            />
          </div>

          <div class="bg-card rounded-md border p-4 mt-4">
            <h5 class="font-medium text-sm mb-2">How to get a Client Secret:</h5>
            <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
              <li>Go to <a href="https://dashboard.stripe.com/test/payments" target="_blank" class="text-primary hover:underline">Stripe Dashboard → Payments</a></li>
              <li>Click <strong>"+ Create"</strong> → <strong>"Create payment"</strong></li>
              <li>Enter an amount (e.g., $10.00)</li>
              <li>Copy the <code class="bg-muted px-1.5 py-0.5 rounded text-xs">client_secret</code> from the response</li>
            </ol>
          </div>
        </div>

        <!-- Payment Element -->
        <div v-else class="mt-4 space-y-4">
          <!-- Show current secret and allow clearing -->
          <div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex-wrap">
            <span class="text-sm font-medium text-green-700 dark:text-green-400">Client Secret:</span>
            <code class="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded flex-1 min-w-0 truncate">{{ clientSecret.slice(0, 15) }}...{{ clientSecret.slice(-8) }}</code>
            <Button size="sm" variant="ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
              Clear
            </Button>
          </div>

          <!-- Configuration Options -->
          <Card>
            <CardContent class="pt-6">
              <div class="space-y-6">
                <!-- Layout Selection -->
                <div class="space-y-3">
                  <Label class="text-xs uppercase tracking-wide text-muted-foreground">Layout Style</Label>
                  <Tabs v-model="selectedLayout" class="w-full">
                    <TabsList class="grid w-full grid-cols-3">
                      <TabsTrigger value="tabs">Tabs</TabsTrigger>
                      <TabsTrigger value="accordion">Accordion</TabsTrigger>
                      <TabsTrigger value="auto">Auto</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <!-- Theme Selection -->
                <div class="space-y-3">
                  <Label class="text-xs uppercase tracking-wide text-muted-foreground">Theme</Label>
                  <Tabs v-model="selectedTheme" class="w-full">
                    <TabsList class="grid w-full grid-cols-3">
                      <TabsTrigger value="stripe">Stripe</TabsTrigger>
                      <TabsTrigger value="night">Night</TabsTrigger>
                      <TabsTrigger value="flat">Flat</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <!-- Wallets Toggle -->
                <div class="space-y-3">
                  <Label class="text-xs uppercase tracking-wide text-muted-foreground">Digital Wallets</Label>
                  <Tabs :model-value="showWallets ? 'show' : 'hide'" @update:model-value="showWallets = $event === 'show'" class="w-full">
                    <TabsList class="grid w-full grid-cols-2">
                      <TabsTrigger value="show">Show Wallets</TabsTrigger>
                      <TabsTrigger value="hide">Hide Wallets</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <!-- Business Name -->
                <div class="space-y-2">
                  <Label for="business-name" class="text-xs uppercase tracking-wide text-muted-foreground">Business Name (optional)</Label>
                  <Input
                    id="business-name"
                    v-model="businessName"
                    type="text"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Payment Element Container -->
          <div
            :class="[
              'p-5 rounded-lg transition-colors',
              selectedTheme === 'stripe' ? 'bg-white dark:bg-slate-50 border' : '',
              selectedTheme === 'night' ? 'bg-[#1a1a2e] border border-slate-700' : '',
              selectedTheme === 'flat' ? 'bg-secondary border' : ''
            ]"
          >
            <VueStripeProvider :publishable-key="publishableKey">
              <VueStripeElements
                :key="elementKey"
                :client-secret="clientSecret"
                :options="{ appearance }"
              >
                <VueStripePaymentElement
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
              </VueStripeElements>
            </VueStripeProvider>
          </div>

          <!-- Status display -->
          <Alert v-if="paymentStatus === 'succeeded'" variant="success">
            <AlertDescription>Payment successful! Check your Stripe Dashboard.</AlertDescription>
          </Alert>
          <Alert v-if="paymentError" variant="destructive">
            <AlertDescription>{{ paymentError }}</AlertDescription>
          </Alert>
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
          <div v-if="eventLog.length === 0" class="text-muted-foreground italic text-center py-4">
            Interact with the Payment Element to see events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1.5 text-sm border-b border-border last:border-0">
            <span class="text-muted-foreground font-mono text-xs">{{ entry.time }}</span>
            <span class="font-medium text-primary">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-muted-foreground">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>
