# Installation

## Package Installation

Install Vue Stripe and the Stripe.js types:

::: code-group
```bash [npm]
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

```bash [pnpm]
pnpm add @vue-stripe/vue-stripe @stripe/stripe-js
```

```bash [yarn]
yarn add @vue-stripe/vue-stripe @stripe/stripe-js
```
:::

## Get Your API Keys

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Keep your **Secret key** secure on your server (starts with `sk_test_`)

::: warning Never expose your Secret Key
The publishable key is safe to use in frontend code. The secret key must only be used on your server.
:::

## Basic Setup

Import the components you need:

```vue
<script setup>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = 'pk_test_...'
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <!-- Your payment components go here -->
  </StripeProvider>
</template>
```

## Environment Variables

Store your publishable key in environment variables:

::: code-group
```env [.env.local]
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

```vue [Component]
<script setup>
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>
```
:::

## Plugin Registration (Optional)

You can register Vue Stripe as a global plugin:

```js
// main.js or main.ts
import { createApp } from 'vue'
import { VueStripePlugin } from '@vue-stripe/vue-stripe'
import App from './App.vue'

const app = createApp(App)

app.use(VueStripePlugin, {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
})

app.mount('#app')
```

This makes components available globally without importing.

## Verify Installation

Create a simple test to verify everything is working:

```vue
<script setup>
import { StripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const onLoad = (stripe) => {
  console.log('Stripe loaded!', stripe)
}

const onError = (error) => {
  console.error('Stripe failed to load:', error)
}
</script>

<template>
  <StripeProvider
    :publishable-key="publishableKey"
    @load="onLoad"
    @error="onError"
  >
    <p>Stripe is ready!</p>
  </StripeProvider>
</template>
```

If you see "Stripe is ready!" and the console shows "Stripe loaded!", you're good to go!

## Next Steps

Now that you have Vue Stripe installed, let's [build your first payment form](/guide/first-payment).
