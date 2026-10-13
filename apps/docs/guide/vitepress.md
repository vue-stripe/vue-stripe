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

`vitepress build docs` writes static files to `docs/.vitepress/dist`. There is no server behind them, and `vitepress preview` does not apply the dev proxy, so every `fetch('/api/...')` answers 404 and `PaymentPage` shows "Failed to initialize payment".

Serve the site and the API from one origin. One way is to let your Node API serve the built files:

```js
// server.js
import express from 'express'
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

// extensions: '/payment-complete' serves payment-complete.html, as cleanUrls expects
app.use(express.static('docs/.vitepress/dist', { extensions: ['html'] }))

app.listen(3000)
```

```bash
npx vitepress build docs
node --env-file=.env server.js
```

Keep `STRIPE_SECRET_KEY` in a `.env` file in the project root (outside `docs/`, so VitePress never reads it), or set it in the server's environment. In development the same server is the API that step 4 forwards to. A reverse proxy in front of the static host works as well, or call the API by its full URL and allow the site's origin with CORS on the server.

## Checkout Session pages

For `VueStripeCheckoutElementsProvider`, `VueStripeCheckoutFormProvider` and `VueStripeEmbeddedCheckout`, pass a function in `fetch-client-secret`, as in [What every SSR app needs](/guide/ssr#fetch-client-secrets-in-the-browser). A Promise created at the top of `<script setup>` would start the request while VitePress builds the page.

## Result

`vitepress build` writes each payment page with the providers' loading state. In the browser the page hydrates, Stripe.js loads once, the Payment Element mounts, and after paying the customer lands on `/payment-complete`.
