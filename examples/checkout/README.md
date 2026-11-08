# Vue Stripe: Checkout Sessions

A Vite + Vue 3 app that sells one $20.00 product with Stripe Checkout, two ways:

- **Pay on Stripe's page:** the server creates a hosted Checkout Session and the app redirects to it with `useStripeCheckout().redirectToUrl()` ([guide](https://vuestripe.com/guide/checkout)).
- **Pay on this page:** `VueStripeEmbeddedCheckout` mounts Stripe's Checkout form in your page ([guide](https://vuestripe.com/guide/embedded-checkout)).

Both come back to the app with `?session_id=...`, and the app asks the server whether the session is paid.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/checkout?file=src/App.vue)

## Run it

You need Node.js 22 or later and your test keys from [API keys](https://dashboard.stripe.com/test/apikeys) in the Stripe Dashboard.

```bash
npx degit vue-stripe/vue-stripe/examples/checkout my-app
cd my-app
cp .env.example .env
```

Paste your keys into `.env`:

```ini
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

```bash
npm install
npm run dev
```

Open http://localhost:5173, choose a way to pay, and use the test card `4242 4242 4242 4242` with any future expiry date, any CVC and any name ([more test cards](https://docs.stripe.com/testing)).

## How it works

| File | Role |
| --- | --- |
| `server.js` | `POST /api/checkout-session` creates a Checkout Session: hosted (returns `url`) or `ui_mode: 'embedded_page'` (returns `clientSecret`). `GET /api/checkout-status` reads a session's status. |
| `vite.config.ts` | Proxies `/api` from the Vite dev server to `server.js` on port 3000. |
| `src/App.vue` | The two buttons, the redirect, and `VueStripeEmbeddedCheckout` with a `fetch-client-secret` function. |
| `src/CheckoutResult.vue` | The return view: asks `/api/checkout-status` whether the session is paid. |

The line items are an inline `price_data` in `server.js`. To sell a Price from your Stripe account, replace it with `{ price: 'price_...', quantity: 1 }`.

## In StackBlitz

StackBlitz runs `npm run client` only, without `server.js`, and `.stackblitzrc` points the app at the Vue Stripe demo backend with the docs' test publishable key. The demo backend has no `/api/checkout-status` route, so after paying the app shows the session ID instead of the paid status. Run the example locally to see the full flow.

## Before you go live

- Fulfil orders from the `checkout.session.completed` [webhook](https://vuestripe.com/guide/webhooks), not from the return page.
- Build the success, cancel and return URLs on the server from your site's address, instead of taking them from the request.
