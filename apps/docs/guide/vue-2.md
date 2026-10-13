---
description: "Use Vue Stripe in a Vue 2.7 app: install the packages, let vue-demi switch to Vue 2, import the stylesheet, and use the components or the plugin."
---

# Use Vue Stripe on Vue 2.7

Run Vue Stripe in a Vue 2.7 app. The library ships one build for Vue 2.7 and Vue 3 through [vue-demi](https://github.com/vueuse/vue-demi); every component is a render function, so templates, `h()` and the Options API all work.

Before you start: the app runs Vue `^2.7.0`. Vue 2.6 and earlier are not supported; upgrade to 2.7 first. The samples assume Vite with `@vitejs/plugin-vue2`; on Vue CLI 5, read the key from `process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY` instead, as in [Add your publishable key](/guide/installation#_3-add-your-publishable-key).

## 1. Install the packages

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
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
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
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

With the Options API, call the composables in `setup()` and return what the methods need; the element's exposed members are on its template ref:

```vue
<!-- CardPayForm.vue, rendered inside VueStripeElements -->
<script>
import { VueStripeCardElement, useConfirmCardPayment } from '@vue-stripe/vue-stripe'

export default {
  components: { VueStripeCardElement },
  props: { clientSecret: { type: String, required: true } },
  setup() {
    // What setup() returns is available as this.confirmCardPayment, this.loading, ...
    const { confirmCardPayment, loading, error } = useConfirmCardPayment()
    return { confirmCardPayment, loading, error }
  },
  data: () => ({ status: '' }),
  methods: {
    async pay() {
      const card = this.$refs.card.element
      const { paymentIntent } = await this.confirmCardPayment(this.clientSecret, {
        payment_method: { card }
      })
      this.status = paymentIntent ? paymentIntent.status : ''
    }
  }
}
</script>

<template>
  <div>
    <VueStripeCardElement ref="card" />
    <button :disabled="loading" @click="pay">Pay</button>
    <p v-if="error">{{ error }}</p>
    <p v-if="status">Payment {{ status }}</p>
  </div>
</template>
```

## 5. Optional: install the plugin

On Vue 2.7 the plugin installs with `Vue.use()`:

```js
// main.js
import Vue from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

Vue.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

new Vue({ render: (h) => h(App) }).$mount('#app')
```

See [Provide Stripe app-wide](/guide/plugin) for what the plugin does.

## 6. Adapt samples from the other pages

The other pages write their samples for Vue 3. Three changes make them run and type-check on Vue 2.7:

1. **Give every template one root element.** Vue 2 refuses a template with several top-level elements ("Component template should contain exactly one root element"), a `<template>` or `<slot>` root, or `v-for` on the root. Wrap the content in one element, such as a `<div>`. A `v-if` / `v-else-if` / `v-else` chain counts as one root.

   ```vue
   <!-- Vue 3 only -->
   <template>
     <button :disabled="loading" @click="pay">Pay</button>
     <p v-if="error">{{ error }}</p>
   </template>

   <!-- Vue 2.7 and Vue 3 -->
   <template>
     <div>
       <button :disabled="loading" @click="pay">Pay</button>
       <p v-if="error">{{ error }}</p>
     </div>
   </template>
   ```

2. **Type `defineEmits` with call signatures.** Vue 2.7 runs the Vue 3.3 shorthand `defineEmits<{ success: [] }>()`, but `vue-tsc` rejects every `emit()` call with "This expression is not callable". The call-signature form type-checks on both versions:

   ```ts
   import type { SetupIntent } from '@vue-stripe/vue-stripe'

   // Vue 3.3+ only
   const emit = defineEmits<{ success: [setupIntent: SetupIntent]; error: [message: string] }>()

   // Vue 2.7 and Vue 3
   const emit = defineEmits<{
     (e: 'success', setupIntent: SetupIntent): void
     (e: 'error', message: string): void
   }>()
   ```

3. **Read the publishable key the way your build tool exposes it.** The samples use Vite's `import.meta.env.VITE_*` variables; Vue CLI reads `process.env.VUE_APP_*`. The [key table](/guide/installation#_3-add-your-publishable-key) lists both.

## Result

The components render and mount Stripe's iframes as they do on Vue 3. The `Vue 2.7 compatibility` CI job mounts the published bundle on Vue 2.7.16 for every change to the library.

If imports from `vue-demi` fail or components render nothing, vue-demi is still on its Vue 3 build: repeat step 2. More fixes are in [Troubleshoot common problems](/guide/troubleshooting#vue-2-7-components-do-not-render).
