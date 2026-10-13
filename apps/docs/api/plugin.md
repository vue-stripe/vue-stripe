---
description: "createVueStripe reference: a Vue plugin that provides Stripe to the whole app instead of VueStripeProvider. Options, provided values and TypeScript."
---

# createVueStripe Plugin

A Vue plugin that provides Stripe to the whole app, in place of wrapping the tree in [`VueStripeProvider`](/api/components/stripe-provider). It provides the Stripe instance and config under the same injection keys the provider uses. [Provide Stripe app-wide](/guide/plugin) walks through installing it and overriding it for one part of the app. [Choosing an integration](/guide/approaches#plugin-or-provider) compares the two, and [How Stripe.js is loaded](/guide/stripe-js-loading#where-to-mount-the-provider) explains when each one loads Stripe.js.

## Usage

::: code-group

```ts [Vue 3]
// main.ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

app.mount('#app')
```

```js [Vue 2.7]
// main.js
import Vue from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

Vue.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY // Vue CLI: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
}))

new Vue({ render: (h) => h(App) }).$mount('#app')
```

:::

After installing, any component can call `useStripe()` or render `VueStripeElements`, element components, the intent composables, `VueStripeCheckoutElementsProvider` and `VueStripePricingTable` without a `VueStripeProvider` ancestor.

## Options

```ts
import type { StripeConstructorOptions } from '@stripe/stripe-js'

interface VueStripeOptions {
  /** Stripe publishable key (required) */
  publishableKey: string

  /** Connected account ID for Stripe Connect (optional) */
  stripeAccount?: string

  /** @deprecated Ignored: Stripe.js Endive refuses apiVersion, so it is not passed to loadStripe() */
  apiVersion?: string

  /** Locale for Stripe elements (optional) */
  locale?: StripeConstructorOptions['locale']

  /** Stripe.js developer tooling (optional) */
  developerTools?: StripeConstructorOptions['developerTools']

  /** false: no advanced fraud signals (optional, default true) */
  advancedFraudSignals?: boolean
}
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `publishableKey` | `string` | Yes | Your Stripe publishable key (`pk_test_...` or `pk_live_...`) |
| `stripeAccount` | `string` | No | Connected account ID for Stripe Connect (`acct_...`) |
| `apiVersion` | `string` | No | Deprecated and ignored: not passed to `loadStripe()`, because Stripe.js Endive refuses it. Logs one `[Vue Stripe]` warning; see [API version](/api/components/stripe-provider#api-version) |
| `locale` | `StripeConstructorOptions['locale']` | No | Locale for Stripe.js: one of Stripe's supported locales (`'auto'`, `'en'`, `'fr'`, `'de'`, ...) |
| `developerTools` | `StripeConstructorOptions['developerTools']` | No | Stripe.js developer tooling, e.g. `{ assistant: { enabled: false } }` |
| `advancedFraudSignals` | `boolean` | No | Default `true`. `false` loads Stripe.js without advanced fraud signals, as on [`VueStripeProvider`](/api/components/stripe-provider#advanced-fraud-signals) |

The options are passed to `loadStripe(publishableKey, { stripeAccount, locale, developerTools })`. A `VueStripeProvider` with the same key and options shares the plugin's `Stripe` instance. With `advancedFraudSignals: false`, the plugin first calls `loadStripe.setLoadParameters({ advancedFraudSignals: false })` from `@stripe/stripe-js/pure`; the [requirements](/api/components/stripe-provider#advanced-fraud-signals) are the same as on the provider. The plugin has no `betas` or `options`; for those, use a `VueStripeProvider` with its `betas` or `options` prop.

## Provided values

The plugin provides two values app-wide, under the same injection keys `VueStripeProvider` uses:

```ts
// Config (stripeConfigInjectionKey), read by VueStripePricingTable
{
  publishableKey: '...',
  stripeAccount: '...', // optional
  apiVersion: '...',    // optional, as given (ignored)
  locale: '...'         // optional
}

// Stripe context (stripeInjectionKey), read by useStripe(), VueStripeElements, ...
{
  stripe: Ref<Stripe | null>,  // null until Stripe.js has loaded
  loading: Ref<boolean>,       // true until loadStripe() settles
  error: Ref<string | null>    // the load error, if any
}
```

## Behaviour

- **Loads on first use.** Stripe.js loads the first time a component or composable reads the Stripe context: when `useStripe()`, any other Stripe composable (`usePaymentIntent()`, `useRadarSession()`, ...), `VueStripeElements` or a Checkout provider runs in `setup()`. An app that installs the plugin but renders no Stripe UI loads nothing. One plugin object loads one Stripe instance, even when it is installed into more than one app.
- **Composable calls wait for the load.** A composable method called while Stripe.js is still loading waits for the load, then runs. If the load fails, the call ends the way it does when Stripe is missing: `{ error: { message: 'Stripe not initialized' } }`, or a rejected `VueStripeProviderError` ("Stripe.js is not loaded yet") for the method confirmers.
- **No wrapper slots.** Children render at once. Until Stripe.js has loaded, `useStripe()` reports `loading: true`, and `VueStripeElements` (and `VueStripeCheckoutElementsProvider`) render their `#loading` slot, or their `#error` slot if the load fails. There are no `load` / `error` events, so a load failure is always logged as a `[Vue Stripe]` console error.
- **A nested provider wins.** A `VueStripeProvider` inside the app provides its own Stripe instance to its subtree, for example for a connected account. It does not inherit the plugin's options: give it its own `publishable-key` and any other options it needs. On Vue 2.7 the plugin provides through a global mixin that only runs on root instances, so it never overrides a nested provider.
- **SSR.** `install()` only provides; the plugin never calls `loadStripe()` on the server. During server rendering `useStripe()` reports `loading: true`. In the browser, the first consumer starts the load.

## TypeScript

```ts
import { createVueStripe } from '@vue-stripe/vue-stripe'
import type { VueStripeOptions } from '@vue-stripe/vue-stripe'

const options: VueStripeOptions = {
  publishableKey: 'pk_test_...',
  stripeAccount: 'acct_...',
  locale: 'en'
}

app.use(createVueStripe(options))
```

```ts
import { useStripe } from '@vue-stripe/vue-stripe'

// stripe is Readonly<Ref<Stripe | null>>, from the nearest VueStripeProvider or the plugin
const { stripe, loading, error, initialize } = useStripe()
```

## See Also

- [VueStripeProvider](/api/components/stripe-provider) - Component-based alternative
- [useStripe](/api/composables/use-stripe) - Read the Stripe instance
- [VueStripeElements](/api/components/stripe-elements) - Elements group
- [Provide Stripe app-wide](/guide/plugin) - Install the plugin and use it step by step
- [Use Vue Stripe on Vue 2.7](/guide/vue-2#_5-optional-install-the-plugin) - The plugin on Vue 2.7
- [Choosing an integration](/guide/approaches#plugin-or-provider) - The plugin and the provider compared
