---
description: "Install @vue-stripe/vue-stripe and @stripe/stripe-js, import the stylesheet, set your publishable key and check that Stripe.js loads in your Vue app."
---

# Install and set up

Add Vue Stripe to an existing Vue app, load its stylesheet, configure your publishable key and check that Stripe.js loads.

Requirements: Vue 3 or Vue 2.7, `@stripe/stripe-js` `^10.0.0` (Stripe.js Endive), TypeScript 5.0 or later if the app uses TypeScript, and a browser that [Stripe.js supports](https://docs.stripe.com/js/appendix/supported_browsers). Vue 2.6 is not supported; the full list, with the browsers these docs were tested in, is under [Compatibility](/api/#compatibility). Upgrading from v5? See [Upgrade from v5 to v6](/guide/migration-v6).

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

Type definitions ship with the package; Stripe.js types such as `Stripe`, `StripeElements` and `PaymentIntent` are re-exported from `@vue-stripe/vue-stripe`. The declarations need TypeScript 5.0 or later. Vue CLI 5 scaffolds TypeScript 4.5, so upgrade it in a Vue CLI app with `npm install -D typescript@5`.

## 2. Import the stylesheet

The components ship their styles as a separate file. Import it once, in your app entry (`main.ts` or `main.js`):

```ts
import '@vue-stripe/vue-stripe/style.css'
```

A Quasar app has no `main.ts`; import it in a boot file, as in [Use Vue Stripe with Quasar](/guide/quasar#_3-load-the-stylesheet-and-the-plugin-in-a-boot-file). In Laravel with Inertia, the entry is `resources/js/app.ts`.

To change how the elements look, see [Style elements](/guide/styling).

## 3. Add your publishable key

1. Open [API keys](https://dashboard.stripe.com/apikeys) in the Stripe Dashboard.
2. Copy the **Publishable key** (`pk_test_...` in test mode). It is safe to ship to the browser.
3. Keep the **Secret key** (`sk_test_...`) on your server only. Never put it in frontend code or in a variable your bundler exposes to the browser.

Store the publishable key in an environment variable that your build tool exposes to client code:

| Build tool | File | Variable | Read it with |
|------------|------|----------|--------------|
| Vite | `.env.local` | `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` |
| Vue CLI / webpack | `.env.local` | `VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY` |
| Rsbuild | `.env.local` | `PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Quasar in Vite mode (`@quasar/app-vite`) | `.env` | `QCLI_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `import.meta.env.QCLI_STRIPE_PUBLISHABLE_KEY` |
| Quasar in webpack mode (`@quasar/app-webpack` 4) | `.env` | `STRIPE_PUBLISHABLE_KEY=pk_test_...` | `process.env.STRIPE_PUBLISHABLE_KEY` |
| Laravel with Vite | `.env` (not `.env.local`) | `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` |
| Nuxt | `.env` plus `runtimeConfig.public` in `nuxt.config.ts` | `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `useRuntimeConfig().public.stripePublishableKey` |
| Astro | `.env` | `PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` | `import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY` |

For Nuxt, declare the key in `nuxt.config.ts`; Nuxt fills it from `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` when the server starts, so the production server needs the variable in its environment, as [Configure Nuxt](/guide/ssr#_2-configure-nuxt) shows:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      stripePublishableKey: ''
    }
  }
})
```

Quasar in webpack mode loads `.env` itself and passes its variables to the browser, so the key needs no entry in `quasar.config`. Don't forward it in `build: { env: { ... } }` as well: the `.env` values are not in `process.env` while `quasar.config` runs, so `STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY` replaces the key with `undefined`, and every element shows "Expected publishable key to be of type string, got type undefined instead." Use `build.env` only when the key comes from the shell or the CI environment instead of `.env`. [Webpack mode](/guide/quasar#webpack-mode) in the Quasar guide lists the other changes.

Quasar in Vite mode passes only `QCLI_` variables to the browser, so a `VITE_` variable is `undefined` there. In Laravel, keep `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` in the same `.env`, and don't create a `.env.local`: with `APP_ENV=local`, Laravel loads it instead of `.env`, and every request fails. [Use Vue Stripe with Quasar](/guide/quasar) and [Use Vue Stripe with Laravel and Inertia](/guide/laravel) cover the rest of those setups.

::: tip Samples use Vite's variables
Every sample in these docs reads the key as `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`. On Vue CLI, write `process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY` instead, in Quasar `import.meta.env.QCLI_STRIPE_PUBLISHABLE_KEY`, in Rsbuild and Astro `import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY`, and in Nuxt `useRuntimeConfig().public.stripePublishableKey`. In Nuxt the `VITE_` variable is `undefined` with the `.env` from the table, so a pasted sample with `VueStripeProvider` answers 500 "publishableKey or stripeKey is required". Webpack compiles `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` to `undefined` without a warning, so a pasted sample builds and then fails in the browser. Rsbuild and Astro pass only `PUBLIC_` variables to the browser: in Rsbuild a `VITE_` key is `undefined` and the page stays empty, and in Astro it is defined while the page renders on the server but `undefined` in the browser, so the island stays on its loading state.
:::

## 4. Check that Stripe.js loads

Render a `VueStripeProvider` with your key. It loads Stripe.js, shows its `#loading` slot meanwhile and renders its default slot once Stripe is ready:

```vue
<!-- StripeCheck.vue -->
<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

// Vue CLI: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
// Rsbuild, Astro: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
// Nuxt: useRuntimeConfig().public.stripePublishableKey
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

When the page shows "Stripe is ready.", the installation works. If it shows the error message instead, see [Troubleshoot common problems](/guide/troubleshooting). If the page stays blank and the console shows `VueStripeProviderError: publishableKey or stripeKey is required`, the key did not reach the browser: check the variable's prefix and how you read it (step 3). A missing key throws during setup, so the `#error` slot does not render.

## 5. Send API requests to your server

The how-to guides call your server with paths on the app's own origin, such as `fetch('/api/create-payment-intent', { method: 'POST' })`. In development the app and your server usually run on different ports, so let the dev server forward `/api` requests. Replace `3000` with the port your server listens on:

::: code-group
```ts [Vite (vite.config.ts)]
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: { '/api': 'http://localhost:3000' }
  }
})
```

```ts [Vite, Vue 2.7 (vite.config.ts)]
import vue from '@vitejs/plugin-vue2'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: { '/api': 'http://localhost:3000' }
  }
})
```

```js [Vue CLI (vue.config.js)]
module.exports = {
  devServer: {
    proxy: {
      '^/api': { target: 'http://localhost:3000' }
    }
  }
}
```
:::

Vite restarts by itself when its config changes; restart `vue-cli-service serve` yourself. On Vue 2.7, use the "Vite, Vue 2.7" tab: a Vue 2.7 app compiles its components with `@vitejs/plugin-vue2`, and the Vue 3 config stops with `ERR_MODULE_NOT_FOUND` there. `@vitejs/plugin-vue2` supports Vite 3 to 7, so keep the app on Vite 7 ([Use Vue Stripe on Vue 2.7](/guide/vue-2#_1-install-the-packages)). Nuxt server routes (`server/api/`) and other setups that serve the app and its API from one origin need nothing here. In production, serve the API on the app's origin too, for example behind the same reverse proxy, or call it by its full URL and allow the app's origin with CORS on the server.

- **Quasar** has no `vite.config.ts`: set the proxy in `devServer.proxy` of `quasar.config.ts`, as in [Use Vue Stripe with Quasar](/guide/quasar#_5-send-api-requests-to-your-server-in-development). In webpack mode the proxy is an array; see [Webpack mode](/guide/quasar#webpack-mode).
- **Rsbuild**: `server.proxy` in `rsbuild.config.ts` takes the same object as Vite's, `{ '/api': 'http://localhost:3000' }`.
- **Astro** has no `vite.config.ts` either: put the proxy under `vite.server.proxy` in `astro.config.mjs`, as in [Astro](#astro) below.
- **Laravel** serves the app and its API from one origin, so it needs no proxy. But a `fetch` POST to a route in `routes/web.php` fails with 419 (CSRF): put the routes in `routes/api.php`, or send the CSRF token, as in [Use Vue Stripe with Laravel and Inertia](/guide/laravel#_4-create-the-api-routes).

## Other setups

### Vue 2.7

Vue 2.7 needs two changes: vue-demi must pick the Vue 2 build, and Vite needs `@vitejs/plugin-vue2`, which supports Vite 7 at most (the "Vite, Vue 2.7" tab in step 5). See [Use Vue Stripe on Vue 2.7](/guide/vue-2).

### Nuxt

Nuxt, VitePress and other server-rendered apps are covered in [Use Vue Stripe with Nuxt and SSR](/guide/ssr).

### Quasar

Quasar apps, in SPA and SSR mode, need a few changes: see [Use Vue Stripe with Quasar](/guide/quasar).

### Laravel and Inertia

See [Use Vue Stripe with Laravel and Inertia](/guide/laravel) for the plugin in `createInertiaApp`, the stripe-php routes and webhooks.

### Astro

Astro renders Vue components as islands through `@astrojs/vue` (`npx astro add vue`). Four things differ from a Vite app:

- **The key.** Astro passes only `PUBLIC_` variables to the browser, so use `PUBLIC_STRIPE_PUBLISHABLE_KEY` from the table in step 3.
- **One island per Stripe tree.** Each island is a separate Vue app, and provide/inject does not cross from one island to another. Put `VueStripeProvider`, `VueStripeElements` and the form in one Vue component, and hydrate that component with `client:load`, `client:visible`, `client:idle` or `client:only="vue"`. Vue Stripe components written as nested islands in an `.astro` file compile, then throw "VueStripeElements must be used within a VueStripeProvider component or an app using createVueStripe()".

  ```astro
  ---
  // src/pages/pay.astro
  import PaymentCheckout from '../components/PaymentCheckout.vue'
  ---

  <PaymentCheckout client:load />
  ```

- **The plugin and the stylesheet.** Astro has no `main.ts`. `@astrojs/vue` runs the file named in its `appEntrypoint` option for every island; install the [plugin](/guide/plugin) and import the stylesheet there, and every island shares one Stripe instance. Without the plugin, keep only the stylesheet import there and put a `VueStripeProvider` in each island's component.

  ```ts
  // src/pages/_app.ts
  import type { App } from 'vue'
  import { createVueStripe } from '@vue-stripe/vue-stripe'
  import '@vue-stripe/vue-stripe/style.css'

  export default (app: App) => {
    app.use(createVueStripe({ publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY }))
  }
  ```

- **The API.** In development, forward `/api` to your server with `vite.server.proxy`:

  ```js
  // astro.config.mjs
  import { defineConfig } from 'astro/config'
  import vue from '@astrojs/vue'

  export default defineConfig({
    integrations: [vue({ appEntrypoint: '/src/pages/_app' })],
    vite: {
      server: {
        proxy: { '/api': 'http://localhost:3000' }
      }
    }
  })
  ```

  With an adapter such as `@astrojs/node`, the routes can be Astro endpoints in `src/pages/api/` instead, with `export const prerender = false`. Read the secret key there through `astro:env`, declared with `env: { schema: { STRIPE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }) } }` in `astro.config.mjs`, and import it with `import { STRIPE_SECRET_KEY } from 'astro:env/server'`. Astro reads that value at runtime, from `.env` in `astro dev` and from the server's environment in production. Don't read it as `import.meta.env.STRIPE_SECRET_KEY`: Astro writes non-public `import.meta.env` values into the server build in `dist/server`. `process.env.STRIPE_SECRET_KEY` also works on the Node adapter in production, but `astro dev` does not put `.env` values in `process.env`.

### Ionic and Capacitor

An Ionic Vue app is a Vite app, so the steps above apply as they are. Inside Capacitor's native web view, one thing differs. It follows from Capacitor's documented behavior and has **not been verified on a device** for these docs:

- Capacitor opens a navigation to another domain in the system browser, not in the web view. That covers hosted Checkout (`session.url`) and the pages of redirect-based payment methods, such as bank redirects. Elements in the page, Embedded Checkout and 3D Secure, which Stripe.js opens in an iframe, stay in the web view.
- To keep those pages in the web view, list their hosts in `server.allowNavigation` of `capacitor.config.ts`, for example `allowNavigation: ['checkout.stripe.com']`. Capacitor's [configuration reference](https://capacitorjs.com/docs/config) marks this option as not intended for production.
- The guides build `return_url` from `window.location.origin`. In the web view that origin is the app's own (`https://localhost` on Android, `capacitor://localhost` on iOS), which the system browser cannot open. If a payment finishes in the system browser, send the customer to an `https` page on your own domain that opens the app again, for example through a universal link (iOS) or an app link (Android).

### Without a bundler

A page with no build step loads the UMD build from unpkg or jsDelivr. Add three `<script>` tags in this order: Vue, vue-demi, then Vue Stripe. The `VueStripe` global holds every export. The UMD build includes the `@stripe/stripe-js` loader, so the page needs no script for it; Stripe.js itself loads from `js.stripe.com` when the provider mounts.

::: code-group
```html [Vue 3]
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/@vue-stripe/vue-stripe@^6.0.0-beta.5/dist/vue-stripe.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script src="https://unpkg.com/vue-demi@0.14/lib/index.iife.js"></script>
    <script src="https://unpkg.com/@vue-stripe/vue-stripe@^6.0.0-beta.5"></script>
    <script>
      const { VueStripeProvider, VueStripeElements, VueStripeCardElement } = VueStripe

      Vue.createApp({
        components: { VueStripeProvider, VueStripeElements, VueStripeCardElement },
        template: `
          <VueStripeProvider publishable-key="pk_test_...">
            <VueStripeElements>
              <VueStripeCardElement />
            </VueStripeElements>
          </VueStripeProvider>`
      }).mount('#app')
    </script>
  </body>
</html>
```

```html [Vue 2.7]
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/@vue-stripe/vue-stripe@^6.0.0-beta.5/dist/vue-stripe.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://unpkg.com/vue@2.7.16/dist/vue.min.js"></script>
    <script src="https://unpkg.com/vue-demi@0.14/lib/index.iife.js"></script>
    <script src="https://unpkg.com/@vue-stripe/vue-stripe@^6.0.0-beta.5"></script>
    <script>
      const { VueStripeProvider, VueStripeElements, VueStripeCardElement } = VueStripe

      new Vue({
        components: { VueStripeProvider, VueStripeElements, VueStripeCardElement },
        template: `
          <VueStripeProvider publishable-key="pk_test_...">
            <VueStripeElements>
              <VueStripeCardElement />
            </VueStripeElements>
          </VueStripeProvider>`
      }).$mount('#app')
    </script>
  </body>
</html>
```
:::

The only differences on Vue 2.7 are the Vue script and `new Vue(...).$mount('#app')` in place of `Vue.createApp(...).mount('#app')`; vue-demi picks its Vue 2 build from the `Vue` global. Keep the viewport `<meta>` tag: without it, Stripe.js warns `Elements requires "width=device-width" be set in your page's viewport meta tag`. Serve the page over HTTP (any static server, for example `npx serve .`) rather than opening it from disk: on a `file://` URL Stripe.js logs errors such as "Stripe.js requires 'allow-same-origin' if sandboxed". Pin exact versions in production, so that a new release cannot change the page.

### App-wide plugin

To provide Stripe to the whole app instead of wrapping parts of it in `VueStripeProvider`, install the plugin: see [Provide Stripe app-wide](/guide/plugin).

## Next steps

- [Take your first test payment](/guide/first-payment): the tutorial, from an empty page to a test payment.
- [Accept a payment with the Payment Element](/guide/payment-element)
- [Test your integration](/guide/testing): test cards and bank accounts.
