---
description: "Use Vue Stripe in VitePress: where the key goes, the plugin in enhanceApp, the dev proxy, and an API next to the static build."
---

# Use Vue Stripe in VitePress

Take a test payment from a VitePress page. The steps assume the usual layout: `package.json` in the project root and the site in `docs/`, run with `vitepress dev docs`.

VitePress renders every page to static HTML at build time. Vue Stripe components render their loading state there, Stripe.js loads only in the browser, and the pages hydrate without mismatch. What differs from a plain Vite app is where the key, the plugin and the dev proxy go, and that a built site has no server for your API.

## 1. Install the packages

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```

## 2. Add the publishable key

Put the key in `.env.local` inside the site directory, next to `.vitepress/`:

```bash
# docs/.env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

VitePress reads env files from its source directory, the one you pass to `vitepress dev` (or `srcDir` if you set it), not from the folder that holds `package.json`. A `.env.local` in the project root is ignored, and the key is `undefined`. A `VueStripeProvider`, such as the one in `PaymentPage.vue` (step 6), then throws "publishableKey or stripeKey is required" and the payment form is missing; `vitepress build` logs the error for each such page and still succeeds. Elements that get Stripe from the plugin show Stripe.js' message "Expected publishable key to be of type string, got type undefined instead."

## 3. Import the stylesheet and install the plugin

VitePress has no `main.ts`. Import the stylesheet in the theme, and install the [plugin](/guide/plugin) in `enhanceApp`:

```ts
// docs/.vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(createVueStripe({ publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY }))
  }
} satisfies Theme
```

`enhanceApp` also runs when the build renders pages; there the plugin only provides, and Stripe.js loads in the browser. The plugin is optional: without it, wrap each payment component in `VueStripeProvider`.

## 4. Add the API

The guides call your server at `/api` on the site's own origin. This guide uses one small Node server: it answers `/api` in development, and in step 7 it also serves the built site. Install Express, Stripe's Node library, and `sirv`, the static file server that `vitepress preview` uses:

```bash
npm install express stripe sirv
```

```js
// server.mjs
import express from 'express'
import sirv from 'sirv'
import Stripe from 'stripe'

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/create-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // decide the amount on the server
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: 'order_123' } // your own order ID, read back by the webhook
  })
  res.json({ clientSecret: paymentIntent.client_secret })
})

// extensions: '/payment-complete' serves payment-complete.html, as cleanUrls expects,
// also next to a directory of the same name (checkout.html and checkout/).
// dev: look files up on each request, so the server starts before the first build
// and serves a new build without a restart.
app.use(sirv('docs/.vitepress/dist', { extensions: ['html'], dev: true }))

app.listen(3000)
```

Keep `STRIPE_SECRET_KEY` in a `.env` file in the project root (outside `docs/`, so VitePress never reads it), or set it in the server's environment:

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
```

Start the server and leave it running:

```bash
node --env-file=.env server.mjs
```

The `.mjs` extension makes Node load the file as an ES module whatever `"type"` your `package.json` sets; `npm init` writes `"type": "commonjs"`, under which `import` in a `.js` file fails with "Cannot use import statement outside a module". Don't serve the build with `express.static`: it answers 404 for a page such as `/checkout` when the build also has a `checkout/` directory, as the [Checkout Session pages](#checkout-session-pages) below do.

## 5. Forward `/api` in development

`vitepress dev` serves the site on its own port. VitePress takes Vite options under `vite` in its config, so the [dev proxy](/guide/installation#_5-send-api-requests-to-your-server) that sends `/api` to the server from step 4 goes there. If you changed the port in `server.mjs`, change `3000` here as well:

```ts
// docs/.vitepress/config.mts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My site',
  cleanUrls: true,
  vite: {
    server: {
      proxy: { '/api': 'http://localhost:3000' }
    }
  }
})
```

`cleanUrls: true` makes `/payment-complete`, the `return_url` that step 6 uses, a valid address of the built site. Without it the built page is only reachable as `/payment-complete.html`.

## 6. Add the payment pages

Put the components from the guides in `docs/components/`:

- `PaymentPage.vue` and `PaymentForm.vue` from [Accept a payment with the Payment Element](/guide/payment-element#_2-load-stripe-and-create-the-elements-group). `PaymentPage` fetches the client secret in `onMounted`, which never runs during the build.
- `CompletePage.vue` from [Check the result on the return page](/guide/error-handling#_4-check-the-result-on-the-return-page). The plugin gives it Stripe without a provider.

Then use them in Markdown pages:

```md
<!-- docs/payment.md -->
<script setup lang="ts">
import PaymentPage from './components/PaymentPage.vue'
</script>

