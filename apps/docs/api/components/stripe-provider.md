---
description: "VueStripeProvider reference: load Stripe.js once and provide the Stripe instance to Vue components and composables. Props, loading and error slots, events."
---

# VueStripeProvider

Loads Stripe.js and provides the `Stripe` instance to every component and composable inside it. Children render once Stripe.js is ready; until then the provider renders its `#loading` slot, and on failure its `#error` slot. [How Stripe.js is loaded](/guide/stripe-js-loading) explains when the script loads and where to mount the provider.

## Usage

```vue
<template>
  <VueStripeProvider
    :publishable-key="publishableKey"
    @load="onLoad"
    @error="onError"
  >
    <!-- VueStripeElements, element components, composables -->
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const onLoad = (stripe) => console.log('Stripe.js loaded', stripe)
const onError = (error) => console.error('Stripe.js failed to load', error)
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `publishableKey` | `string` | Yes* | Your Stripe publishable key |
| `stripeKey` | `string` | Yes* | Alias for `publishableKey` (backwards compatibility) |
| `stripeAccount` | `string` | No | Connected account ID for Stripe Connect |
| `apiVersion` | `string` | No | Forwarded to `loadStripe()`. Stripe.js Endive uses the Endive API version and does not support overriding it; see [API version](#api-version) |
| `locale` | `string` | No | Locale for Stripe.js (e.g., 'en', 'es', 'fr') |
| `betas` | `string[]` | No | Stripe beta flags, forwarded to `loadStripe()` (e.g. the [Tax ID Element](/api/components/stripe-tax-id-element)'s beta) |
| `developerTools` | `StripeConstructorOptions['developerTools']` | No | Stripe.js developer tooling, e.g. `{ assistant: { enabled: false } }`, forwarded to `loadStripe()` |
| `advancedFraudSignals` | `boolean` | No | Default `true`. `false` loads Stripe.js without advanced fraud signals. See [Advanced fraud signals](#advanced-fraud-signals) |
| `options` | `StripeConstructorOptions` | No | Any `loadStripe()` option. Explicit props win over the same key in `options` |

\* Either `publishableKey` or `stripeKey` is required. Without either, the provider throws a `VueStripeProviderError` during setup.

The props are read once, when Stripe.js loads. To switch keys or accounts, re-mount the provider (e.g. with a `:key`).

### Options Object

Every `StripeConstructorOptions` key from `@stripe/stripe-js` (`stripeAccount`, `apiVersion`, `locale`, `betas`, `developerTools`) is a prop. The `options` prop accepts the same keys and is passed to `loadStripe()`. When a dedicated prop is also set, the prop wins:

```ts
import type { StripeConstructorOptions } from '@stripe/stripe-js'

// A few of the StripeConstructorOptions keys
const options: StripeConstructorOptions = {
  stripeAccount: 'acct_...',
  locale: 'auto',
  betas: ['custom_checkout_tax_id_1'],
  developerTools: { assistant: { enabled: false } }
}
```

```vue
<!-- betas as a prop (wins over options.betas) -->
<VueStripeProvider
  :publishable-key="publishableKey"
  :betas="['custom_checkout_tax_id_1']"
>
  <!-- ... -->
</VueStripeProvider>
```

### Developer Tools

`developerTools` configures Stripe.js's developer tooling. For example, turn off the Stripe.js assistant:

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  :developer-tools="{ assistant: { enabled: false } }"
>
  <!-- ... -->
</VueStripeProvider>
```

### API version

