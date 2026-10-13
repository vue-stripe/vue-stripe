---
description: "Set up Vue Stripe in a Quasar app: the QCLI_ key prefix, a boot file, the CSP meta tag, the dev proxy, return_url routing and SSR mode."
---

# Use Vue Stripe with Quasar

Set up Vue Stripe in a Quasar CLI app built with Vite (`@quasar/app-vite`), in SPA or SSR mode. A Quasar app differs from a plain Vite app in six places: the key's prefix, the missing `main.ts`, a Content Security Policy in `index.html`, the dev proxy, the default hash router and, in SSR mode, where requests may start.

These steps were tested with Quasar 2.35 and `@quasar/app-vite` 3.10 in SPA and SSR mode, in development and in a production build. For Quasar's webpack mode (`@quasar/app-webpack`), see the key table in [Install and set up](/guide/installation#_3-add-your-publishable-key); the other steps are the same.

## 1. Install the packages

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```

## 2. Add your publishable key

Quasar passes to client code only the variables whose name starts with `QCLI_`. A `VITE_` variable is `undefined` in a Quasar app, and the provider or plugin then throws "publishableKey or stripeKey is required". Put the key in `.env` at the project root:

```bash
# .env
QCLI_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Read it as `import.meta.env.QCLI_STRIPE_PUBLISHABLE_KEY`. Quasar generates the TypeScript type for every variable in its dotenv files, so `env.d.ts` needs no entry. The starter's `.gitignore` already ignores `.env*` files. Quasar also reads `.env.local`, except in CI.

Never give the secret key the `QCLI_` prefix: Quasar writes those values into the JavaScript it sends to the browser.

## 3. Load the stylesheet and the plugin in a boot file

A Quasar app has no `main.ts`; code that runs once when the app starts goes in a [boot file](https://quasar.dev/quasar-cli-vite/boot-files). Create `src/boot/vue-stripe.ts` (`quasar new boot vue-stripe` creates the file for you):

```ts
// src/boot/vue-stripe.ts
import { defineBoot } from '#q-app'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'

export default defineBoot(({ app }) => {
  app.use(createVueStripe({ publishableKey: import.meta.env.QCLI_STRIPE_PUBLISHABLE_KEY }))
})
```

List it in `quasar.config.ts`:

```ts
// quasar.config.ts
boot: ['vue-stripe'],
```

The [plugin](/guide/plugin) makes Stripe available to every page, so the pages below need no `VueStripeProvider`. If you prefer providers, keep only the stylesheet import in the boot file and wrap each page in `VueStripeProvider` with the same key.

## 4. Allow Stripe in the Content Security Policy

The starter's `index.html` has a Content Security Policy that allows scripts from your own origin only. It blocks Stripe.js: the provider shows "Failed to load Stripe.js" and the console names the `script-src` directive. Replace the `<meta http-equiv="Content-Security-Policy">` tag with one that adds Stripe's hosts:

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://js.stripe.com https://*.js.stripe.com; frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com; connect-src 'self' https://api.stripe.com<% if (ctx.dev) { %> ws://localhost:*<% } %>; img-src 'self' https://*.stripe.com; style-src 'self' 'unsafe-inline';<% if (ctx.dev) { %> worker-src 'self' blob:;<% } %>"
/>
```

These are the Stripe.js directives from [Stripe's CSP list](https://docs.stripe.com/security/guide#content-security-policy). `https://hooks.stripe.com` in `frame-src` lets 3D Secure open. Add hosts when you use these features:

- **`fonts` on `VueStripeElements`, or `loadFonts()`**: the stylesheet's host in `connect-src`, for example `https://fonts.googleapis.com`.
- **Link**: `https://link.com https://*.link.com` in `frame-src` and `connect-src`, and `https://*.link.com` in `img-src`.
- **Address Element with your own Google Maps key**: `https://maps.googleapis.com` in `script-src` and `connect-src`.

If you set the policy as a response header on your server instead, remove the meta tag and put the same directives in the header.

## 5. Send `/api` requests to your server in development

The how-to guides call your server with paths such as `fetch('/api/create-payment-intent', { method: 'POST' })`. A Quasar app has no `vite.config.ts`; set the proxy in `devServer` of `quasar.config.ts`. Replace `3000` with the port your server listens on:

```ts
// quasar.config.ts
export default defineConfig((ctx) => {
  return {
    // ...
    devServer: {
      // In SSR mode, an SSR middleware serves /api instead (step 8)
      proxy: ctx.mode.ssr ? {} : { '/api': 'http://localhost:3000' }
    }
  }
})
```

The proxy also runs in `quasar dev -m ssr`, where it would send `/api` past your SSR middleware, so the sample turns it off in SSR mode. Quasar reloads by itself when its config changes.

## 6. Make `return_url` reach your return page

The guides send the customer back to `${window.location.origin}/payment-complete` after a redirect, and the return page reads Stripe's query parameters from `window.location.search`. That path only reaches your route with history-mode routing. The Quasar starter uses the hash router, so the customer lands on the home page and the return page never runs. Choose one:

- **Switch to history mode** (SSR mode needs it anyway, because the server only sees the path):

  ```ts
  // quasar.config.ts
  build: {
    vueRouterMode: 'history'
  }
  ```

  Your production host must then answer every route with `index.html`, for example `quasar serve dist/spa --history`.

- **Keep the hash router** and put the route after `#`:

  ```ts
  confirmParams: {
    return_url: `${window.location.origin}/#/payment-complete`
  }
  ```

  Stripe adds its parameters before the `#` (`/?payment_intent=...&redirect_status=succeeded#/payment-complete`), so the return page reads them from `window.location.search` as in the guides.

## 7. Render a payment form

