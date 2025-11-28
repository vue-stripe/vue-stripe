# useStripe

Access the Stripe instance from any component within `StripeProvider`.

## Usage

```vue
<script setup>
import { useStripe } from '@vue-stripe/vue-stripe'

// Must be called inside a component that's within StripeProvider
const { stripe, loading, error } = useStripe()
</script>
```

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `stripe` | `Readonly<Ref<Stripe \| null>>` | The Stripe instance |
| `loading` | `Readonly<Ref<boolean>>` | True while Stripe.js is loading |
| `error` | `Readonly<Ref<string \| null>>` | Error message if loading failed |

All return values are **readonly refs** - you can read their `.value` but cannot modify them.

## Examples

### Basic Usage

```vue
<script setup>
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading, error } = useStripe()

const confirmPayment = async () => {
  if (!stripe.value) return

  const result = await stripe.value.confirmPayment({
    // ...
  })
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <button v-else @click="confirmPayment">Pay</button>
</template>
```

### Watching for Stripe Ready

```vue
<script setup>
import { watch } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe()

watch(stripe, (newStripe) => {
  if (newStripe) {
    console.log('Stripe is now available!')
  }
})
</script>
```

### In a Computed Property

```vue
<script setup>
import { computed } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading, error } = useStripe()

const isReady = computed(() => {
  return !loading.value && !error.value && stripe.value !== null
})
</script>
```

### Creating Payment Methods

```vue
<script setup>
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe()
const { elements } = useStripeElements()

const createPaymentMethod = async () => {
  if (!stripe.value || !elements.value) return

  const cardElement = elements.value.getElement('card')

  const { error, paymentMethod } = await stripe.value.createPaymentMethod({
    type: 'card',
    card: cardElement
  })

  if (error) {
    console.error(error)
  } else {
    console.log('Created payment method:', paymentMethod.id)
  }
}
</script>
```

### Retrieving a PaymentIntent

```vue
<script setup>
import { onMounted } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe()

onMounted(async () => {
  // Wait for Stripe to be ready
  if (!stripe.value) return

  const clientSecret = new URLSearchParams(window.location.search).get(
    'payment_intent_client_secret'
  )

  if (clientSecret) {
    const { paymentIntent } = await stripe.value.retrievePaymentIntent(
      clientSecret
    )
    console.log('Payment status:', paymentIntent?.status)
  }
})
</script>
```

## Error Handling

`useStripe()` throws an error if called outside of `StripeProvider`:

```vue
<!-- ❌ Wrong - useStripe() called outside StripeProvider -->
<script setup>
const { stripe } = useStripe() // Throws: "useStripe must be called within StripeProvider"
</script>

<template>
  <StripeProvider :publishable-key="key">
    <MyForm />
  </StripeProvider>
</template>
```

```vue
<!-- ✅ Correct - create a child component -->
<!-- MyForm.vue -->
<script setup>
const { stripe } = useStripe() // Works!
</script>

<!-- Parent.vue -->
<template>
  <StripeProvider :publishable-key="key">
    <MyForm />
  </StripeProvider>
</template>
```

## TypeScript

```ts
import { useStripe } from '@vue-stripe/vue-stripe'
import type { Stripe, PaymentIntentResult } from '@stripe/stripe-js'

const { stripe, loading, error } = useStripe()

// stripe.value is typed as Stripe | null
const confirmPayment = async (): Promise<PaymentIntentResult | undefined> => {
  if (!stripe.value) return

  return stripe.value.confirmPayment({
    elements: elements.value!,
    confirmParams: {
      return_url: 'https://example.com/complete'
    }
  })
}
```

## Common Patterns

### Safe Stripe Access

```ts
const safeConfirm = async () => {
  const s = stripe.value
  if (!s) {
    console.error('Stripe not initialized')
    return
  }

  // TypeScript now knows s is Stripe, not null
  const result = await s.confirmPayment({ ... })
}
```

### With Loading State

```vue
<script setup>
const { stripe, loading } = useStripe()
const processing = ref(false)

const handleSubmit = async () => {
  if (!stripe.value) return

  processing.value = true
  try {
    await stripe.value.confirmPayment({ ... })
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <button
    @click="handleSubmit"
    :disabled="loading || processing"
  >
    {{ loading ? 'Loading...' : processing ? 'Processing...' : 'Pay' }}
  </button>
</template>
```

## See Also

- [StripeProvider](/api/components/stripe-provider) - The provider component
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements instance
- [Architecture Guide](/guide/architecture) - Understand the provider pattern
