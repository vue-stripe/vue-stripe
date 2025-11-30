# Understanding the Architecture

Vue Stripe uses a **Provider + Composable** pattern that mirrors Vue's own provide/inject system. Understanding this pattern will help you use the library effectively.

## The Component Hierarchy

Every payment form follows this structure:

```
StripeProvider (loads Stripe.js)
    │
    └── StripeElements (creates Elements instance)
            │
            ├── StripePaymentElement
            ├── StripeCardElement
            ├── StripeExpressCheckoutElement
            └── ... other elements
```

Let's understand each layer.

## VueStripeProvider: The Foundation

`VueStripeProvider` is always the outermost component. Its job is to:

1. **Load Stripe.js** asynchronously from Stripe's CDN
2. **Initialize the Stripe instance** with your publishable key
3. **Provide the instance** to all descendant components

```vue
<VueStripeProvider :publishable-key="pk_test_...">
  <!-- Everything inside can access Stripe -->
</VueStripeProvider>
```

### Loading States

StripeProvider manages three states:

| State | Description |
|-------|-------------|
| `loading` | Stripe.js is being loaded |
| `ready` | Stripe instance is available |
| `error` | Failed to load (invalid key, network issue) |

You can customize what's shown in each state using slots:

```vue
<VueStripeProvider :publishable-key="key">
  <!-- Default slot: shown when ready -->
  <PaymentForm />

  <!-- Loading slot: shown while loading -->
  <template #loading>
    <MySpinner />
  </template>

  <!-- Error slot: shown on failure -->
  <template #error="{ error }">
    <p>Failed to load: {{ error }}</p>
  </template>
</VueStripeProvider>
```

### Events

You can also listen for lifecycle events:

```vue
<VueStripeProvider
  :publishable-key="key"
  @load="onStripeReady"
  @error="onStripeError"
>
  ...
</VueStripeProvider>

<script setup>
const onStripeReady = (stripe) => {
  console.log('Stripe loaded!', stripe)
}

const onStripeError = (error) => {
  console.error('Failed to load Stripe:', error)
}
</script>
```

## VueStripeElements: The Elements Container

`VueStripeElements` creates a Stripe Elements instance. This is required for any Stripe element components.

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeElements :client-secret="clientSecret">
    <!-- Element components go here -->
  </VueStripeElements>
</VueStripeProvider>
```

### Why is `clientSecret` needed?

The `clientSecret` connects the Elements instance to a specific PaymentIntent or SetupIntent on Stripe's servers. This enables:

- **Secure payment confirmation** - Stripe knows which payment to process
- **Payment method detection** - Show relevant payment methods for the amount/currency
- **Fraud prevention** - Stripe's risk assessment kicks in

::: tip Getting a clientSecret
Create a PaymentIntent on your server and pass its `client_secret` to the frontend. See [Stripe's docs](https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=elements#web-create-intent).
:::

## Accessing Instances with Composables

The real power comes from the composables. Inside any descendant component, you can access the Stripe and Elements instances:

### useStripe()

```vue
<script setup>
import { useStripe } from '@vue-stripe/vue-stripe'

// Must be called inside a component that's within StripeProvider
const { stripe, loading, error } = useStripe()

// stripe.value is the Stripe instance (or null while loading)
// loading.value is true while Stripe.js loads
// error.value contains any error message
</script>
```

### useStripeElements()

```vue
<script setup>
import { useStripeElements } from '@vue-stripe/vue-stripe'

// Must be called inside a component that's within StripeElements
const { elements, loading, error } = useStripeElements()

// elements.value is the Elements instance
</script>
```

### Key Points About Composables

1. **They're reactive** - Values update automatically when state changes
2. **They're readonly** - You can't accidentally overwrite the instances
3. **They throw if misused** - Clear error messages if called outside the provider

```js
// All values are reactive refs
const { stripe, loading, error } = useStripe()