Fetch the client secret in `onMounted`, and render `VueStripeElements` only once you have it. Without the `v-if`, the Elements group can be created before the request returns, and the Payment Element logs "[Vue Stripe] VueStripePaymentElement creation error: In order to create a payment element, you must pass a clientSecret or mode".

```vue
<!-- src/pages/PaymentPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from '@/components/PaymentForm.vue'

const clientSecret = ref('')
const errorMessage = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/create-payment-intent', { method: 'POST' })
    const data = await response.json()
    clientSecret.value = data.clientSecret
  } catch {
    errorMessage.value = 'Failed to initialize payment'
  }
})
</script>

<template>
  <q-page padding>
    <p v-if="errorMessage">{{ errorMessage }}</p>
    <VueStripeElements v-else-if="clientSecret" :client-secret="clientSecret">
      <PaymentForm :client-secret="clientSecret" />
    </VueStripeElements>
  </q-page>
</template>
```

`PaymentForm.vue` is the form from [Accept a payment with the Payment Element](/guide/payment-element#_3-render-the-payment-element-and-confirm); save it in `src/components/`. Add both pages to `src/router/routes.ts`, for example as `pay` and `payment-complete`, then pay with a [test card](/guide/testing#cards).

## 8. Run in SSR mode

Add SSR mode with `quasar mode add ssr` and start it with `quasar dev -m ssr`. The boot file, the stylesheet and the components work unchanged: in SSR mode the boot file runs once per request, and the plugin never loads Stripe.js on the server. The server renders the loading state, and the browser loads Stripe.js after hydration.

### Serve `/api` from an SSR middleware

The SSR server can answer the guides' `/api` requests itself. Install stripe-node with `npm install stripe`, create `src-ssr/middlewares/api.ts` (`quasar new ssrmiddleware api`), and list it before `render` in `quasar.config.ts`:

```ts
// src-ssr/middlewares/api.ts
import { defineSsrMiddleware } from '#q-app'
import Stripe from 'stripe'

export default defineSsrMiddleware(({ app, resolve }) => {
  // Development reads .env. The production server reads its own environment,
  // so the key is not written into dist/ssr.
  const secretKey = import.meta.env.QUASAR_DEV
    ? import.meta.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY
  const stripe = new Stripe(secretKey!)

  app.post(resolve.urlPath('/api/create-payment-intent'), async (c) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // decide the amount on the server
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    })
    return c.json({ clientSecret: paymentIntent.client_secret })
  })
})
```

```ts
// quasar.config.ts
ssr: {
  middlewares: [
    'api',
    'render' // keep this as the last one
  ]
}
```

Add `STRIPE_SECRET_KEY=sk_test_...` to `.env`, without the `QCLI_` prefix: Quasar gives unprefixed variables to server code only. It also writes them into the server build, which is why the sample reads `process.env` in production. Start the built server with the key in its environment:

```bash
quasar build -m ssr
cd dist/ssr && npm install --omit=dev
STRIPE_SECRET_KEY=sk_live_... node index.js
```

The middleware uses the context API (`c.json()`) of Hono, the webserver Quasar scaffolds in `src-ssr/server.ts`.

### Start requests in the browser, not in `setup`

`<script setup>` runs on the server for every request. A relative `fetch('/api/...')` there rejects with "Failed to parse URL", and if nothing handles the rejection, Node stops the server process, in `quasar dev -m ssr` and in production alike. So:

- Fetch the PaymentIntent in `onMounted`, as in step 7.
- For [`VueStripeCheckoutElementsProvider`](/api/components/stripe-checkout-provider), `VueStripeCheckoutFormProvider` and `VueStripeEmbeddedCheckout`, pass a function in `fetch-client-secret`, never a Promise created at the top of `<script setup>` (the form shown in [Build your own page on a Checkout Session](/guide/custom-checkout#_2-wrap-the-page-in-the-provider)). The provider calls the function in the browser only, once Stripe.js has loaded:

  ```vue
  <!-- src/pages/CheckoutPage.vue -->
  <script setup lang="ts">
  import { VueStripeCheckoutElementsProvider } from '@vue-stripe/vue-stripe'
  import CheckoutForm from '@/components/CheckoutForm.vue'

  const fetchClientSecret = () =>
    fetch('/api/checkout-session', { method: 'POST' })
      .then((response) => response.json())
      .then((data) => data.clientSecret)
  </script>

  <template>
    <q-page padding>
      <VueStripeCheckoutElementsProvider :fetch-client-secret="fetchClientSecret">
        <CheckoutForm />

        <template #loading>Loading checkout...</template>
        <template #error="{ error }">Checkout could not load: {{ error }}</template>
      </VueStripeCheckoutElementsProvider>
    </q-page>
  </template>
  ```

  `CheckoutForm.vue` is the form from [Build the form](/guide/custom-checkout#_3-build-the-form), and `/api/checkout-session` is a second route in the middleware that creates the session as in [step 1 of that guide](/guide/custom-checkout#_1-create-the-session-on-your-server).

- To render a part of the page in the browser only, wrap it in [`<q-no-ssr>`](https://quasar.dev/vue-components/no-ssr). Code inside it does not run on the server, so a sample that starts its request in `setup` is safe there.

## Result

Stripe.js loads under the starter's Content Security Policy, the key comes from a `QCLI_` variable, every page can use the elements through the plugin, and the customer returns to your return page after a redirect. In SSR mode the server renders the page without loading Stripe.js, serves `/api` itself, and no request starts during server rendering.

## See also

- [Install and set up](/guide/installation): the setup for other build tools
- [Use Vue Stripe with Nuxt and SSR](/guide/ssr): how server rendering and hydration work with Vue Stripe
- [Provide Stripe app-wide](/guide/plugin): plugin options, and combining it with providers
- [Troubleshoot common problems](/guide/troubleshooting)
