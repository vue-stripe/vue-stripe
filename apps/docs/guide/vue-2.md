---
description: "Use Vue Stripe in a Vue 2.7 app: install the packages, let vue-demi switch to Vue 2, import the stylesheet, and use the components or the plugin."
---

# Use Vue Stripe on Vue 2.7

Run Vue Stripe in a Vue 2.7 app. The library ships one build for Vue 2.7 and Vue 3 through [vue-demi](https://github.com/vueuse/vue-demi); every component is a render function, so templates, `h()` and the Options API all work.

Before you start: the app runs Vue `^2.7.0`. Vue 2.6 and earlier are not supported; upgrade to 2.7 first.

## 1. Install the packages

```bash
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

## 2. Let vue-demi switch to Vue 2

vue-demi selects the Vue 2.7 build in its `postinstall` script. pnpm 10 and later do not run dependency build scripts by default, so allow vue-demi's script, or switch it by hand:

::: code-group
```json [pnpm 10 (package.json)]
{
  "pnpm": {
    "onlyBuiltDependencies": ["vue-demi"]
  }
}
```

```yaml [pnpm 11+ (pnpm-workspace.yaml)]
allowBuilds:
  vue-demi: true
```

```bash [any package manager]
npx vue-demi-switch 2.7
```
:::

Run `pnpm install` again after changing the pnpm setting. npm and yarn run the script without extra configuration.

## 3. Import the stylesheet

```js
// main.js
import Vue from 'vue'
import App from './App.vue'
import '@vue-stripe/vue-stripe/style.css'

// <stripe-pricing-table> is Stripe's web component, not a Vue component.
Vue.config.ignoredElements = ['stripe-pricing-table']

new Vue({ render: (h) => h(App) }).$mount('#app')
```

The `ignoredElements` line is only needed if you use [`VueStripePricingTable`](/api/components/stripe-pricing-table); it stops Vue 2 from warning about the unknown element.

## 4. Use the components

Register the components locally, as with any Vue 2 component:

```vue
<script>
import { VueStripeProvider, VueStripeElements, VueStripeCardElement } from '@vue-stripe/vue-stripe'

export default {
  components: { VueStripeProvider, VueStripeElements, VueStripeCardElement },
  data: () => ({
    publishableKey: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY,
    complete: false
  }),
  methods: {
    onChange(event) {
      this.complete = event.complete
    }
  }
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripeCardElement @change="onChange" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

The Card Element needs no client secret. For the Payment Element, pass `client-secret` (or `mode`, `amount` and `currency`) to `VueStripeElements`, as in [Accept a payment with the Payment Element](/guide/payment-element).

The composables (`usePaymentIntent`, `useStripe`, ...) work in Vue 2.7's `setup()` and `<script setup>`, inside a component rendered within the providers.

## 5. Optional: install the plugin

On Vue 2.7 the plugin installs with `Vue.use()`:

```js
// main.js
import Vue from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

Vue.use(createVueStripe({
  publishableKey: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
}))

new Vue({ render: (h) => h(App) }).$mount('#app')
```

See [Provide Stripe app-wide](/guide/plugin) for what the plugin does.

## Result

The components render and mount Stripe's iframes as they do on Vue 3. The `Vue 2.7 compatibility` CI job mounts the published bundle on Vue 2.7.16 for every change to the library.

If imports from `vue-demi` fail or components render nothing, vue-demi is still on its Vue 3 build: repeat step 2. More fixes are in [Troubleshoot common problems](/guide/troubleshooting#vue-2-7-components-do-not-render).
