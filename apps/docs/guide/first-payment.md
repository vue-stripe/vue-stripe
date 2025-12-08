# Your First Payment

Let's build a complete payment form step by step. By the end, you'll understand how the pieces fit together.

## What We're Building

A payment form that:
1. Loads Stripe.js securely
2. Shows Stripe's Payment Element
3. Handles the payment submission

## Prerequisites

Before we start, make sure you have:
- Vue Stripe installed ([see Installation](/guide/installation))
- A backend endpoint that creates PaymentIntents

::: tip Don't have a backend yet?
You can use the [Stripe Dashboard](https://dashboard.stripe.com/test/payments) to manually create a PaymentIntent and copy its client secret for testing.
:::

## Step 1: Set Up the Provider

Every payment form starts with `VueStripeProvider`. This component loads Stripe.js and makes it available to all child components.

```vue
<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <p>Stripe is loading...</p>
  </VueStripeProvider>
</template>
```

**What's happening:**
- `VueStripeProvider` loads Stripe.js asynchronously
- While loading, it shows a loading state
- Once ready, it renders the default slot content
- The Stripe instance is now available to all descendants

## Step 2: Add the Elements Container

`VueStripeElements` creates a Stripe Elements instance. This requires a `clientSecret` from a PaymentIntent.

```vue{2,10-12}
<script setup>
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('') // We'll fetch this from our backend

// Fetch client secret when component mounts
onMounted(async () => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1000 }) // $10.00
  })
  const data = await response.json()
  clientSecret.value = data.clientSecret
})
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
      <p>Elements loaded!</p>
    </VueStripeElements>
    <p v-else>Loading payment form...</p>
  </VueStripeProvider>
</template>
```

**What's happening:**
- We fetch a `clientSecret` from our backend
- `VueStripeElements` only renders once we have the secret
- It creates an Elements instance configured for this payment

## Step 3: Add the Payment Element

`VueStripePaymentElement` renders Stripe's all-in-one payment UI:

```vue{3,19}
<script setup>
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

onMounted(async () => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ amount: 1000 })
  })
  const data = await response.json()
  clientSecret.value = data.clientSecret
})
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
      <VueStripePaymentElement />
      <button>Pay $10.00</button>
    </VueStripeElements>
    <p v-else>Loading...</p>
  </VueStripeProvider>
</template>
```

At this point, you should see a payment form with credit card fields (and other payment methods if enabled in your Stripe dashboard).

## Step 4: Handle the Payment

Now let's wire up the submit button. We capture the Stripe and Elements instances via events:

```vue{4-6,18-24,26-42,49,51}
<script setup>
import { ref, onMounted } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(false)
const errorMessage = ref('')

// ... fetch clientSecret in onMounted ...

// Capture instances from component events
const stripeInstance = ref(null)
const elementsInstance = ref(null)

const onStripeLoad = (stripe) => {
  stripeInstance.value = stripe
}

const onElementsReady = (elements) => {
  elementsInstance.value = elements
}

const handleSubmit = async () => {
  if (!stripeInstance.value || !elementsInstance.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  const { error } = await stripeInstance.value.confirmPayment({
    elements: elementsInstance.value,
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    }
  })

  if (error) {
    // Show error to customer
    errorMessage.value = error.message || 'Payment failed'
    loading.value = false
  }
  // If successful, Stripe redirects to return_url
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret" @ready="onElementsReady">
      <form @submit.prevent="handleSubmit">
        <VueStripePaymentElement />

        <div v-if="errorMessage" class="error">
          {{ errorMessage }}
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Processing...' : 'Pay $10.00' }}
        </button>
      </form>
    </VueStripeElements>
    <p v-else>Loading payment form...</p>
  </VueStripeProvider>
</template>
```

## Complete Example

Here's the full payment form:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(false)
const errorMessage = ref('')

// Capture instances from component events
const stripeInstance = ref<Stripe | null>(null)
const elementsInstance = ref<StripeElements | null>(null)

const onStripeLoad = (stripe: Stripe) => {
  stripeInstance.value = stripe
}

const onElementsReady = (elements: StripeElements) => {
  elementsInstance.value = elements
}

onMounted(async () => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 })
    })
    const data = await response.json()
    clientSecret.value = data.clientSecret
  } catch (err) {
    errorMessage.value = 'Failed to initialize payment'
  }
})

const handleSubmit = async () => {
  if (!stripeInstance.value || !elementsInstance.value) return

  loading.value = true
  errorMessage.value = ''

  const { error } = await stripeInstance.value.confirmPayment({
    elements: elementsInstance.value,
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
    loading.value = false
  }
}
</script>

<template>
  <div class="payment-form">
    <h2>Complete Your Payment</h2>

    <VueStripeProvider :publishable-key="publishableKey" @load="onStripeLoad">
      <VueStripeElements
        v-if="clientSecret"
        :client-secret="clientSecret"
        @ready="onElementsReady"
      >
        <form @submit.prevent="handleSubmit">
          <VueStripePaymentElement />

          <div v-if="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="loading">
            {{ loading ? 'Processing...' : 'Pay $10.00' }}
          </button>
        </form>
      </VueStripeElements>

      <template v-else>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <p v-else>Loading payment form...</p>
      </template>
    </VueStripeProvider>
  </div>
</template>

<style scoped>
.payment-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

button {
  background: #635bff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  font-size: 14px;
}
</style>
```

## Testing Your Payment

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

Use any future expiry date and any 3-digit CVC.

## What's Next?

Now that you have a working payment form, let's understand how the pieces work together:

- [Understanding the Architecture](/guide/architecture) - Learn about StripeProvider, VueStripeElements, and the data flow
- [Choosing Your Approach](/guide/approaches) - Decide between Payment Element, Card Element, or Checkout