// You can watch them
watch(stripe, (newStripe) => {
  if (newStripe) {
    console.log('Stripe is now available!')
  }
})

// Or use them in computed properties
const isReady = computed(() => !loading.value && !error.value)
```

## Three Ways to Access Stripe

Depending on your use case, there are three patterns:

### Pattern 1: Event-Based

Best for: One-time notifications like logging or analytics

```vue
<VueStripeProvider
  :publishable-key="key"
  @load="(stripe) => analytics.track('stripe_loaded')"
>
  ...
</VueStripeProvider>
```

### Pattern 2: Composable (Recommended)

Best for: Payment handling, conditional rendering, any reactive UI

```vue
<script setup>
const { stripe, loading } = useStripe()

const handlePayment = async () => {
  if (stripe.value) {
    await stripe.value.confirmPayment({ ... })
  }
}
</script>
```

### Pattern 3: Automatic (Child Components)

Best for: Using pre-built element components

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeElements :client-secret="secret">
    <!-- These automatically inject what they need -->
    <VueStripePaymentElement />
    <VueStripeCardElement />
  </VueStripeElements>
</VueStripeProvider>
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   StripeProvider                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  provides: stripe, loading, error            │    │
│  └─────────────────────────────────────────────┘    │
│                        │                             │
│                        ▼                             │
│  ┌─────────────────────────────────────────────┐    │
│  │              StripeElements                  │    │
│  │  injects: stripe                             │    │
│  │  provides: elements, loading, error          │    │
│  └─────────────────────────────────────────────┘    │
│                        │                             │
│          ┌─────────────┼─────────────┐              │
│          ▼             ▼             ▼              │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│   │ Payment   │ │   Card    │ │  Express  │        │
│   │ Element   │ │  Element  │ │ Checkout  │        │
│   │           │ │           │ │           │        │
│   │ injects:  │ │ injects:  │ │ injects:  │        │
│   │ elements  │ │ elements  │ │ elements  │        │
│   └───────────┘ └───────────┘ └───────────┘        │
└─────────────────────────────────────────────────────┘
```

## Common Mistakes

### 1. Using composables outside providers

```vue
<!-- ❌ Wrong - useStripe() called outside StripeProvider -->
<script setup>
const { stripe } = useStripe() // Throws error!
</script>

<template>
  <VueStripeProvider :publishable-key="key">
    ...
  </VueStripeProvider>
</template>
```

```vue
<!-- ✅ Correct - create a child component -->
<!-- PaymentForm.vue -->
<script setup>
const { stripe } = useStripe() // Works!
</script>

<!-- Parent.vue -->
<template>
  <VueStripeProvider :publishable-key="key">
    <PaymentForm />
  </VueStripeProvider>
</template>
```

### 2. Using elements without StripeElements

```vue
<!-- ❌ Wrong - StripePaymentElement needs StripeElements parent -->
<VueStripeProvider :publishable-key="key">
  <VueStripePaymentElement /> <!-- Throws error! -->
</VueStripeProvider>

<!-- ✅ Correct -->
<VueStripeProvider :publishable-key="key">
  <VueStripeElements :client-secret="secret">
    <VueStripePaymentElement />
  </VueStripeElements>
</VueStripeProvider>
```

### 3. Forgetting to wait for loading

```vue
<!-- ❌ Wrong - stripe might be null -->
<script setup>
const { stripe } = useStripe()
stripe.value.confirmPayment(...) // Error if still loading!
</script>

<!-- ✅ Correct - check first -->
<script setup>
const { stripe, loading } = useStripe()

const pay = async () => {
  if (!stripe.value) return
  await stripe.value.confirmPayment(...)
}
</script>
```

## Next Steps

Now that you understand the architecture:

- [Choosing Your Approach](/guide/approaches) - Payment Element vs Card Element vs Checkout
- [StripeProvider Reference](/api/components/stripe-provider) - Full API documentation
