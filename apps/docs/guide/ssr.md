---
description: "Use Vue Stripe with Nuxt and other server-rendered Vue apps: fetch client secrets in the browser, keep the key set on the server, and add the return pages."
---

# Use Vue Stripe with Nuxt and SSR

Render pages that use Vue Stripe on the server. This page lists what every server-rendered app needs, then sets up Nuxt step by step. Other setups have their own pages:

- [Use Vue Stripe in a Vite SSR app](/guide/vite-ssr), for your own server with `vue/server-renderer`
- [Use Vue Stripe in VitePress](/guide/vitepress)
- [Quasar SSR](#quasar-ssr), below

Stripe.js only runs in the browser. Vue Stripe never loads it on the server: `VueStripeProvider` loads Stripe.js in `onMounted`, and the [plugin](/guide/plugin) loads it the first time a component reads it in the browser. During server rendering every provider renders its `#loading` slot, and the browser's first render matches it, so hydration does not mismatch. After hydration Stripe.js loads and the elements mount.

From 6.0.0-beta.1 no bundler setting is needed: the package loads in Node as it is. What you set up is where the keys live, and where the client secret is fetched.

## What every SSR app needs

### Fetch client secrets in the browser

`setup()` and `<script setup>` also run on the server. A request started there runs on every server render, and a relative URL such as `fetch('/api/checkout-elements-session')` has no origin on the server, so Node's `fetch` rejects with "Failed to parse URL". When nothing handles that rejection, Node exits: one page view stops a Vite SSR or Quasar SSR server, in development and in production. Nuxt catches the rejection and logs it.

- **`VueStripeElements`:** fetch the client secret in `onMounted`, which runs only in the browser, as [the Payment Element guide](/guide/payment-element#_2-load-stripe-and-create-the-elements-group) does. In Nuxt, `useFetch(..., { server: false })` does the same.
- **`VueStripeCheckoutElementsProvider`, `VueStripeCheckoutFormProvider` and `VueStripeEmbeddedCheckout`:** don't pass a Promise created at the top of `<script setup>` in `client-secret`. Pass a function in `fetch-client-secret`. The provider calls it in the browser only, once Stripe.js has loaded:

```vue
<!-- CheckoutPage.vue -->
<script setup lang="ts">
import { VueStripeProvider, VueStripeCheckoutElementsProvider } from '@vue-stripe/vue-stripe'
import CheckoutForm from './CheckoutForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Called by the provider in the browser only, once Stripe.js has loaded.
const fetchClientSecret = () =>
  fetch('/api/checkout-elements-session', { method: 'POST' })
    .then((response) => response.json())
    .then((data: { clientSecret: string }) => data.clientSecret)
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutElementsProvider :fetch-client-secret="fetchClientSecret">
      <CheckoutForm />

      <template #loading>Loading checkout...</template>
      <template #error="{ error }">Checkout could not load: {{ error }}</template>
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>
```

`CheckoutForm` is the form from [Build your own checkout page on a Checkout Session](/guide/custom-checkout#_3-build-the-form). The server renders the providers' loading state, and the browser creates one session per visit.

### Set the publishable key where the server can read it

`VueStripeProvider` throws "publishableKey or stripeKey is required" during setup when its key is empty. On the server that turns the whole response into an HTTP 500 before any browser code runs. The server process needs the key in production as well as in development; each setup below says where it reads it from. The [plugin](/guide/plugin) does not throw: with an empty key the page renders, and the error appears in the browser when Stripe.js loads.

<a id="nuxt-3"></a>

## Nuxt

The paths below follow Nuxt 4, which reads plugins, pages and components from the `app/` directory. On Nuxt 3, or in a Nuxt 4 project that keeps the Nuxt 3 layout (no `app/` directory), drop the `app/` prefix: `plugins/`, `pages/` and `components/` sit at the project root. `server/` stays at the root in both.

### 1. Install the packages

Install Vue Stripe and Stripe.js, plus Stripe's Node library for the server routes:

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10 stripe
```

Nuxt builds without `stripe` installed; the server routes then fail at runtime with `ERR_MODULE_NOT_FOUND`.

### 2. Configure Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@vue-stripe/vue-stripe/style.css'],
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

`nuxi dev` reads `.env`; the production server does not. Set the two variables in the server's environment, or pass the file to Node when you start the build:

```bash
npx nuxi build
node --env-file=.env .output/server/index.mjs
```

Without them every page that renders `VueStripeProvider` answers 500 "publishableKey or stripeKey is required", and the server routes fail with an empty secret key.

### 3. Provide Stripe

Either install the plugin once, so every page can use the elements and composables without a provider:

```ts
// app/plugins/vue-stripe.ts
import { createVueStripe } from '@vue-stripe/vue-stripe'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  nuxtApp.vueApp.use(
    createVueStripe({ publishableKey: config.public.stripePublishableKey })
  )
})
```

or wrap the payment part of each page in `VueStripeProvider`, as in steps 5 and 6 below.

### 4. Create the Intent in a server route

```ts
// server/api/payment-intent.post.ts
import Stripe from 'stripe'

export default defineEventHandler(async () => {
  const stripe = new Stripe(useRuntimeConfig().stripeSecretKey)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // decide the amount on the server
    currency: 'usd',
    automatic_payment_methods: { enabled: true }
  })

  return { clientSecret: paymentIntent.client_secret }
})
```

The amount, $20.00, matches the "Pay $20.00" button of the `PaymentForm` in step 5. Change both together.

### 5. Render the payment form

Fetch the client secret in the browser (`server: false`), so a page render does not create a PaymentIntent:

```vue
<!-- app/pages/checkout/index.vue -->
<script setup lang="ts">
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()
const { data, error } = await useFetch('/api/payment-intent', { method: 'POST', server: false })
</script>

