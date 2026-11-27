<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from './PaymentForm.vue'
import PaymentStatus from './PaymentStatus.vue'

interface Plan {
  id: string
  name: string
  type: 'recurring' | 'one_time'
  price: { id: string; amount: number; currency: string; interval: string | null }
}

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const apiUrl = import.meta.env.VITE_API_URL ?? ''

// Payment methods that leave the page come back with the invoice payment's client secret.
const returnedClientSecret = new URLSearchParams(window.location.search).get(
  'payment_intent_client_secret'
)

const plans = ref<Plan[]>([])
const priceId = ref('')
const email = ref('')
const clientSecret = ref('')
const error = ref('')
const starting = ref(false)

const selected = computed(() => plans.value.find((plan) => plan.price.id === priceId.value))

async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body && JSON.stringify(body)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data
}

function formatPrice(plan: Plan) {
  const amount = (plan.price.amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: plan.price.currency
  })
  return `${amount} / ${plan.price.interval}`
}

onMounted(async () => {
  if (returnedClientSecret) return
  try {
    const { products } = await api<{ products: Plan[] }>('/api/products')
    plans.value = products.filter((product) => product.type === 'recurring')
  } catch (e) {
    error.value = `Could not load the plans: ${(e as Error).message}`
  }
})

// Create the subscription on the server, then pay its first invoice with the Payment Element.
async function subscribe() {
  error.value = ''
  starting.value = true
  try {
    const data = await api<{ clientSecret: string | null }>('/api/subscription', {
      priceId: priceId.value,
      customerEmail: email.value
    })
    if (!data.clientSecret) throw new Error('The subscription has no invoice to pay')
    clientSecret.value = data.clientSecret
  } catch (e) {
    error.value = `Could not start the subscription: ${(e as Error).message}`
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <main>
    <h1>Subscribe</h1>
    <VueStripeProvider :publishable-key="publishableKey">
      <PaymentStatus v-if="returnedClientSecret" :client-secret="returnedClientSecret" />

      <template v-else-if="clientSecret && selected">
        <p>{{ selected.name }}: {{ formatPrice(selected) }}</p>
        <VueStripeElements :client-secret="clientSecret">
          <PaymentForm :client-secret="clientSecret" :label="`Pay ${formatPrice(selected)}`" />
        </VueStripeElements>
      </template>

      <form v-else @submit.prevent="subscribe">
        <label v-for="plan in plans" :key="plan.price.id" class="plan">
          <input v-model="priceId" type="radio" name="plan" :value="plan.price.id" />
          {{ plan.name }}: {{ formatPrice(plan) }}
        </label>
        <label>
          Email
          <input v-model="email" type="email" required placeholder="you@example.com" />
        </label>
        <button type="submit" :disabled="!priceId || starting">Continue to payment</button>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
    </VueStripeProvider>
  </main>
</template>
