# Vue Stripe: Subscriptions

A Vite + Vue 3 app that sells a subscription with the Payment Element. The customer picks a plan and enters an email; the server creates the subscription, and the app pays its first invoice with `usePaymentIntent().confirmPayment()`, which makes the subscription active. It follows [Start a subscription](https://vuestripe.com/guide/subscriptions).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/vue-stripe/vue-stripe/tree/main/examples/subscriptions?file=src/App.vue)

## Run it

You need Node.js 22 or later and your test keys from [API keys](https://dashboard.stripe.com/test/apikeys) in the Stripe Dashboard.

```bash
npx degit vue-stripe/vue-stripe/examples/subscriptions my-app
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

Open http://localhost:5173. The plans are your account's active recurring prices; on an account without any, the server creates a $10.00 monthly "Vue Stripe example plan". Pick one, enter any email, and pay with the test card `4242 4242 4242 4242`, any future expiry date, any CVC and any postal code ([more test cards](https://docs.stripe.com/testing)). The subscription then shows as **Active** under [Subscriptions](https://dashboard.stripe.com/test/subscriptions).

## How it works

| File | Role |
| --- | --- |
| `server.js` | `GET /api/products` lists the recurring prices. `POST /api/subscription` finds or creates the customer by email and creates the subscription with `payment_behavior: 'default_incomplete'`, returning the first invoice's client secret. |
| `vite.config.ts` | Proxies `/api` from the Vite dev server to `server.js` on port 3000. |
| `src/App.vue` | The plan picker and email form, then `VueStripeElements` with the invoice's client secret. |
| `src/PaymentForm.vue` | `VueStripePaymentElement` and `confirmPayment()`. The card is saved as the subscription's default payment method for the next invoices. |
| `src/PaymentStatus.vue` | After a payment method that redirects, reads the payment's status. |

## In StackBlitz

StackBlitz runs `npm run client` only, without `server.js`, and `.stackblitzrc` points the app at the Vue Stripe demo backend with the docs' test publishable key. The demo account's metered plan (Day Pass Credits) cannot be subscribed to this way; pick one of the yearly passes.

## Before you go live

- Grant and revoke access from [webhooks](https://vuestripe.com/guide/webhooks) such as `invoice.paid` and `customer.subscription.deleted`, not from the page.
- Identify customers by your own signed-in user, not by an email typed into a form.
- Let customers manage or cancel their subscription with the [customer portal](https://docs.stripe.com/customer-management).
