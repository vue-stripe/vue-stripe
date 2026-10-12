<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueStripeProvider, VueStripeCheckoutFormProvider } from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label
} from '@/components/ui'
import CheckoutFormPanel from '@/components/checkout/CheckoutFormPanel.vue'
import { apiUrl, createCheckoutSession } from '@/lib/backend'

const route = useRoute()
const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
const publishableKey = computed(() => stripeConfig?.publishableKey || '')

const layout = ref<'expanded' | 'compact'>('expanded')
const currencySelector = ref(false)

// What the provider gets: a Promise from the backend, or a pasted client secret.
const clientSecret = ref<string | Promise<string> | null>(null)
const pastedSecret = ref('')
const setupError = ref<string | null>(null)
const returnedSessionId = ref<string | null>(null)

// Stripe sends redirect-based payment methods back here with the session ID.
onMounted(() => {
  const id = route.query['session_id']
  if (typeof id === 'string') returnedSessionId.value = id
})

const eventLog = ref<Array<{ time: string; event: string; data?: string | undefined }>>([])
const logEvent = (event: string, data?: string) => {
  eventLog.value.unshift({ time: new Date().toLocaleTimeString(), event, data })
  if (eventLog.value.length > 20) eventLog.value.pop()
}

const startWithBackend = () => {
  setupError.value = null
  const returnUrl = `${window.location.origin}${route.path}?session_id={CHECKOUT_SESSION_ID}`
  const request = createCheckoutSession({
    amount: 2500,
    currency: 'usd',
    productName: 'Playground order',
    uiMode: 'form',
    returnUrl
  }).then((result) => {
    if (!result.clientSecret) throw new Error('The backend did not return a client secret')
    logEvent('session-created', result.sessionId)
    return result.clientSecret
  })
  request.catch((err: unknown) => {
    setupError.value = err instanceof Error ? err.message : String(err)
  })
  // The provider takes the Promise, so the form mounts while the session is created.
  clientSecret.value = request
}

const startWithPasted = () => {
  setupError.value = null
  clientSecret.value = pastedSecret.value.trim()
}

const reset = () => {
  clientSecret.value = null
  setupError.value = null
  eventLog.value = []
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Alert v-if="returnedSessionId" variant="info">
      <AlertDescription>
        Returned from a redirect for session <code>{{ returnedSessionId }}</code
        >. Check its status on your server with <code>stripe.checkout.sessions.retrieve()</code>.
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Checkout Form (beta)</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Stripe's complete checkout form on your page, backed by a Checkout Session (<code
            >ui_mode: 'form'</code
          >): <code>VueStripeCheckoutFormProvider</code> runs Stripe's Checkout Form SDK,
          <code>VueStripeCheckoutForm</code> renders the form and
          <code>useCheckoutForm()</code> confirms it.
        </p>
        <Alert variant="warning" class="mb-4">
          <AlertDescription>
            Beta: requires Stripe access. Without it, Stripe reports an error below instead of
            rendering the form.
          </AlertDescription>
        </Alert>

        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <!-- Setup -->
        <div v-else-if="!clientSecret" class="bg-secondary border rounded-lg p-5 mt-4 space-y-5">
          <div class="space-y-2 text-sm">
            <label class="flex items-center gap-2">
              Layout
              <select v-model="layout" class="rounded border px-2 py-1" data-test="layout">
                <option value="expanded">expanded</option>
                <option value="compact">compact (Stripe private preview)</option>
              </select>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="currencySelector" type="checkbox" data-test="use-currency-selector" />
              Currency Selector (Adaptive Pricing) under the Form provider
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Button data-test="create-session" @click="startWithBackend">
              Create a session on the backend
            </Button>
            <span class="text-muted-foreground text-xs font-mono">
              POST {{ apiUrl }}/api/checkout-session { uiMode: 'form' }
            </span>
          </div>

          <div class="space-y-2">
            <Label for="cf-secret">Or paste a Checkout Session client secret</Label>
            <div class="flex gap-2">
              <Input
                id="cf-secret"
                v-model="pastedSecret"
                placeholder="cs_test_..._secret_..."
                class="font-mono flex-1"
              />
              <Button variant="outline" :disabled="!pastedSecret.trim()" @click="startWithPasted">
                Start
              </Button>
            </div>
          </div>
        </div>

        <!-- Checkout -->
        <div v-else class="mt-4">
          <div class="mb-4 flex justify-end">
            <Button size="sm" variant="ghost" @click="reset">Start over</Button>
          </div>

          <Alert v-if="setupError" variant="destructive">
            <AlertDescription>{{ setupError }}</AlertDescription>
          </Alert>

          <VueStripeProvider v-else :publishable-key="publishableKey">
            <VueStripeCheckoutFormProvider
              :client-secret="clientSecret"
              @ready="logEvent('ready', 'session actions loaded')"
              @change="(s) => logEvent('change', `${s.total.total.amount}, ${s.status.type}`)"
              @error="(e) => logEvent('error', e)"
            >
              <template #loading
                ><p class="text-muted-foreground">Initializing the Checkout Form...</p></template
              >
              <template #error="{ error }">
                <p class="text-destructive" data-test="provider-error">{{ error }}</p>
              </template>
              <CheckoutFormPanel
                :layout="layout"
                :currency-selector="currencySelector"
                @log="logEvent"
              />
            </VueStripeCheckoutFormProvider>
          </VueStripeProvider>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log" data-test="event-log">
          <div v-if="eventLog.length === 0" class="text-muted-foreground italic">
            Start a checkout to see provider and form events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1 text-sm">
            <span class="text-slate-400">{{ entry.time }}</span>
            <span class="font-medium text-blue-400">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-slate-300">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
