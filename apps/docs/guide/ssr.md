# Use Vue Stripe with Nuxt and SSR

Render pages that use Vue Stripe on the server: Nuxt 3, Quasar SSR, VitePress or your own Vite SSR setup.

Stripe.js only runs in the browser. Vue Stripe never loads it on the server: `VueStripeProvider` loads Stripe.js in `onMounted`, and the [plugin](/guide/plugin) loads it the first time a component reads it in the browser. During server rendering every provider renders its `#loading` slot, and the browser's first render matches it, so hydration does not mismatch. After hydration Stripe.js loads and the elements mount.

What you need to do is make sure your server bundle can import the package, and keep your secret key on the server.

## Bundle the package for the server

Tell your SSR bundler to bundle `@vue-stripe/vue-stripe` instead of loading it from `node_modules` at runtime. Its ES build imports `@stripe/stripe-js/pure`, a directory path that Node's own ES module loader does not resolve; without this setting the server can fail with `ERR_UNSUPPORTED_DIR_IMPORT`.

| Framework | Setting |
|-----------|---------|
| Nuxt 3 | `build: { transpile: ['@vue-stripe/vue-stripe'] }` in `nuxt.config.ts` |
| VitePress | `vite: { ssr: { noExternal: ['@vue-stripe/vue-stripe'] } }` in `.vitepress/config.ts` |
| Quasar SSR | `build.extendViteConf(viteConf)` in `quasar.config.js`: add `'@vue-stripe/vue-stripe'` to `viteConf.ssr.noExternal` |
| Vite SSR (custom) | `ssr: { noExternal: ['@vue-stripe/vue-stripe'] }` in `vite.config.ts` |

## Nuxt 3

### 1. Configure Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@vue-stripe/vue-stripe/style.css'],
  build: {
    transpile: ['@vue-stripe/vue-stripe']
  },
  runtimeConfig: {
    // Server only
    stripeSecretKey: '',
    public: {
      stripePublishableKey: ''
    }
  }
})
```

Set the keys in `.env`. Nuxt maps `NUXT_`-prefixed variables onto `runtimeConfig`, and only `public` values reach the browser:

```bash
NUXT_STRIPE_SECRET_KEY=sk_test_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Provide Stripe

Either install the plugin once, so every page can use the elements and composables without a provider:

```ts
// plugins/vue-stripe.ts
import { createVueStripe } from '@vue-stripe/vue-stripe'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  nuxtApp.vueApp.use(
    createVueStripe({ publishableKey: config.public.stripePublishableKey })
  )
})
```

or wrap the checkout part of a page in `VueStripeProvider`, as in step 4 below.

### 3. Create the Intent in a server route

```ts
// server/api/payment-intent.post.ts
import Stripe from 'stripe'

export default defineEventHandler(async () => {
  const stripe = new Stripe(useRuntimeConfig().stripeSecretKey)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000, // decide the amount on the server
    currency: 'usd',
    automatic_payment_methods: { enabled: true }
  })

  return { clientSecret: paymentIntent.client_secret }
})
```

### 4. Render the payment form

Fetch the client secret in the browser (`server: false`), so a page render does not create a PaymentIntent:

```vue
<!-- pages/checkout.vue -->
<script setup lang="ts">
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()
const { data } = await useFetch('/api/payment-intent', { method: 'POST', server: false })
</script>

<template>
  <VueStripeProvider :publishable-key="config.public.stripePublishableKey">
    <VueStripeElements v-if="data" :client-secret="data.clientSecret">
      <VueStripePaymentElement />
      <!-- components/PayButton.vue calls usePaymentIntent() -->
      <PayButton :client-secret="data.clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

`PayButton` is the same component as in [Accept a payment with the Payment Element](/guide/payment-element). With the plugin from step 2, drop the `VueStripeProvider` wrapper.

`ref`, `useFetch` and the other Nuxt and Vue functions are auto-imported. Import the Vue Stripe components yourself, or register them in a plugin.

### Render on the client only

You don't have to, but if you prefer to send no Stripe markup from the server, wrap the form in `<ClientOnly>` (with a `#fallback` template) or move it into a component named `*.client.vue`.

## Quasar SSR

Add the bundling setting from the table above, then use the components as in any Vue app. `<q-no-ssr>` around the form is optional, as `<ClientOnly>` is in Nuxt:

```vue
<template>
  <q-no-ssr>
    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements :client-secret="clientSecret">
        <VueStripePaymentElement />
      </VueStripeElements>
    </VueStripeProvider>
  </q-no-ssr>
</template>
```

## VitePress

Add the `ssr.noExternal` setting from the table to `.vitepress/config.ts` and import the stylesheet in `.vitepress/theme/index.ts`. Components can then be used directly in Markdown pages or theme components; they render their loading state while VitePress builds the static HTML. This documentation site runs its live demos this way.

## Result

The server renders the page, including the providers' loading state, without loading Stripe.js. In the browser the page hydrates, Stripe.js loads once, and the elements appear.

If you see a hydration mismatch, look for your own code that reads browser-only values (`window`, `localStorage`, the current time) during render, and move it into `onMounted`.