Each Stripe.js release train sends its requests with that train's API version: Stripe.js Endive, which `@stripe/stripe-js` 10 loads, uses an Endive API version. Stripe's [versioning policy](https://docs.stripe.com/sdks/stripejs-versioning#compatibility-with-api-versions) states that versioned Stripe.js can't override it. The `apiVersion` prop and the `apiVersion` key in `options` are still forwarded to `loadStripe()`, because `StripeConstructorOptions` still declares them, but don't rely on them. Keep your server's API version on the same train instead.

### Advanced Fraud Signals

`:advanced-fraud-signals="false"` loads Stripe.js without [advanced fraud detection signals](https://docs.stripe.com/disputes/prevention/advanced-fraud-detection). Turning them off gives Radar less information; [How Stripe.js is loaded](/guide/stripe-js-loading#advanced-fraud-signals) explains the trade-off.

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  :advanced-fraud-signals="false"
>
  <!-- ... -->
</VueStripeProvider>
```

The provider calls `loadStripe.setLoadParameters({ advancedFraudSignals: false })` from `@stripe/stripe-js/pure` before it loads Stripe.js, which is then requested as `https://js.stripe.com/endive/stripe.js?advancedFraudSignals=false`. The setting only takes effect if this provider is the first thing on the page to load Stripe.js:

- Set it on every `VueStripeProvider` and on [`createVueStripe()`](/api/plugin) in the app. If another loader already started Stripe.js with the signals on, the provider logs a `[Vue Stripe]` warning and uses that Stripe.js. When several providers load with the signals off, Stripe.js logs that "existing script parameters will be used" for each load after the first; that script already has the parameter, so the notice is harmless.
- Do not import the default `@stripe/stripe-js` entry at runtime (type imports are fine), and do not add a Stripe.js `<script>` tag. Both load Stripe.js with the signals on. Import `loadStripe` from `@vue-stripe/vue-stripe` instead: it is the `@stripe/stripe-js/pure` loader (with `setLoadParameters`), and it shares one Stripe.js load with every provider on the page.

### Stripe.js Release Train

`@stripe/stripe-js` 10, which Vue Stripe 6 requires, loads the `endive` train from `https://js.stripe.com/endive/stripe.js`. [Release trains](/guide/stripe-js-loading#release-trains) explains what that means for upgrades. The `ReleaseTrain` type is re-exported from `@stripe/stripe-js` for code that needs to name the train:

```ts
import type { ReleaseTrain } from '@vue-stripe/vue-stripe'

const train: ReleaseTrain = 'endive'
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | `Stripe` | Emitted when Stripe.js loads successfully |
| `@error` | `Error` | Emitted when Stripe.js fails to load (network error, invalid publishable key). The message is also shown through the `#error` slot |

An invalid publishable key is not validated up front; it surfaces as a load failure through `@error`. The failure is not cached, so re-mounting the provider tries again.

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| default | - | Rendered once Stripe.js is ready |
| `#loading` | - | Rendered while Stripe.js loads (default: "Loading Stripe...") |
| `#error` | `{ error: string }` | Rendered when Stripe.js fails to load |

```vue
<VueStripeProvider :publishable-key="publishableKey">
  <template #loading>
    <div class="spinner">Loading payment form...</div>
  </template>

  <template #error="{ error }">
    <p class="error">Failed to load payment form: {{ error }}</p>
  </template>

  <MyPaymentForm />
</VueStripeProvider>
```

## Provides

The provider exposes nothing on a template ref. It provides a single object under the `stripeInjectionKey` symbol:

| Property | Type | Description |
|----------|------|-------------|
| `stripe` | `Ref<Stripe \| null>` | The Stripe instance |
| `loading` | `Ref<boolean>` | Whether Stripe is loading |
| `error` | `Ref<string \| null>` | Error message if loading failed |

Read it with the [useStripe](/api/composables/use-stripe) composable, which returns `{ stripe, loading, error }`.

The resolved configuration (`publishableKey`, `stripeAccount`, `apiVersion`, `locale`) is provided as a separate object under the `stripeConfigInjectionKey` symbol, for descendant components.

## Styling

The provider renders a plain wrapper `div` around the default slot once Stripe.js is ready. While loading and on failure it renders:

```html
<!-- while loading (#loading slot replaces the message) -->
<div class="vue-stripe-loading">
  <div class="vue-stripe-loading-message">Loading Stripe...</div>
</div>

<!-- on failure (#error slot replaces the message) -->
<div class="vue-stripe-error">
  <div class="vue-stripe-error-message">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

## TypeScript

The component's props and event payloads are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events).

```ts
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import type { VueStripeProviderProps } from '@vue-stripe/vue-stripe'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'

const options: StripeConstructorOptions = { locale: 'auto' }

const onLoad = (stripe: Stripe) => {
  // stripe is fully typed
}
```

## See Also

- [useStripe](/api/composables/use-stripe) - Read the Stripe instance in child components
- [VueStripeElements](/api/components/stripe-elements) - Create the Elements group
- [createVueStripe](/api/plugin) - Provide Stripe app-wide instead
- [How Stripe.js is loaded](/guide/stripe-js-loading) - Lazy loading, shared loads, fraud signals, release trains
- [How Vue Stripe works](/guide/architecture) - The provider chain
- [Choosing an integration](/guide/approaches#plugin-or-provider) - The plugin and the provider compared
- [Handle errors and declines](/guide/error-handling#_1-show-stripe-js-load-failures) - Show Stripe.js load failures
- [Use Vue Stripe with Nuxt and SSR](/guide/ssr) - Server-rendered apps
