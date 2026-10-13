---
description: "Install @vue-stripe/vue-stripe and @stripe/stripe-js, import the stylesheet, set your publishable key and check that Stripe.js loads in your Vue app."
---

# Install and set up

Add Vue Stripe to an existing Vue app, load its stylesheet, configure your publishable key and check that Stripe.js loads.

Requirements: Vue 3 or Vue 2.7, and `@stripe/stripe-js` `^10.0.0` (Stripe.js Endive). Vue 2.6 is not supported; the full list is under [Compatibility](/api/#compatibility). Upgrading from v5? See [Upgrade from v5 to v6](/guide/migration-v6).

## 1. Install the package

Install Vue Stripe together with Stripe.js:

::: code-group
```bash [npm]
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```

```bash [pnpm]
pnpm add @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```

```bash [yarn]
yarn add @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```
:::

The version ranges select Vue Stripe 6 and Stripe.js 10, now and after 6.0.0 is released. Without them, the package manager installs Vue Stripe 5 while 6.0.0 is still a beta, and these docs do not apply to it. If the app already has an older `@stripe/stripe-js`, the same command upgrades it.

Type definitions ship with the package; Stripe.js types such as `Stripe`, `StripeElements` and `PaymentIntent` are re-exported from `@vue-stripe/vue-stripe`.

## 2. Import the stylesheet

The components ship their styles as a separate file. Import it once, in your app entry (`main.ts` or `main.js`):

```ts
import '@vue-stripe/vue-stripe/style.css'
```

To change how the elements look, see [Style elements](/guide/styling).

## 3. Add your publishable key

1. Open [API keys](https://dashboard.stripe.com/apikeys) in the Stripe Dashboard.
2. Copy the **Publishable key** (`pk_test_...` in test mode). It is safe to ship to the browser.
3. Keep the **Secret key** (`sk_test_...`) on your server only. Never put it in frontend code or in a variable your bundler exposes to the browser.

Store the publishable key in an environment variable that your build tool exposes to client code:

| Build tool | File | Variable | Read it with |
|------------|------|----------|--------------|
| Vite (also Quasar in Vite mode, Laravel with Vite) | `.env.local` | `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` |
| Vue CLI / webpack | `.env.local` | `VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY` |
| Quasar in webpack mode | `.env` plus `build.env` in `quasar.config.js` | `STRIPE_PUBLISHABLE_KEY=pk_test_...` | `process.env.STRIPE_PUBLISHABLE_KEY` |

For Quasar in webpack mode, forward the variable in `quasar.config.js`:

```js
build: {
  env: {
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY
  }
}
```

In Laravel with Inertia, keep `STRIPE_SECRET_KEY` in Laravel's `.env` for your controllers and expose only `VITE_STRIPE_PUBLISHABLE_KEY` to the Vue side.

## 4. Check that Stripe.js loads

Render a `VueStripeProvider` with your key. It loads Stripe.js, shows its `#loading` slot meanwhile and renders its default slot once Stripe is ready:

```vue
<!-- StripeCheck.vue -->
<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <template #loading>
      <p>Loading Stripe...</p>
    </template>
    <template #error="{ error }">
      <p>Stripe failed to load: {{ error }}</p>
    </template>
    <p>Stripe is ready.</p>
  </VueStripeProvider>
</template>
```

When the page shows "Stripe is ready.", the installation works. If it shows the error message instead, see [Troubleshoot common problems](/guide/troubleshooting).

## Other setups

### Vue 2.7

Vue 2.7 needs one extra step so that vue-demi picks the Vue 2 build. See [Use Vue Stripe on Vue 2.7](/guide/vue-2).

### Nuxt 3

Nuxt, Quasar SSR, VitePress and other server-rendered apps are covered in [Use Vue Stripe with Nuxt and SSR](/guide/ssr).

### App-wide plugin

To provide Stripe to the whole app instead of wrapping parts of it in `VueStripeProvider`, install the plugin: see [Provide Stripe app-wide](/guide/plugin).

## Next steps

- [Take your first test payment](/guide/first-payment): the tutorial, from an empty page to a test payment.
- [Accept a payment with the Payment Element](/guide/payment-element)
- [Test your integration](/guide/testing): test cards and bank accounts.
