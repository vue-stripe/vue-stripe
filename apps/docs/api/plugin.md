# createVueStripe Plugin

A Vue plugin for global Stripe configuration with lazy-loaded Stripe instance.

## What is createVueStripe?

`createVueStripe` is a Vue plugin factory that provides global Stripe configuration to your entire application. It's an alternative to using `VueStripeProvider` as a wrapper component.

| Feature | Description |
|---------|-------------|
| **Global Config** | Configure Stripe once at app initialization |
| **Lazy Loading** | Stripe.js is only loaded when first accessed |
| **Singleton Pattern** | Single Stripe instance shared across all components |
| **SSR Safe** | Stripe only loads on client-side when accessed |

## When to Use

| Scenario | Use Plugin | Use StripeProvider |
|----------|------------|-------------------|
| Single Stripe account for entire app | ✅ | ✅ |
| Multiple Stripe accounts (Connect) | ❌ | ✅ |
| Need to change keys at runtime | ❌ | ✅ |
| Want simpler component trees | ✅ | ❌ |
| SSR with hydration | ⚠️ Careful | ✅ Easier |

::: tip When to Choose
Use **createVueStripe** for simple apps with a single Stripe account.
Use **StripeProvider** when you need runtime configuration or Stripe Connect.
:::

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. App Initialization                                       │
│     app.use(createVueStripe({ publishableKey: '...' }))     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Plugin provides global config via inject                 │
│     'vue-stripe-config' → { publishableKey, ... }           │
│     'vue-stripe-global' → { stripe: Promise<Stripe> }       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Component accesses stripe (lazy loading)                 │
│     const { stripe } = inject('vue-stripe-global')          │
│     const stripeInstance = await stripe                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. First access triggers loadStripe()                       │
│     Subsequent accesses return cached instance              │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```ts
// main.ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import App from './App.vue'

const app = createApp(App)

app.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

app.mount('#app')
```

## Options

```ts
interface VueStripeOptions {
  /** Stripe publishable key (required) */
  publishableKey: string

  /** Connected account ID for Stripe Connect (optional) */
  stripeAccount?: string

  /** Stripe API version (optional) */
  apiVersion?: string

  /** Locale for Stripe elements (optional) */
  locale?: string
}
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `publishableKey` | `string` | Yes | Your Stripe publishable key (`pk_test_...` or `pk_live_...`) |
| `stripeAccount` | `string` | No | Connected account ID for Stripe Connect (`acct_...`) |
| `apiVersion` | `string` | No | Stripe API version (e.g., `'2023-10-16'`) |
| `locale` | `string` | No | Locale for Stripe Elements UI (`'en'`, `'fr'`, `'de'`, etc.) |

## Provided Values

The plugin provides two injection keys:

### vue-stripe-config

Contains the raw options passed to the plugin:

```ts
const config = inject('vue-stripe-config')
// { publishableKey: '...', stripeAccount: '...', ... }
```

### vue-stripe-global

Contains a lazy-loaded Stripe instance:

```ts
const global = inject('vue-stripe-global')
const stripe = await global.stripe // Promise<Stripe | null>
```

## Usage Examples

### Basic Usage

```ts
// main.ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'

const app = createApp(App)

app.use(createVueStripe({
  publishableKey: 'pk_test_...'
}))

app.mount('#app')
```

### With All Options

```ts
app.use(createVueStripe({
  publishableKey: 'pk_test_...',
  stripeAccount: 'acct_...', // For Stripe Connect
  apiVersion: '2023-10-16',
  locale: 'fr'
}))
```

### Accessing Stripe in Components

```vue
<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import type { Stripe } from '@stripe/stripe-js'

const stripeGlobal = inject<{ stripe: Promise<Stripe | null> }>('vue-stripe-global')
const stripe = ref<Stripe | null>(null)

onMounted(async () => {
  if (stripeGlobal) {
    stripe.value = await stripeGlobal.stripe
    console.log('Stripe loaded:', stripe.value)
  }
})
</script>
```

### Creating a Composable

For easier access, create a composable:

```ts
// composables/useGlobalStripe.ts
import { inject, ref, onMounted } from 'vue'
import type { Stripe } from '@stripe/stripe-js'