<template>
  <p v-if="error">Could not start the payment. Please reload the page.</p>
  <VueStripeProvider v-else :publishable-key="config.public.stripePublishableKey">
    <VueStripeElements v-if="data?.clientSecret" :client-secret="data.clientSecret">
      <!-- app/components/PaymentForm.vue renders the Payment Element and calls usePaymentIntent() -->
      <PaymentForm :client-secret="data.clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

`PaymentForm` is the component from [Accept a payment with the Payment Element](/guide/payment-element#_3-render-the-payment-element-and-confirm). With the plugin from step 3, drop the `VueStripeProvider` wrapper.

Name the file `checkout/index.vue`, not `checkout.vue`. Nuxt treats `app/pages/checkout/complete.vue`, the Checkout Session return page below, as a child route of `checkout.vue`, and because that page has no `<NuxtPage />`, `/checkout/complete` would show the payment form again.

When the server route fails (a wrong secret key, Stripe unreachable), `useFetch` sets `error` and leaves `data` empty; the page then shows the message instead of an empty form.

Check `data?.clientSecret`, not only `data`. `useFetch` takes its type from the server route, and stripe-node types `client_secret` as `string | null`, so `nuxi typecheck` rejects `data.clientSecret` as a `client-secret` until the template has ruled out `null`.

`ref`, `useFetch` and the other Nuxt and Vue functions are auto-imported. Import the Vue Stripe components yourself, or register them in a plugin.

### 6. Show the result on the return page

`PaymentForm` confirms with `return_url: ${window.location.origin}/payment-complete`, so after a successful payment Stripe sends the customer to `/payment-complete`, with `payment_intent_client_secret` in the query string. Read the result there in a component inside the provider:

```vue
<!-- app/components/PaymentStatus.vue -->
<script setup lang="ts">
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const route = useRoute()
const { retrievePaymentIntent } = usePaymentIntent()
const status = ref('')

onMounted(async () => {
  const clientSecret = route.query.payment_intent_client_secret
  if (typeof clientSecret !== 'string') return
  const { paymentIntent, error } = await retrievePaymentIntent(clientSecret)
  status.value = error ? 'unknown' : (paymentIntent?.status ?? 'unknown')
})
</script>

<template>
  <p v-if="status === 'succeeded'">Payment received.</p>
  <p v-else-if="status === 'processing'">Your payment is processing. We will email you when it completes.</p>
  <p v-else-if="status === 'requires_payment_method'">The payment failed. Please try another payment method.</p>
  <p v-else-if="status">We could not check the payment status. Please contact us.</p>
</template>
```

```vue
<!-- app/pages/payment-complete.vue -->
<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()
</script>

<template>
  <VueStripeProvider :publishable-key="config.public.stripePublishableKey">
    <PaymentStatus />
  </VueStripeProvider>
</template>
```

With the plugin, render `<PaymentStatus />` without the provider. Use this page to inform the customer only; fulfil orders from [webhooks](/guide/webhooks).

### Build the page on a Checkout Session instead

[`VueStripeCheckoutElementsProvider`](/api/components/stripe-checkout-provider) and [`VueStripeCheckoutFormProvider`](/api/components/stripe-checkout-form-provider) take the client secret as a string or a Promise. In Nuxt, pass a function in `fetch-client-secret` instead, as in [every SSR app](#fetch-client-secrets-in-the-browser): a Promise created at the top of `<script setup>` would start the request on the server for every render.

1. Create the session in a server route. Checking `client_secret` gives the page a `string`, and catches a session created without `ui_mode: 'elements'`:

   ```ts
   // server/api/checkout-elements-session.post.ts
   import Stripe from 'stripe'

   export default defineEventHandler(async (event) => {
     const stripe = new Stripe(useRuntimeConfig().stripeSecretKey)

     const session = await stripe.checkout.sessions.create({
       ui_mode: 'elements',
       mode: 'payment',
       line_items: [{ price: 'price_123', quantity: 1 }],
       return_url: `${getRequestURL(event).origin}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`
     })

     if (!session.client_secret) {
       throw createError({ statusCode: 500, statusMessage: 'Checkout Session has no client secret' })
     }
     return { clientSecret: session.client_secret }
   })
   ```

2. Pass the request as a function:

   ```vue
   <!-- app/pages/custom-checkout.vue -->
   <script setup lang="ts">
   import { VueStripeProvider, VueStripeCheckoutElementsProvider } from '@vue-stripe/vue-stripe'

   const config = useRuntimeConfig()

   // Called by the provider in the browser only, once Stripe.js has loaded.
   const fetchClientSecret = () =>
     $fetch('/api/checkout-elements-session', { method: 'POST' }).then((data) => data.clientSecret)
   </script>

   <template>
     <VueStripeProvider :publishable-key="config.public.stripePublishableKey">
       <VueStripeCheckoutElementsProvider :fetch-client-secret="fetchClientSecret">
         <!-- app/components/CheckoutForm.vue uses useCheckoutSession() -->
         <CheckoutForm />

         <template #loading>Loading checkout...</template>
         <template #error="{ error }">Checkout could not load: {{ error }}</template>
       </VueStripeCheckoutElementsProvider>
     </VueStripeProvider>
   </template>
   ```

   `CheckoutForm` is the form from [Build your own checkout page on a Checkout Session](/guide/custom-checkout#_3-build-the-form). `VueStripeCheckoutFormProvider` and [`VueStripeEmbeddedCheckout`](/api/components/stripe-embedded-checkout) take the same `fetch-client-secret` prop.

3. Check the session on the return page. Stripe redirects to the session's `return_url`, `/checkout/complete?session_id=...`. Read the session on the server, with the same route as [Embed Stripe Checkout](/guide/embedded-checkout#_3-handle-completion):

   ```ts
   // server/api/checkout-status.get.ts
   import Stripe from 'stripe'

   export default defineEventHandler(async (event) => {
     const stripe = new Stripe(useRuntimeConfig().stripeSecretKey)
     const { session_id } = getQuery(event)
     if (typeof session_id !== 'string') {
       throw createError({ statusCode: 400, statusMessage: 'Missing session_id' })
     }

     const session = await stripe.checkout.sessions.retrieve(session_id)
     return { status: session.status, paymentStatus: session.payment_status }
   })
   ```

   ```vue
   <!-- app/pages/checkout/complete.vue -->
   <script setup lang="ts">
   const route = useRoute()
   const { data } = await useFetch('/api/checkout-status', {
     query: { session_id: route.query.session_id }
   })
   </script>

   <template>
     <p v-if="data?.paymentStatus === 'paid'">Payment received.</p>
     <p v-else-if="data?.status === 'complete'">Your payment is processing. We will email you when it completes.</p>
     <p v-else-if="data?.status === 'open'">The payment did not complete. <NuxtLink to="/custom-checkout">Try again</NuxtLink></p>
     <p v-else>We could not check the payment status. Please contact us.</p>
   </template>
   ```

   This page needs no Stripe.js, so it renders on the server. It works because the payment page is `checkout/index.vue` (step 5); next to a `checkout.vue` it would render as that page's child.

### Render on the client only

You don't have to, but if you prefer to send no Stripe markup from the server, wrap the form in `<ClientOnly>` (with a `#fallback` template) or move it into a component named `*.client.vue`.

## Quasar SSR

The full Quasar setup (the `QCLI_` key prefix, a boot file, the CSP, the dev proxy and an SSR middleware for `/api`) is in [Use Vue Stripe with Quasar](/guide/quasar#_8-run-in-ssr-mode). Use the components as in any Vue app, and fetch client secrets in the browser as in [every SSR app](#fetch-client-secrets-in-the-browser). A sample that starts a request at the top of `<script setup>`, such as a Promise in `client-secret`, stops the Quasar SSR server. `<q-no-ssr>` around the form is optional, as `<ClientOnly>` is in Nuxt:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VueStripeProvider, VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

defineProps<{ publishableKey: string }>()

const clientSecret = ref('')

onMounted(async () => {
  const response = await fetch('/api/create-payment-intent', { method: 'POST' })
  clientSecret.value = (await response.json()).clientSecret
})
</script>

<template>
  <q-no-ssr>
    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
        <VueStripePaymentElement />
      </VueStripeElements>
    </VueStripeProvider>
  </q-no-ssr>
</template>
```

Render `VueStripeElements` only once the client secret has arrived (`v-if`): created without one, the Payment Element fails with a `[Vue Stripe]` error in the console.

## VitePress

See [Use Vue Stripe in VitePress](/guide/vitepress): where VitePress reads the key, the plugin in `enhanceApp`, the dev proxy and the API of a static build.

## If something goes wrong

### The server process exits after one request

Node prints `TypeError: Failed to parse URL from /api/...` and stops. A component starts a request with a relative URL during server rendering, usually a Promise passed to `client-secret`. Pass a function in `fetch-client-secret`, or fetch in `onMounted`; see [Fetch client secrets in the browser](#fetch-client-secrets-in-the-browser).

### Every page answers 500 "publishableKey or stripeKey is required"

The server rendered `VueStripeProvider` with an empty key. In Nuxt's production server, set `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the environment or start it with `node --env-file=.env` ([step 2](#_2-configure-nuxt)). In a Vite SSR app, the key must be set when you run `vite build` ([Use Vue Stripe in a Vite SSR app](/guide/vite-ssr)).

### The server fails with `ERR_UNSUPPORTED_DIR_IMPORT`

Version `6.0.0-beta.0` imports `@stripe/stripe-js/pure` as a directory, which Node's ES module loader rejects when the server loads the package from `node_modules`. Update to 6.0.0-beta.1 or later. If you must stay on 6.0.0-beta.0, bundle the package for the server as a workaround: `build.transpile: ['@vue-stripe/vue-stripe']` in Nuxt, `ssr.noExternal: ['@vue-stripe/vue-stripe']` in Vite (`vite.ssr.noExternal` in VitePress).

### Hydration mismatch warnings

If you see a hydration mismatch, look for your own code that reads browser-only values (`window`, `localStorage`, the current time) during render, and move it into `onMounted`.

## Result

The server renders the page, including the providers' loading state, without loading Stripe.js. In the browser the page hydrates, Stripe.js loads once, and the elements appear. After paying, the customer lands on a return page that shows the result.
