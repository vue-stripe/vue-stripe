---
description: "Use Vue Stripe in a Vite SSR app: create the app per request, serve the API from the same server and fetch client secrets in the browser."
---

# Use Vue Stripe in a Vite SSR app

Add Vue Stripe to a Vue 3 app that you server-render yourself with Vite and `vue/server-renderer`, and take a test payment. The steps start from Vite's SSR template, which has an Express server (`server.js`) and the entries `src/entry-server.ts` and `src/entry-client.ts`:

```bash
npm create vite-extra@latest my-app -- --template ssr-vue-ts
```

The rules in [What every SSR app needs](/guide/ssr#what-every-ssr-app-needs) apply here. In a plain Node server they matter most: a request started at the top of `<script setup>` stops the server process.

## 1. Install the packages

Install Vue Stripe, Stripe.js, Stripe's Node library for the API routes, and Vue Router for the return page:

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10 stripe vue-router
```

The server loads the package from `node_modules` as an ES module. No `ssr.noExternal` or other Vite setting is needed.

## 2. Add the keys

Put both keys in `.env.local` in the project root:

```bash
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Vite gives app code only the `VITE_` variable, and `vite build` writes its value into the client and server bundles, so the publishable key must be set when you build. The secret key stays in the Node server, which reads the file in step 4.

## 3. Create the app per request

The server renders every request with a new app. Create the router and install the [plugin](/guide/plugin) inside `createApp()`, never at module level, so no state is shared between requests:

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      { path: '/', component: () => import('./pages/CheckoutPage.vue') },
      { path: '/payment-complete', component: () => import('./pages/PaymentComplete.vue') }
    ]
  })
  app.use(router)

  // On the server the plugin only provides; Stripe.js loads in the browser.
  app.use(createVueStripe({ publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY }))

  return { app, router }
}
```

The stylesheet import can stay here: Vite leaves CSS out of the server bundle.

Render the route in `src/App.vue`:

```vue
<!-- src/App.vue -->
<template>
  <RouterView />
</template>
```

Then let both entries wait for the router:

```ts
// src/entry-server.ts
import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'

export async function render(url: string) {
  const { app, router } = createApp()
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app, {})
  return { html }
}
```

```ts
// src/entry-client.ts
import { createApp } from './main'

const { app, router } = createApp()

router.isReady().then(() => app.mount('#app'))
```

## 4. Serve the API from the same server

Add the API routes to `server.js`, before the Vite middleware and the catch-all route that renders pages. The app then calls `/api` on its own origin in development and in production, and needs no proxy:

```js
// server.js
import fs from 'node:fs/promises'
import express from 'express'
import Stripe from 'stripe'

// ...the template's constants and template HTML...

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/create-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // decide the amount on the server
    currency: 'usd',
    automatic_payment_methods: { enabled: true }
  })
  res.json({ clientSecret: paymentIntent.client_secret })
})

// ...the template's Vite or production middlewares, then app.use('*all', ...)
```

Node does not read `.env.local` by itself. Pass the file in the scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "node --env-file=.env.local server",
    "preview": "cross-env NODE_ENV=production node --env-file=.env.local server"
  }
}
```

On a production host, set `STRIPE_SECRET_KEY` in the environment instead and start the server with `NODE_ENV=production node server`.

If your API runs as a separate server, the [dev proxy](/guide/installation#_5-send-api-requests-to-your-server) in `vite.config.ts` also works here, because `server.js` runs Vite in middleware mode. In production, forward `/api` from `server.js` or a reverse proxy yourself: the proxy is part of the dev server only.

## 5. Render the payment form

Fetch the client secret in `onMounted`. It runs in the browser only, so a server render creates no PaymentIntent and the server renders the loading text:

```vue
<!-- src/pages/CheckoutPage.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from '../components/PaymentForm.vue'

const clientSecret = ref('')
const errorMessage = ref('')

onMounted(async () => {
  const response = await fetch('/api/create-payment-intent', { method: 'POST' })
  if (!response.ok) {
    errorMessage.value = 'Failed to initialize payment'
    return
  }
  clientSecret.value = (await response.json()).clientSecret
})
</script>

<template>
  <p v-if="errorMessage">{{ errorMessage }}</p>
  <VueStripeElements v-else-if="clientSecret" :client-secret="clientSecret">
    <PaymentForm :client-secret="clientSecret" />
  </VueStripeElements>
  <p v-else>Loading...</p>
</template>
```

`src/components/PaymentForm.vue` is the component from [Accept a payment with the Payment Element](/guide/payment-element#_3-render-the-payment-element-and-confirm). Its button says "Pay $20.00", the amount the server route charges. The plugin provides Stripe, so the page needs no `VueStripeProvider`.

## 6. Add the return page

`PaymentForm` confirms with `return_url: ${window.location.origin}/payment-complete`. Use `CompletePage.vue` from [Check the result on the return page](/guide/error-handling#_4-check-the-result-on-the-return-page) as `src/pages/PaymentComplete.vue`. It reads the result in `onMounted`, and the plugin gives it Stripe without a provider.

## 7. Run it

1. Start the development server and open `http://localhost:5173`:

   ```bash
   npm run dev
   ```

2. Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Stripe redirects to `/payment-complete`, which shows "Payment received."

3. Build and run the production server:

   ```bash
   npm run build
   npm run preview
   ```

## Build the page on a Checkout Session instead

For `VueStripeCheckoutElementsProvider`, `VueStripeCheckoutFormProvider` and `VueStripeEmbeddedCheckout`, pass a function in `fetch-client-secret`, as the [CheckoutPage.vue sample](/guide/ssr#fetch-client-secrets-in-the-browser) does. Don't use a Promise created at the top of `<script setup>`: on the server, the relative `fetch('/api/checkout-elements-session')` rejects with "Failed to parse URL", and Node exits on the unhandled rejection. Add the session route to `server.js` next to the PaymentIntent route:

```js
app.post('/api/checkout-elements-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'elements',
    mode: 'payment',
    line_items: [{ price: 'price_123', quantity: 1 }],
    return_url: `${req.protocol}://${req.get('host')}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`
  })
  res.json({ clientSecret: session.client_secret })
})
```

Add a route for `/checkout/complete` in `src/main.ts` that checks the session, as in [Embed Stripe Checkout](/guide/embedded-checkout#_3-handle-completion).

## If something goes wrong

### The server process exits after one request

Node prints `TypeError: Failed to parse URL from /api/...` and the next request is refused. A component started a request in setup during server rendering. Fetch in `onMounted`, or pass a function in `fetch-client-secret`.

### Every page answers 500 "publishableKey or stripeKey is required"

A `VueStripeProvider` rendered on the server with an empty key. Set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env.local` and restart `npm run dev`, or run `npm run build` again: the production bundle keeps the value it was built with.

### The server does not start: "Neither apiKey nor config.authenticator provided"

`new Stripe()` ran without `STRIPE_SECRET_KEY`. Start the server with `--env-file=.env.local` (step 4), or set the variable in the server's environment.

## Result

The server renders each page with the providers' loading state and never loads Stripe.js. In the browser the page hydrates without mismatch warnings, the Payment Element mounts, and after paying the customer lands on `/payment-complete`.
