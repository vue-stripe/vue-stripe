<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueStripeProvider, VueStripeCheckoutElementsProvider } from '@vue-stripe/vue-stripe'
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
import CheckoutSessionForm from '@/components/checkout/CheckoutSessionForm.vue'
import { apiUrl, createCheckoutSession } from '@/lib/backend'

const route = useRoute()
const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Options for the session and the Stripe instance.
const useTaxId = ref(false)
const useAdaptivePricing = ref(true)
const useContactDetails = ref(false)
const useTerms = ref(false)
const useLinkSignup = ref(false)
// Link Signup is a Stripe beta: its flag goes on the Stripe instance (VueStripeProvider
// `betas`). Tax ID needs no flag; the Terms element is gated on the Stripe account.
const betas = computed(() => {
  const flags = [...(useLinkSignup.value ? ['elements_link_signup_beta_1'] : [])]
  return flags.length ? flags : undefined
})

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
    uiMode: 'elements',
    returnUrl,
    taxIdCollection: useTaxId.value
  }).then((result) => {
    if (!result.clientSecret) throw new Error('The backend did not return a client secret')
    logEvent('session-created', result.sessionId)
    return result.clientSecret
  })
  request.catch((err: unknown) => {
    setupError.value = err instanceof Error ? err.message : String(err)
  })
  // The provider takes the Promise, so the elements mount while the session is created.
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
        <CardTitle>Custom Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Your own checkout page on a Checkout Session (<code>ui_mode: 'elements'</code>):
          <code>VueStripeCheckoutElementsProvider</code> runs Stripe's Checkout Elements SDK and
          <code>useCheckoutSession()</code> drives the session. Stripe keeps totals, tax and
          currency on the session.
        </p>
        <p class="text-sm mb-4">
          <a
            href="https://vuestripe.com/guide/custom-checkout"
            target="_blank"
            class="text-primary hover:underline"
          >
            Custom Checkout guide →
          </a>
        </p>

        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <!-- Setup -->
        <div v-else-if="!clientSecret" class="bg-secondary border rounded-lg p-5 mt-4 space-y-5">
          <div class="space-y-2 text-sm">
            <label class="flex items-center gap-2">
              <input v-model="useAdaptivePricing" type="checkbox" />
              Adaptive Pricing (shows the Currency Selector when Stripe offers local currencies)
            </label>
            <label class="flex items-center gap-2">
              <input v-model="useTaxId" type="checkbox" data-test="use-tax-id" />
              Tax ID element (real-time verification needs Stripe Tax)
            </label>
            <label class="flex items-center gap-2">
              <input v-model="useContactDetails" type="checkbox" data-test="use-contact-details" />
              Contact Details element (replaces the email input)
            </label>
            <label class="flex items-center gap-2">
              <input v-model="useTerms" type="checkbox" data-test="use-terms" />
              Terms element (Stripe beta; your account needs access)
            </label>
            <label class="flex items-center gap-2">
              <input v-model="useLinkSignup" type="checkbox" data-test="use-link-signup" />
              Link Signup element (Stripe beta; adds the <code>elements_link_signup_beta_1</code>
              flag)
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Button data-test="create-session" @click="startWithBackend">
              Create a session on the backend
            </Button>
            <span class="text-muted-foreground text-xs font-mono">
              POST {{ apiUrl }}/api/checkout-session { uiMode: 'elements' }
            </span>
          </div>

          <div class="space-y-2">
            <Label for="cs-secret">Or paste a Checkout Session client secret</Label>
            <div class="flex gap-2">
              <Input
                id="cs-secret"
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

          <VueStripeProvider v-else :publishable-key="publishableKey" :betas="betas">
            <VueStripeCheckoutElementsProvider
              :client-secret="clientSecret"
              :adaptive-pricing="{ allowed: useAdaptivePricing }"
              @ready="logEvent('ready', 'session actions loaded')"
              @change="
                (s) => logEvent('change', `${s.total.total.amount}, canConfirm ${s.canConfirm}`)
              "
              @error="(e) => logEvent('error', e)"
            >
              <template #loading
                ><p class="text-muted-foreground">Initializing checkout...</p></template
              >
              <template #error="{ error }">
                <p class="text-destructive">{{ error }}</p>
              </template>
              <CheckoutSessionForm
                :tax-id="useTaxId"
                :contact-details="useContactDetails"
                :terms="useTerms"
                :link-signup="useLinkSignup"
                @log="logEvent"
              />
            </VueStripeCheckoutElementsProvider>
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
            Start a checkout to see provider events and canConfirm changes...
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
