# Vue Stripe examples

Small, runnable starter apps for [Vue Stripe](https://vuestripe.com). Each one is a standalone npm project on the published [`@vue-stripe/vue-stripe`](https://www.npmjs.com/package/@vue-stripe/vue-stripe) 6, with its own server, so you can copy the folder and start from there.

| Example | What it shows | Try it |
| --- | --- | --- |
| [`vite-vue`](./vite-vue) | Vite + Vue 3: a one-time payment with the Payment Element, `usePaymentIntent()` and a Node server | [Open in StackBlitz](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/vite-vue?file=src/App.vue) |
| [`nuxt`](./nuxt) | Nuxt 4: the same payment with a server route, `runtimeConfig` keys and a return page | [Open in StackBlitz](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/nuxt?file=app/pages/index.vue) |
| [`checkout`](./checkout) | Checkout Sessions: hosted Stripe Checkout (redirect) and embedded Checkout on your page | [Open in StackBlitz](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/checkout?file=src/App.vue) |
| [`subscriptions`](./subscriptions) | Subscriptions: pick a plan, create the subscription and pay its first invoice with the Payment Element | [Open in StackBlitz](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/subscriptions?file=src/App.vue) |

## Run one locally

You need Node.js 22 or later and a Stripe account with your test keys from [API keys](https://dashboard.stripe.com/test/apikeys).

```bash
npx degit vue-stripe/vue-stripe/examples/vite-vue my-app   # or nuxt, checkout, subscriptions
cd my-app
cp .env.example .env    # then paste your test keys
npm install
npm run dev
```

Each example's README has the details.

## In StackBlitz

StackBlitz runs only the browser side: your secret key does not belong in a shared sandbox. The StackBlitz links use the Vue Stripe docs' test publishable key and the public demo backend at `https://backend.vuestripe.com`, which serves the same `/api` routes as each example's server. Everything runs in Stripe test mode, so nothing is charged. Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

To use your own Stripe account, run the example locally as above.

## More

- [Documentation](https://vuestripe.com) and the [first-payment tutorial](https://vuestripe.com/guide/first-payment)
- [Live demos](https://vuestripe.com/live-demo/) of every component, each with its source and an Open in StackBlitz button
