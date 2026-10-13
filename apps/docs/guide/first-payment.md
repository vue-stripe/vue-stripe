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

Now let's wire up the submit button. Confirming needs the Stripe and Elements instances, which the providers hand to their descendants, so the form moves into a child component rendered inside `VueStripeElements`. There, [`usePaymentIntent()`](/api/composables/use-payment-intent) finds both on its own:

```vue
<!-- PaymentForm.vue: rendered inside VueStripeElements -->
<script setup>
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({
  clientSecret: { type: String, required: true }
})

// Call composables at setup scope, inside the providers
const { confirmPayment, loading, error } = usePaymentIntent()

const handleSubmit = async () => {
  // Validates the form (elements.submit()), then confirms the PaymentIntent
  await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    },
    redirect: 'always'
  })
  // If successful, Stripe redirects to return_url.
  // If not, `error` holds the message to show the customer.
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VueStripePaymentElement />

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Processing...' : 'Pay $10.00' }}
    </button>
  </form>
</template>
```

The page keeps the providers and renders the form inside them:

```vue{4,15}
<script setup>
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from './PaymentForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

// ... fetch clientSecret in onMounted ...
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
      <PaymentForm :client-secret="clientSecret" />
    </VueStripeElements>
    <p v-else>Loading payment form...</p>
  </VueStripeProvider>
</template>
```

::: warning Composables need the providers above them
`usePaymentIntent()` only works in a component rendered *inside* `VueStripeProvider` and `VueStripeElements`. Calling it in the component that renders the providers throws, because the providers are not its ancestors.
:::

## Complete Example

Here's the full payment form, as a page and its form component:

```vue
<!-- PaymentPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import PaymentForm from './PaymentForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
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
</script>

<template>
  <div class="payment-form">
    <h2>Complete Your Payment</h2>

    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
        <PaymentForm :client-secret="clientSecret" />
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

.error {
  color: #dc3545;
  font-size: 14px;
}
</style>
```

```vue
<!-- PaymentForm.vue -->
<script setup lang="ts">
import { VueStripePaymentElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { confirmPayment, loading, error } = usePaymentIntent()

const handleSubmit = async () => {
  await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    },
    redirect: 'always'
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VueStripePaymentElement />

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Processing...' : 'Pay $10.00' }}
    </button>
  </form>
</template>

<style scoped>
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
