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

VitePress reads env files from its source directory, the one you pass to `vitepress dev` (or `srcDir` if you set it), not from the folder that holds `package.json`. A `.env.local` in the project root is ignored: the key is `undefined`, `VueStripeProvider` throws "publishableKey or stripeKey is required", and the page renders blank.

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

## 4. Forward `/api` in development

The guides call your server at `/api` on the site's own origin. VitePress takes Vite options under `vite` in its config, so the [dev proxy](/guide/installation#_5-send-api-requests-to-your-server) goes there. Replace `3000` with the port your API listens on:

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

`cleanUrls: true` makes `/payment-complete`, the `return_url` that step 5 uses, a valid address of the built site. Without it the built page is only reachable as `/payment-complete.html`.

## 5. Add the payment pages

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

Run your API and `npx vitepress dev docs`, open `/payment`, and pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC. Stripe redirects to `/payment-complete`, which shows "Payment received."

## 6. Serve the API next to the built site

`vitepress build docs` writes static files to `docs/.vitepress/dist`. There is no server behind them, and `vitepress preview` does not apply the dev proxy, so every `fetch('/api/...')` answers 404 and `PaymentPage` shows "Could not start the payment. Please reload the page."

Serve the site and the API from one origin. One way is to let your Node API serve the built files. Install the server's packages: Express, Stripe's Node library, and `sirv`, the static file server that `vitepress preview` uses:

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
    automatic_payment_methods: { enabled: true }
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

```bash
npx vitepress build docs
node --env-file=.env server.mjs
```

The `.mjs` extension makes Node load the file as an ES module whatever `"type"` your `package.json` sets; `npm init` writes `"type": "commonjs"`, under which `import` in a `.js` file fails with "Cannot use import statement outside a module". Don't serve the build with `express.static`: it answers 404 for a page such as `/checkout` when the build also has a `checkout/` directory, for example for a `/checkout/complete` return page.

Keep `STRIPE_SECRET_KEY` in a `.env` file in the project root (outside `docs/`, so VitePress never reads it), or set it in the server's environment. In development the same server is the API that step 4 forwards to. A reverse proxy in front of the static host works as well, or call the API by its full URL and allow the site's origin with CORS on the server.

## Checkout Session pages

For `VueStripeCheckoutElementsProvider`, `VueStripeCheckoutFormProvider` and `VueStripeEmbeddedCheckout`, pass a function in `fetch-client-secret`, as in [What every SSR app needs](/guide/ssr#fetch-client-secrets-in-the-browser). A Promise created at the top of `<script setup>` would start the request while VitePress builds the page.

The session routes go in `server.mjs` next to the PaymentIntent route. Build their `return_url` or `success_url` from the site's address, kept in the server's `.env`:

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
```

`SITE_URL` is the address in the customer's browser: the `vitepress dev` address in development, `http://localhost:3000` while `server.mjs` serves the build on your machine, and your public URL in production. Don't build it from the request's `Host` header: the step 4 proxy rewrites `Host` to the API's address, so in development `req.get('host')` is `localhost:3000`, and Stripe would send the customer to the API server instead of the site.

## Result

`vitepress build` writes each payment page with the providers' loading state. In the browser the page hydrates, Stripe.js loads once, the Payment Element mounts, and after paying the customer lands on `/payment-complete`.
