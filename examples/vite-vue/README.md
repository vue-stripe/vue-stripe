# Vue Stripe: Vite + Vue Payment Element

A Vite + Vue 3 app that takes a one-time $10.00 payment with the [Payment Element](https://vuestripe.com/guide/payment-element), and a Node server of about 20 lines that creates the PaymentIntent. It is the finished app from the [first-payment tutorial](https://vuestripe.com/guide/first-payment), with error handling and a return page added.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/vite-vue?file=src/App.vue)

## Run it

You need Node.js 22 or later and your test keys from [API keys](https://dashboard.stripe.com/test/apikeys) in the Stripe Dashboard.

```bash
npx degit vue-stripe/vue-stripe/examples/vite-vue my-app
cd my-app
cp .env.example .env
```

Paste your keys into `.env`:

```ini
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Install and start the app and the server together:

```bash
npm install
npm run dev
```

Open http://localhost:5173 and pay with the test card `4242 4242 4242 4242`, any future expiry date, any CVC and any postal code. Try `4000 0025 0000 3155` for 3D Secure and `4000 0000 0000 0002` for a declined card ([more test cards](https://docs.stripe.com/testing)).

## How it works

| File | Role |
| --- | --- |
| `server.js` | `POST /api/payment-intent` creates a PaymentIntent with your secret key and returns its client secret. The server sets the amount. |
| `vite.config.ts` | Proxies `/api` from the Vite dev server to `server.js` on port 3000. |
| `src/main.ts` | Imports Vue Stripe's stylesheet. |
| `src/App.vue` | Fetches the client secret, then renders `VueStripeProvider` > `VueStripeElements` > `PaymentForm`. |
| `src/PaymentForm.vue` | `VueStripePaymentElement` and `usePaymentIntent().confirmPayment()`. Cards finish on the page; payment methods that need a redirect come back to `/`. |
| `src/PaymentStatus.vue` | After such a redirect, reads the PaymentIntent's status with `retrievePaymentIntent()`. |

The browser only ever sees the publishable key: Vite exposes only variables that start with `VITE_`.

## In StackBlitz

StackBlitz runs `npm run client` only, without `server.js`, and `.stackblitzrc` points the app at the Vue Stripe demo backend (`VITE_API_URL=https://backend.vuestripe.com`) with the docs' test publishable key. To use your own account there, set `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_API_URL` in `.stackblitzrc` to your key and your server.

## Before you go live

- Fulfil orders from the `payment_intent.succeeded` [webhook](https://vuestripe.com/guide/webhooks), not from the page: a customer can close the tab before the page shows the result.
- Create the PaymentIntent for the customer's actual order, not a fixed amount.
- Serve the app over HTTPS.
