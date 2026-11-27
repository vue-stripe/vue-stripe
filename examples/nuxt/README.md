# Vue Stripe: Nuxt 4 Payment Element

A Nuxt 4 app that takes a one-time $10.00 payment with the [Payment Element](https://vuestripe.com/guide/payment-element). A Nuxt server route creates the PaymentIntent, the keys come from `runtimeConfig`, and Stripe sends the customer to a return page that shows the result. It follows [Use Vue Stripe with Nuxt and SSR](https://vuestripe.com/guide/ssr#nuxt).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/nuxt?file=app/pages/index.vue)

## Run it

You need Node.js 22 or later and your test keys from [API keys](https://dashboard.stripe.com/test/apikeys) in the Stripe Dashboard.

```bash
npx degit vue-stripe/vue-stripe/examples/nuxt my-app
cd my-app
cp .env.example .env
```

Paste your keys into `.env`. Nuxt maps `NUXT_` variables onto `runtimeConfig`, and only the `NUXT_PUBLIC_` ones reach the browser:

```ini
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NUXT_STRIPE_SECRET_KEY=sk_test_...
```

```bash
npm install
npm run dev
```

Open http://localhost:3000 and pay with the test card `4242 4242 4242 4242`, any future expiry date, any CVC and any postal code ([more test cards](https://docs.stripe.com/testing)).

For production, build and start the server. `nuxt dev` reads `.env`; the production server needs the variables in its environment:

```bash
npm run build
npm run preview   # node --env-file=.env .output/server/index.mjs
```

## How it works

| File | Role |
| --- | --- |
| `nuxt.config.ts` | Loads Vue Stripe's stylesheet and declares the `runtimeConfig` keys. |
| `server/api/payment-intent.post.ts` | `POST /api/payment-intent` creates a PaymentIntent with the secret key. The server sets the amount. |
| `app/pages/index.vue` | Fetches the client secret with `useFetch(..., { server: false })`, so a server render does not create a PaymentIntent, then renders the form. |
| `app/components/PaymentForm.vue` | `VueStripePaymentElement` and `usePaymentIntent().confirmPayment()`, which redirects to `/payment-complete`. |
| `app/pages/payment-complete.vue`, `app/components/PaymentStatus.vue` | Read the PaymentIntent's status from the client secret in the URL. |

Nuxt auto-imports its own functions and the components in `app/components/`; the Vue Stripe components are imported where they are used.

## In StackBlitz

`.stackblitzrc` sets the docs' test publishable key and `NUXT_PUBLIC_API_BASE=https://backend.vuestripe.com`, so the page calls the Vue Stripe demo backend's `/api/payment-intent` instead of its own server route, which would need a secret key. Leave `NUXT_PUBLIC_API_BASE` empty to use the server route.

## Before you go live

- Fulfil orders from the `payment_intent.succeeded` [webhook](https://vuestripe.com/guide/ssr#_7-receive-webhooks), not from the return page.
- Create the PaymentIntent for the customer's actual order, not a fixed amount.
- `nuxi generate` does not include server routes; see [static hosting](https://vuestripe.com/guide/ssr#static-hosting-with-nuxi-generate).
