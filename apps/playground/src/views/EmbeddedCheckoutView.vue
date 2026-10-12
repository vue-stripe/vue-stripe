<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueStripeProvider, VueStripeEmbeddedCheckout } from '@vue-stripe/vue-stripe'
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
import { apiUrl, createCheckoutSession } from '@/lib/backend'

const route = useRoute()
const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// What the component gets: a fetchClientSecret function (backend) or a pasted secret.
const source = ref<'backend' | 'pasted' | null>(null)
const pastedSecret = ref('')
const clientSecret = ref('')
const returnedSessionId = ref<string | null>(null)
const completed = ref(false)

// Stripe redirects back here after payment with the session ID.
onMounted(() => {
  const id = route.query['session_id']
  if (typeof id === 'string') returnedSessionId.value = id
})

const eventLog = ref<Array<{ time: string; event: string; data?: string | undefined }>>([])
const logEvent = (event: string, data?: string) => {
  eventLog.value.unshift({ time: new Date().toLocaleTimeString(), event, data })
  if (eventLog.value.length > 20) eventLog.value.pop()
}

// Stripe calls this when it creates the embedded page.
const fetchClientSecret = async () => {
  const returnUrl = `${window.location.origin}${route.path}?session_id={CHECKOUT_SESSION_ID}`
  const result = await createCheckoutSession({
    amount: 2500,
    currency: 'usd',
    productName: 'Playground order',
    uiMode: 'embedded_page',
    returnUrl
  })
  if (!result.clientSecret) throw new Error('The backend did not return a client secret')
  logEvent('session-created', result.sessionId)
  return result.clientSecret
}

const startWithBackend = () => {
  completed.value = false
  source.value = 'backend'
}

const startWithPasted = () => {
  completed.value = false
  clientSecret.value = pastedSecret.value.trim()
  source.value = 'pasted'
}

const reset = () => {
  source.value = null
  clientSecret.value = ''
  completed.value = false
  eventLog.value = []
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Alert v-if="returnedSessionId" variant="info">
      <AlertDescription>
        Returned from Embedded Checkout for session <code>{{ returnedSessionId }}</code
        >. Check its status on your server with <code>stripe.checkout.sessions.retrieve()</code>.
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Embedded Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Stripe's prebuilt Checkout page inside this page (<code>ui_mode: 'embedded_page'</code>):
          <code>VueStripeEmbeddedCheckout</code> calls
          <code>stripe.createEmbeddedCheckoutPage()</code> and mounts it. Pay with
          <code>4242 4242 4242 4242</code>; Stripe redirects back here afterwards.
        </p>
        <p class="text-sm mb-4">
          <a
            href="https://vuestripe.com/guide/embedded-checkout"
            target="_blank"
            class="text-primary hover:underline"
          >
            Embedded Checkout guide →
          </a>
        </p>

        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <!-- Setup -->
        <div v-else-if="!source" class="bg-secondary border rounded-lg p-5 mt-4 space-y-5">
          <div class="flex flex-wrap items-center gap-3">
            <Button data-test="create-session" @click="startWithBackend">
              Create a session on the backend
            </Button>
            <span class="text-muted-foreground text-xs font-mono">
              POST {{ apiUrl }}/api/checkout-session { uiMode: 'embedded_page' }
            </span>
          </div>

          <div class="space-y-2">
            <Label for="ec-secret">Or paste a Checkout Session client secret</Label>
            <div class="flex gap-2">
              <Input
                id="ec-secret"
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

          <Alert v-if="completed" variant="info">
            <AlertDescription>Checkout Session completed (@complete).</AlertDescription>
          </Alert>

          <VueStripeProvider v-else :publishable-key="publishableKey">
            <VueStripeEmbeddedCheckout
              :client-secret="source === 'pasted' ? clientSecret : undefined"
              :fetch-client-secret="source === 'backend' ? fetchClientSecret : undefined"
              @ready="logEvent('ready', 'embedded page mounted')"
              @analytics="(e) => logEvent('analytics', e.eventType)"
              @complete="
                () => {
                  logEvent('complete')
                  completed = true
                }
              "
              @error="(e) => logEvent('error', e)"
            >
              <template #loading>
                <p class="text-muted-foreground">Creating the embedded checkout...</p>
              </template>
              <template #error="{ error }">
                <p class="text-destructive">{{ error }}</p>
              </template>
            </VueStripeEmbeddedCheckout>
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
            Start a checkout to see ready, analytics and complete events...
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