# Pay

<PaymentPage />
```

```md
<!-- docs/payment-complete.md -->
<script setup lang="ts">
import CompletePage from './components/CompletePage.vue'
</script>

# Payment status

<CompletePage />
```

With the server from step 4 running, start VitePress with `npx vitepress dev docs`, open `/payment`, and pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Stripe redirects to `/payment-complete`, which shows "Payment received."

## 7. Serve the built site

`vitepress build docs` writes static files to `docs/.vitepress/dist`. There is no server behind them, and `vitepress preview` does not apply the dev proxy, so every `fetch('/api/...')` answers 404 and `PaymentPage` shows "Could not start the payment. Please reload the page."

Serve the site and the API from one origin. The server from step 4 already does: its `sirv` line serves the built files next to the API routes. Build the site and open it at `http://localhost:3000`:

```bash
npx vitepress build docs
node --env-file=.env server.mjs
```

The server finds a new build without a restart, so if it is still running from step 4, building is enough. A reverse proxy in front of the static host works as well, or call the API by its full URL and allow the site's origin with CORS on the server.

## Checkout Session pages

For `VueStripeCheckoutElementsProvider`, `VueStripeCheckoutFormProvider` and `VueStripeEmbeddedCheckout`, pass a function in `fetch-client-secret`, as in [What every SSR app needs](/guide/ssr#fetch-client-secrets-in-the-browser). A Promise created at the top of `<script setup>` would start the request while VitePress builds the page.

The steps below build a page on a Checkout Session with your own form, and the return page that every Checkout Session integration needs. Put the components in `docs/components/`:

- `CheckoutPage.vue` from [What every SSR app needs](/guide/ssr#fetch-client-secrets-in-the-browser), and `CheckoutForm.vue` from [Build your own checkout page on a Checkout Session](/guide/custom-checkout#_3-build-the-form).
- `SuccessPage.vue` from [Redirect to Stripe Checkout](/guide/checkout#_3-show-the-outcome-on-the-success-page). It asks your server for the session's status in `onMounted`, so the build does not call the API.

Then use them in Markdown pages. The return page goes in `docs/checkout/`, so its address is `/checkout/complete`:

```md
<!-- docs/checkout.md -->
<script setup lang="ts">
import CheckoutPage from './components/CheckoutPage.vue'
</script>

# Checkout

<CheckoutPage />
```

```md
<!-- docs/checkout/complete.md -->
<script setup lang="ts">
import SuccessPage from '../components/SuccessPage.vue'
</script>

# Order status

<SuccessPage />
```

The session routes go in `server.mjs` next to the PaymentIntent route, before the `sirv` line. Build their `return_url` or `success_url` from the site's address, kept in the server's `.env`:

```bash
# .env
SITE_URL=http://localhost:5173
```

```js
// server.mjs
app.post('/api/checkout-elements-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'elements',
    mode: 'payment',
    line_items: [{ price: 'price_123', quantity: 1 }],
    return_url: `${process.env.SITE_URL}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`
  })
  res.json({ clientSecret: session.client_secret })
})

// GET /api/checkout-status?session_id=cs_test_..., read by SuccessPage.vue
app.get('/api/checkout-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id)
    res.json({ status: session.status, paymentStatus: session.payment_status })
  } catch {
    res.status(404).json({ error: 'No such Checkout Session' })
  }
})
```

Restart the server after editing `server.mjs`, open `/checkout`, and pay with the test card. Stripe redirects to `/checkout/complete`, which shows "Thank you! Your payment was received." For [Embed Stripe Checkout](/guide/embedded-checkout#_1-create-the-session-on-your-server), the [Checkout Form](/guide/checkout-form#_1-create-the-session-on-your-server) and [Redirect to Stripe Checkout](/guide/checkout#_1-create-a-checkout-session-on-your-server), point `return_url` (or `success_url` for the redirect) at the same `/checkout/complete?session_id={CHECKOUT_SESSION_ID}` page.

`SITE_URL` is the address in the customer's browser: the `vitepress dev` address in development, `http://localhost:3000` while `server.mjs` serves the build on your machine, and your public URL in production. Don't build it from the request's `Host` header: the step 5 proxy rewrites `Host` to the API's address, so in development `req.get('host')` is `localhost:3000`, and Stripe would send the customer to the API server instead of the site.

## Result

`vitepress build` writes each payment page with the providers' loading state. In the browser the page hydrates, Stripe.js loads once, the Payment Element mounts, and after paying the customer lands on `/payment-complete`.
