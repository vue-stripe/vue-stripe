---
description: "Provide Stripe to a whole Vue app with the createVueStripe plugin, and combine it with VueStripeProvider where a page needs another key or account."
---

# Provide Stripe app-wide

Install the `createVueStripe` plugin once, so every component in the app can use the Vue Stripe elements and composables without a `VueStripeProvider` around it.

Use the plugin when the whole app uses one Stripe account. Keep `VueStripeProvider` where a part of the app needs a different key, a connected account or `betas`; the two combine (step 4). All options are listed in the [createVueStripe reference](/api/plugin).

## 1. Install the plugin

::: code-group

```ts [Vue 3]
// main.ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

app.mount('#app')
```

```js [Vue 2.7]
// main.js
import Vue from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

Vue.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY // Vue CLI: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
}))

new Vue({ render: (h) => h(App) }).$mount('#app')
```

:::

Read the key from an environment variable rather than writing it into the code. Installing the plugin loads nothing: Stripe.js loads the first time a component or composable needs it, and never on the server.

## 2. Render elements without a provider

Import components where you use them; the plugin does not register them globally. `VueStripeElements` takes the Stripe instance from the plugin:

```vue
<!-- CheckoutPage.vue -->
<script setup lang="ts">
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'
import PayButton from './PayButton.vue'

defineProps<{ clientSecret: string }>()
</script>

<template>
  <VueStripeElements :client-secret="clientSecret">
    <template #loading>
      <p>Loading payment form...</p>
    </template>
    <VueStripePaymentElement />
    <PayButton :client-secret="clientSecret" />
  </VueStripeElements>
</template>
```

`VueStripeElements` shows its `#loading` slot until Stripe.js has loaded, and its `#error` slot if Stripe.js fails to load. `VueStripeCheckoutElementsProvider` and `VueStripePricingTable` also work under the plugin. `VueStripeEmbeddedCheckout` and the disclosures show their `#error` slot and emit `@error` when Stripe.js fails to load.

## 3. Use the composables

The composables work in any component below the app root, as they do below a provider:

```vue
<!-- PayButton.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmPayment, loading, error } = usePaymentIntent()
const paid = ref(false)

const pay = async () => {
  // Card payments finish on this page; methods that need a redirect come back to return_url
  const { paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/payment-complete` }
  })
  if (paymentIntent?.status === 'succeeded') paid.value = true
}
</script>

<template>
  <p v-if="paid">Payment received.</p>
  <template v-else>
    <button :disabled="loading" @click="pay">Pay</button>
    <p v-if="error">{{ error }}</p>
  </template>
</template>
```

`confirmPayment()` keeps the customer on the page when the payment method allows it (`redirect: 'if_required'` by default), so handle its result: a succeeded PaymentIntent cannot be confirmed again. Build the page at `return_url` with `CompletePage.vue` from [Check the result on the return page](/guide/error-handling#_4-check-the-result-on-the-return-page).

To show Stripe.js loading state somewhere without Elements, read it from `useStripe()`:

```vue
<script setup lang="ts">
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading, error } = useStripe()
</script>

<template>
  <p v-if="loading">Loading Stripe...</p>
  <p v-else-if="error">Stripe failed to load: {{ error }}</p>
  <p v-else-if="stripe">Stripe is ready.</p>
</template>
```

## 4. Override the plugin for one part of the app

A `VueStripeProvider` inside the app wins for everything inside it. Use one to act on a connected account, or to pass `betas`:

```vue
<template>
  <!-- Uses the plugin's Stripe instance -->
  <PlatformCheckout />

  <!-- Uses its own Stripe instance, loaded for the connected account -->
  <VueStripeProvider
    :publishable-key="publishableKey"
    stripe-account="acct_..."
  >
    <ConnectedAccountCheckout />
  </VueStripeProvider>
</template>
```

The provider does not inherit the plugin's options: give it its own `publishable-key` and any other options it needs. Don't install a second plugin to switch accounts; one plugin provides one Stripe instance to the whole app.

## Result

Every component in the app can render Vue Stripe elements and call the composables. Stripe.js loads once, on first use, and is shared by every consumer except the subtrees that have their own `VueStripeProvider`.

For how the plugin and the provider share their injection keys, see [How Vue Stripe works](/guide/architecture).
