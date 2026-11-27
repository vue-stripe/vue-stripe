<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeEmbeddedCheckout,
  useStripeCheckout
} from '@vue-stripe/vue-stripe'
import CheckoutResult from './CheckoutResult.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const apiUrl = import.meta.env.VITE_API_URL ?? ''
const here = window.location.origin + window.location.pathname

// Stripe sends the customer back here: ?session_id=... after paying, ?canceled=1 from hosted Checkout.
const query = new URLSearchParams(window.location.search)
const returnedSessionId = query.get('session_id')
const canceled = query.has('canceled')

const mode = ref<'choose' | 'embedded'>('choose')
const error = ref('')
const { redirectToUrl, loading: redirecting } = useStripeCheckout()

async function createSession(options: Record<string, string>) {
  const response = await fetch(`${apiUrl}/api/checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data as { url: string | null; clientSecret: string | null }
}

// Option 1: hosted Checkout. Redirect to Stripe's page; no Stripe.js needed.
async function payOnStripe() {
  error.value = ''
  try {
    const { url } = await createSession({
      uiMode: 'hosted',
      successUrl: `${here}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${here}?canceled=1`
    })
    redirectToUrl(url!)
  } catch (e) {
    error.value = `Could not start Checkout: ${(e as Error).message}`
  }
}

// Option 2: embedded Checkout. Stripe calls this when it creates the embedded page.
const fetchClientSecret = () =>
  createSession({
    uiMode: 'embedded_page',
    returnUrl: `${here}?session_id={CHECKOUT_SESSION_ID}`
  }).then((data) => data.clientSecret!)
</script>

<template>
  <main>
    <h1>Vue Stripe T-shirt: $20.00</h1>

    <CheckoutResult v-if="returnedSessionId" :session-id="returnedSessionId" />

    <template v-else-if="mode === 'choose'">
      <p v-if="canceled">Checkout canceled. You can try again.</p>
      <button type="button" :disabled="redirecting" @click="payOnStripe">
        Pay on Stripe's page
      </button>
      <button type="button" class="secondary" @click="mode = 'embedded'">Pay on this page</button>
      <p v-if="error" class="error">{{ error }}</p>
    </template>

    <VueStripeProvider v-else :publishable-key="publishableKey">
      <VueStripeEmbeddedCheckout :fetch-client-secret="fetchClientSecret">
        <template #loading>Loading Checkout…</template>
        <template #error="{ error: message }">
          <p class="error">Checkout could not load: {{ message }}</p>
        </template>
      </VueStripeEmbeddedCheckout>
    </VueStripeProvider>
  </main>
</template>