export function useGlobalStripe() {
  const stripeGlobal = inject<{ stripe: Promise<Stripe | null> }>('vue-stripe-global')
  const stripe = ref<Stripe | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    if (!stripeGlobal) {
      error.value = 'Vue Stripe plugin not installed'
      loading.value = false
      return
    }

    try {
      stripe.value = await stripeGlobal.stripe
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load Stripe'
    } finally {
      loading.value = false
    }
  })

  return { stripe, loading, error }
}
```

Usage:

```vue
<script setup>
import { useGlobalStripe } from '@/composables/useGlobalStripe'

const { stripe, loading, error } = useGlobalStripe()
</script>

<template>
  <div v-if="loading">Loading Stripe...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>Stripe ready!</div>
</template>
```

### With StripeElements

You can still use `VueStripeElements` without `VueStripeProvider`:

```vue
<script setup>
import { inject, ref, onMounted } from 'vue'
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

const stripeGlobal = inject('vue-stripe-global')
const stripe = ref(null)
const clientSecret = ref('pi_xxx_secret_xxx')

onMounted(async () => {
  stripe.value = await stripeGlobal.stripe
})
</script>

<template>
  <VueStripeElements
    v-if="stripe"
    :stripe="stripe"
    :client-secret="clientSecret"
  >
    <VueStripePaymentElement />
  </VueStripeElements>
</template>
```

::: warning Note
When using the plugin with `VueStripeElements`, you need to pass the `stripe` instance directly to `VueStripeElements` instead of using the `VueStripeProvider` wrapper.
:::

## TypeScript

```ts
import { createVueStripe } from '@vue-stripe/vue-stripe'
import type { VueStripeOptions } from '@vue-stripe/vue-stripe'

const options: VueStripeOptions = {
  publishableKey: 'pk_test_...',
  stripeAccount: 'acct_...',
  apiVersion: '2023-10-16',
  locale: 'en'
}

app.use(createVueStripe(options))
```

### Type-Safe Injection

```ts
import { inject } from 'vue'
import type { Stripe } from '@stripe/stripe-js'
import type { VueStripeOptions } from '@vue-stripe/vue-stripe'

// Config injection
const config = inject<VueStripeOptions>('vue-stripe-config')

// Global stripe injection
const global = inject<{ stripe: Promise<Stripe | null> }>('vue-stripe-global')
```

## Comparison with StripeProvider

| Feature | createVueStripe | StripeProvider |
|---------|-----------------|----------------|
| Configuration | Once at app init | Per component tree |
| Stripe Loading | Lazy (on first access) | Eager (on mount) |
| Multiple Accounts | No | Yes (nested providers) |
| Runtime Key Changes | No | Yes (reactive prop) |
| Component Wrapper | None needed | Required |
| Composables | Custom needed | Built-in `useStripe()` |
| SSR Handling | Manual | Built-in |

## Best Practices

### Do

```ts
// ✅ Use environment variables
app.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

// ✅ Handle loading state
const stripe = ref(null)
onMounted(async () => {
  stripe.value = await stripeGlobal.stripe
})

// ✅ Create a composable for reuse
export function useGlobalStripe() { ... }
```

### Don't

```ts
// ❌ Don't hardcode keys
app.use(createVueStripe({
  publishableKey: 'pk_live_actual_key_here'
}))

// ❌ Don't access synchronously
const stripe = stripeGlobal.stripe // This is a Promise!

// ❌ Don't use for Stripe Connect with multiple accounts
// Use StripeProvider instead for dynamic stripeAccount
```

## SSR Considerations

The plugin is SSR-safe because Stripe is only loaded when the `stripe` getter is accessed. However, you need to ensure you only access it on the client:

```vue
<script setup>
import { inject, ref, onMounted } from 'vue'

const stripeGlobal = inject('vue-stripe-global')
const stripe = ref(null)

// Only runs on client
onMounted(async () => {
  stripe.value = await stripeGlobal.stripe
})
</script>
```

## See Also

- [Installation Guide](/guide/installation) — Setup for different frameworks
- [StripeProvider](/api/components/stripe-provider) — Component-based alternative
- [useStripe](/api/composables/use-stripe) — Composable for accessing Stripe
