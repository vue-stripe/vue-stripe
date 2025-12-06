<script setup lang="ts">
import { ref, inject, computed, defineComponent, h } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  useSetupIntent,
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
  Badge,
} from '@/components/ui'

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

    return () => h('div', { class: 'mt-5' }, [
      h('div', { class: 'flex items-center gap-2 p-2 bg-secondary rounded-sm text-sm mb-3' }, [
        h('span', { class: 'text-muted-foreground' }, 'useSetupIntent state:'),
        h('span', { class: loading.value ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium' },
          loading.value ? 'Processing...' : 'Ready'),
        error.value ? h('span', { class: 'text-destructive ml-auto' }, error.value) : null
      ]),
      h(Button, {
        class: 'w-full',
        size: 'lg',
        disabled: !props.setupComplete || loading.value,
        onClick: handleSubmit
      }, () => loading.value ? 'Saving Card...' : 'Save Card'),
      h('p', { class: 'text-muted-foreground text-sm mt-3 text-center' }, [
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
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>useSetupIntent</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Save a payment method for future use without charging the customer.
          This is used for subscriptions, saved cards, and pay-later flows.
        </p>
        <p class="text-sm mb-4">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>

        <!-- Warning if no publishable key -->
        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this composable.
          </AlertDescription>
        </Alert>

        <!-- Setup Secret Form -->
        <div v-else-if="showSecretForm" class="bg-secondary rounded-lg p-5 mt-4">
          <h4 class="font-semibold mb-2">Enter Setup Secret</h4>
          <p class="text-muted-foreground text-sm mb-4">A SetupIntent is required to save a payment method.</p>

          <div class="mb-4">
            <Label class="mb-2">Setup Secret</Label>
            <Input
              v-model="localSetupSecret"
              type="text"
              placeholder="seti_xxx_secret_xxx"
              class="font-mono"
            />
          </div>

          <div class="bg-card rounded-md border p-4 mt-4">
            <h5 class="font-medium text-sm mb-2">How to get a Setup Secret:</h5>
            <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
              <li>Create a SetupIntent via the Stripe API or Dashboard</li>
              <li>
                <strong>Quick method with cURL:</strong>
                <pre class="bg-slate-900 text-slate-100 p-3 rounded text-xs mt-2 overflow-x-auto">curl https://api.stripe.com/v1/setup_intents \
  -u sk_test_YOUR_SECRET_KEY: \
  -d "payment_method_types[]"=card</pre>
              </li>
              <li>Copy the <code>client_secret</code> from the response</li>
            </ol>
            <p class="text-muted-foreground text-sm mt-2">
              The setup secret looks like: <code>seti_xxx_secret_xxx</code>
            </p>
          </div>
        </div>

        <!-- Setup Element -->
        <div v-else class="mt-4">
          <!-- Success State -->
          <div v-if="setupStatus === 'succeeded'">
            <Alert variant="success">
              <AlertDescription>
                <h4 class="font-semibold mb-2">Card Saved Successfully!</h4>
                <p>The payment method has been attached and can be used for future payments.</p>
              </AlertDescription>
            </Alert>

            <div class="bg-secondary rounded-md p-4 mt-4">
              <h5 class="text-sm text-muted-foreground uppercase tracking-wide mb-3">SetupIntent Details</h5>
              <div class="space-y-2">
                <div class="flex items-center gap-3 py-2 border-b">
                  <span class="text-muted-foreground text-sm min-w-[120px]">ID:</span>
                  <code class="text-sm">{{ savedSetupIntent?.id }}</code>
                </div>
                <div class="flex items-center gap-3 py-2 border-b">
                  <span class="text-muted-foreground text-sm min-w-[120px]">Status:</span>
                  <Badge variant="success">{{ savedSetupIntent?.status }}</Badge>
                </div>
                <div class="flex items-center gap-3 py-2">
                  <span class="text-muted-foreground text-sm min-w-[120px]">Payment Method:</span>
                  <code class="text-sm">{{ savedSetupIntent?.payment_method }}</code>
                </div>
              </div>
            </div>

            <Button variant="secondary" class="mt-4" @click="resetForm">
              Save Another Card
            </Button>
          </div>

          <!-- Form State -->
          <template v-else>
            <!-- Show current secret and allow clearing -->
            <div class="flex items-center gap-3 p-3 bg-info/10 border border-info rounded-md flex-wrap">
              <span class="text-sm font-medium text-info">Setup Secret:</span>
              <code class="font-mono text-xs bg-card px-2 py-0.5 rounded flex-1 min-w-0 truncate">{{ setupSecret.slice(0, 15) }}...{{ setupSecret.slice(-8) }}</code>
              <Button size="sm" variant="ghost" @click="localSetupSecret = ''" title="Clear and enter new secret">
                Clear
              </Button>
            </div>

            <div class="p-5 rounded-lg mt-4 bg-card border">
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
            <Alert v-if="setupError" variant="destructive" class="mt-4">
              <AlertDescription>{{ setupError }}</AlertDescription>
            </Alert>
          </template>
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
            Interact with the element to see events...
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
