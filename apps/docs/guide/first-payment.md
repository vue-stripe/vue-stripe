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

Every payment form starts with `StripeProvider`. This component loads Stripe.js and makes it available to all child components.

```vue
<script setup>
import { StripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <p>Stripe is loading...</p>
  </StripeProvider>
</template>
```

**What's happening:**
- `StripeProvider` loads Stripe.js asynchronously
- While loading, it shows a loading state
- Once ready, it renders the default slot content
- The Stripe instance is now available to all descendants

## Step 2: Add the Elements Container

`StripeElements` creates a Stripe Elements instance. This requires a `clientSecret` from a PaymentIntent.

```vue{2,10-12}
<script setup>
import { ref } from 'vue'
import { StripeProvider, StripeElements } from '@vue-stripe/vue-stripe'

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
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements v-if="clientSecret" :client-secret="clientSecret">
      <p>Elements loaded!</p>
    </StripeElements>
    <p v-else>Loading payment form...</p>
  </StripeProvider>
</template>
```

**What's happening:**
- We fetch a `clientSecret` from our backend
- `StripeElements` only renders once we have the secret
- It creates an Elements instance configured for this payment

## Step 3: Add the Payment Element

`StripePaymentElement` renders Stripe's all-in-one payment UI:

```vue{3,19}
<script setup>
import { ref, onMounted } from 'vue'
import { StripeProvider, StripeElements, StripePaymentElement } from '@vue-stripe/vue-stripe'

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
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements v-if="clientSecret" :client-secret="clientSecret">
      <StripePaymentElement />
      <button>Pay $10.00</button>
    </StripeElements>
    <p v-else>Loading...</p>
  </StripeProvider>
</template>
```

At this point, you should see a payment form with credit card fields (and other payment methods if enabled in your Stripe dashboard).

## Step 4: Handle the Payment

Now let's wire up the submit button. We use `useStripe()` and `useStripeElements()` to access the instances:

```vue{4-6,18-36,43}
<script setup>
import { ref, onMounted } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(false)
const errorMessage = ref('')

// ... fetch clientSecret in onMounted ...

const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  if (!stripe.value || !elements.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
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
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements v-if="clientSecret" :client-secret="clientSecret">
      <form @submit.prevent="handleSubmit">
        <StripePaymentElement />

        <div v-if="errorMessage" class="error">
          {{ errorMessage }}
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Processing...' : 'Pay $10.00' }}
        </button>
      </form>
    </StripeElements>
    <p v-else>Loading payment form...</p>
  </StripeProvider>
</template>
```

## Complete Example

Here's the full payment form:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(false)
const errorMessage = ref('')

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
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  if (!stripe.value || !elements.value) return

  loading.value = true
  errorMessage.value = ''

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
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

    <StripeProvider :publishable-key="publishableKey">
      <StripeElements v-if="clientSecret" :client-secret="clientSecret">
        <form @submit.prevent="handleSubmit">
          <StripePaymentElement />

          <div v-if="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="loading">
            {{ loading ? 'Processing...' : 'Pay $10.00' }}
          </button>
        </form>
      </StripeElements>

      <template v-else>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <p v-else>Loading payment form...</p>
      </template>
    </StripeProvider>
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

- [Understanding the Architecture](/guide/architecture) - Learn about StripeProvider, StripeElements, and the data flow
- [Choosing Your Approach](/guide/approaches) - Decide between Payment Element, Card Element, or Checkout
