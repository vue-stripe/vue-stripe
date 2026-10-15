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

<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import type { Stripe } from '@stripe/stripe-js'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const onLoad = (stripe: Stripe) => console.log('Stripe.js loaded', stripe)
const onError = (error: Error) => console.error('Stripe.js failed to load', error)
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `publishableKey` | `string` | Yes* | Your Stripe publishable key |
| `stripeKey` | `string` | Yes* | Alias for `publishableKey` (backwards compatibility) |
| `stripeAccount` | `string` | No | Connected account ID for Stripe Connect |
| `apiVersion` | `string` | No | Deprecated and ignored: not passed to `loadStripe()`, because Stripe.js Endive refuses it. See [API version](#api-version) |
| `locale` | `StripeConstructorOptions['locale']` | No | Locale for Stripe.js: one of Stripe's supported locales (`'auto'`, `'en'`, `'es'`, `'fr'`, ...), as in [`createVueStripe()`](/api/plugin). A value outside the list, such as `'jp'` for Japanese (`'ja'`), is a type error. Embedded and hosted Checkout ignore it; see [Locale](#locale) |
| `betas` | `string[]` | No | Stripe beta flags, forwarded to `loadStripe()` (e.g. `elements_link_signup_beta_1` for the [Link Signup Element](/api/components/stripe-link-signup-element)) |
| `developerTools` | `StripeConstructorOptions['developerTools']` | No | Stripe.js developer tooling, e.g. `{ assistant: { enabled: false } }`, forwarded to `loadStripe()` |
| `advancedFraudSignals` | `boolean` | No | Default `true`. `false` loads Stripe.js without advanced fraud signals. See [Advanced fraud signals](#advanced-fraud-signals) |
| `options` | `StripeConstructorOptions` | No | Any `loadStripe()` option. Explicit props win over the same key in `options` |

\* Either `publishableKey` or `stripeKey` is required. Without either, the provider throws a `VueStripeProviderError` during setup.

The props are read once, when Stripe.js loads. To switch keys or accounts, re-mount the provider (e.g. with a `:key`).

Providers with the same `loadStripe()` arguments (key, options and `advancedFraudSignals`) share one `Stripe` instance, including a provider that re-mounts after client-side navigation. Each distinct set of arguments gets its own instance, and keeps it for the life of the page. See [One script, many instances](/guide/stripe-js-loading#one-script-many-instances).

### Options Object

Every `StripeConstructorOptions` key from `@stripe/stripe-js` (`stripeAccount`, `apiVersion`, `locale`, `betas`, `developerTools`) is a prop; `apiVersion` is [ignored](#api-version). The `options` prop accepts the same keys and is passed to `loadStripe()`. When a dedicated prop is also set, the prop wins:

```vue
<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import type { StripeConstructorOptions } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// A few of the StripeConstructorOptions keys
const options: StripeConstructorOptions = {
  stripeAccount: 'acct_...',
  locale: 'auto',
  betas: ['elements_link_signup_beta_1'],
  developerTools: { assistant: { enabled: false } }
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey" :options="options">
    <!-- ... -->
  </VueStripeProvider>
</template>
```

```vue
<!-- betas as a prop (wins over options.betas) -->
<VueStripeProvider
  :publishable-key="publishableKey"
  :betas="['elements_link_signup_beta_1']"
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

Each Stripe.js release train sends its requests with that train's API version: Stripe.js Endive, which `@stripe/stripe-js` 10 loads, uses an Endive API version. Stripe's [versioning policy](https://docs.stripe.com/sdks/stripejs-versioning#compatibility-with-api-versions) states that versioned Stripe.js can't override it, and Stripe.js Endive refuses to create an instance when `apiVersion` is passed, even with an Endive version such as `2026-09-30.endive` ("Can not provide apiVersion to Stripe()").

The `apiVersion` prop and the `apiVersion` key in `options` are deprecated and kept only so existing code compiles. The provider drops them before it calls `loadStripe()` and logs one `[Vue Stripe]` warning per page that the value is ignored. Remove them, and keep your server's API version on the same train instead.

### Locale

`locale` sets the language of what Stripe.js renders under the provider: the elements in a `VueStripeElements` group (which also has its own [`locale`](/api/components/stripe-elements#props) prop), Custom Checkout's elements and the Checkout Form. Embedded Checkout shows Stripe's Checkout page, which takes the language of the Checkout Session instead, like hosted Checkout. Set it on your server with `locale` in `stripe.checkout.sessions.create()` (left out or `'auto'`, it follows the browser's language):

| Integration | Provider `locale` | Checkout Session `locale` |
|-------------|-------------------|---------------------------|
| Elements (`VueStripeElements`) | Yes | No session |
| Hosted Checkout (`VueStripeCheckout`, `useStripeCheckout`) | No, Stripe.js is not loaded | Yes |
| Embedded Checkout (`VueStripeEmbeddedCheckout`) | No, the page stays in the session's language | Yes |
| Custom Checkout (`VueStripeCheckoutElementsProvider`) | Yes | Yes |
| Checkout Form (`VueStripeCheckoutFormProvider`, beta) | Yes | Yes |

The Checkout Form is a Stripe beta, and its localization has changed between Stripe.js releases (an earlier one rendered it in English whatever the locale), so check its language on your account.

Checkout Sessions accept fewer locales than Stripe.js, and no right-to-left one: a session created with `locale: 'ar'` or `'he'` fails with "Invalid locale: must be one of auto, bg, cs, ...". Hosted and Embedded Checkout cannot be shown in Arabic or Hebrew. For a right-to-left store, use the Payment Element, Custom Checkout or the Checkout Form with the provider's `locale`. Stripe lists the locales in [Stripe.js supported locales](https://docs.stripe.com/js/appendix/supported_locales) and the [Checkout Session `locale` parameter](https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-locale).

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
- Do not import the default `@stripe/stripe-js` entry at runtime (type imports are fine), and do not add a Stripe.js `<script>` tag. Both load Stripe.js with the signals on. Import `loadStripe` from `@vue-stripe/vue-stripe` instead: it wraps the `@stripe/stripe-js/pure` loader (same signature, with `setLoadParameters`), shares one Stripe.js load with every provider on the page, and registers Vue Stripe's app info on each instance it creates.

### Stripe.js Release Train

`@stripe/stripe-js` 10, which Vue Stripe 6 requires, loads the `endive` train from `https://js.stripe.com/endive/stripe.js`. [Release trains](/guide/stripe-js-loading#release-trains) explains what that means for upgrades. The `ReleaseTrain` type is re-exported from `@stripe/stripe-js` for code that needs to name the train:

```ts
import type { ReleaseTrain } from '@vue-stripe/vue-stripe'

export const STRIPE_JS_TRAIN: ReleaseTrain = 'endive'
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | `Stripe` | Emitted when Stripe.js loads successfully |
| `@error` | `Error` | Emitted when Stripe.js fails to load (network error, blocked script) or rejects the key at load time (a secret key). The message is also shown through the `#error` slot. Without an `@error` listener or `#error` slot, the provider also logs it as a `[Vue Stripe]` console error |

Stripe.js does not validate a publishable key when it loads: with a wrong, revoked or malformed key the provider emits `@load` and renders its default slot. The key fails on the first request to Stripe, and not every element makes one when it mounts:

- The Payment, Express Checkout and Link Authentication elements, and the Address and Payment Method Messaging elements in a group with a `clientSecret` or `mode`, request an Elements session when they mount. They emit `@loaderror` and show `Invalid API Key provided` in their `#error` slot. In a group with neither, the Payment Method Messaging Element also emits `@loaderror`, but without Stripe's message: its `error` reads "Element failed to load".
- The Card Element, the split card elements (number, expiry, CVC), and the IBAN and AU BECS elements make no request. They emit `@ready`, accept input and show no error. The key fails only when the customer pays: `confirmCardPayment()` (or another composable call) resolves `{ error }` with `Invalid API Key provided`, and sets the composable's `error`.

The Address Element in a group without a `clientSecret` or `mode` errors with any key, valid or not: it emits `@ready`, and Stripe.js throws an uncaught "Unable to select session" from its iframe on every load. Give the group a `clientSecret` or a `mode` (see [`VueStripeAddressElement`](/api/components/stripe-address-element)).

Only a secret key (`sk_...`) fails the load. A load failure is not cached, so re-mounting the provider tries again. A failure tied to one provider's arguments, such as a secret key, reaches only that provider; other providers mounting at the same time load normally. A script that fails to load fails every provider waiting for it.

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

The provider exposes nothing on a template ref. It provides the Stripe context, an object with these refs:

| Property | Type | Description |
|----------|------|-------------|
| `stripe` | `Ref<Stripe \| null>` | The Stripe instance |
| `loading` | `Ref<boolean>` | Whether Stripe is loading |
| `error` | `Ref<string \| null>` | Error message if loading failed |

Read it with the [useStripe](/api/composables/use-stripe) composable, which returns `{ stripe, loading, error }`. Its injection key is internal.

The resolved configuration (`publishableKey`, `stripeAccount`, `apiVersion`, `locale`; `apiVersion` as given, though it is not used) is provided as a separate `VueStripeConfig` object under the exported `stripeConfigInjectionKey` symbol. `VueStripePricingTable` reads its publishable key from it. A descendant component injects it the same way:

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { stripeConfigInjectionKey } from '@vue-stripe/vue-stripe'

// VueStripeConfig | null: null outside a VueStripeProvider or the plugin
const config = inject(stripeConfigInjectionKey, null)
</script>

<template>
  <p v-if="config?.stripeAccount">Paying {{ config.stripeAccount }}</p>
</template>
```

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

The component's props, event payloads and slot props are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events), and a slot prop against [Slots](#slots). The props type is exported as `VueStripeProviderProps`.

```vue
<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import type { Stripe, StripeConstructorOptions } from '@vue-stripe/vue-stripe'

const options: StripeConstructorOptions = { locale: 'auto' }

const onLoad = (stripe: Stripe) => {
  // stripe is fully typed
  console.log(stripe)
}
</script>

<template>
  <VueStripeProvider :publishable-key="'pk_test_...'" :options="options" @load="onLoad">
    <slot />
  </VueStripeProvider>
</template>
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
