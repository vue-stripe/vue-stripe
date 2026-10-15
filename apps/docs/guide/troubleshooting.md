---
description: "Fixes for common Vue Stripe problems: missing keys, provider errors, unstyled or empty elements, Vue 2.7 and SSR issues, and missing wallet buttons."
---

# Troubleshoot common problems

Find the message or symptom you see, then apply the fix. Errors that Vue Stripe throws start with the component or composable name; console messages from the library start with `[Vue Stripe]`. A load or creation failure is logged only when the app doesn't handle it with an error listener or an `#error` slot.

## Setup

### "publishableKey or stripeKey is required"

`VueStripeProvider` received no key, usually because the environment variable is empty in the browser:

- Check the variable prefix your build tool exposes to client code (`VITE_`, `VUE_APP_`, `NUXT_PUBLIC_`, `QCLI_` in Quasar); see [Install and set up](/guide/installation#_3-add-your-publishable-key).
- Restart the dev server after editing `.env` files; most tools read them only at startup.

### Elements show "Expected publishable key to be of type string"

The full message is "Expected publishable key to be of type string, got type undefined instead.", and the console logs it as `[Vue Stripe] Initialization error`. The [plugin](/guide/plugin) received no key. Unlike `VueStripeProvider`, the plugin does not throw: the page renders, and the error appears in the browser when Stripe.js loads. The causes and fixes are the ones above.

### The provider shows an error instead of loading

The provider's `#error` slot (or its default error text) means Stripe.js could not load or rejected the key at load time:

- **Blocked script**: an ad blocker, privacy extension or Content Security Policy blocked `https://js.stripe.com`. Allow Stripe's hosts in your CSP as listed in [Stripe's CSP guide](https://docs.stripe.com/security/guide#content-security-policy) (at least `https://js.stripe.com` in `script-src` and `frame-src`), and test in a clean browser profile. A policy with `default-src` also needs `https://api.stripe.com` in `connect-src`, plus the stylesheet's host when you pass `fonts` or call `loadFonts()`. A new Quasar app created without ESLint ships such a policy in `index.html` (one created with the ESLint preset has none); [Use Vue Stripe with Quasar](/guide/quasar#_4-allow-stripe-in-the-content-security-policy) shows one that works.
- **Secret key**: a secret key (`sk_...`) is rejected by Stripe.js when it loads; never send it to the browser. Use the publishable key, `pk_test_...` or `pk_live_...`.

A wrong or revoked publishable key does not show here: Stripe.js accepts any key when it loads, and the provider renders its children. See the next section.

### Elements show "Invalid API Key provided"

The publishable key is wrong, revoked or malformed. Stripe.js only checks it on the first request, so the provider loads. The Payment, Express Checkout and Link Authentication elements (and the Address Element in a group with a `clientSecret` or `mode`) report the error through `@loaderror` and their `#error` slot. The Card, split card, IBAN and AU BECS elements make no request when they load: they render normally, and the error appears only when the customer pays, in the `{ error }` of the confirm call. [`VueStripeProvider`](/api/components/stripe-provider#events) lists which elements report it at load. Copy the publishable key again from the [API keys page](https://dashboard.stripe.com/apikeys), with no spaces or line breaks, in the mode (test or live) you want.

### Elements show "The client_secret provided does not match any associated PaymentIntent on this account"

The full message is "The client_secret provided does not match any associated PaymentIntent on this account. Ensure the publishable key used belongs to the same account that created the PaymentIntent." With Stripe.js 10 the element reports it through `@loaderror` and its `#error` slot, after Stripe retries for about 15 seconds. ("No such payment_intent" comes from `retrievePaymentIntent()` or `handleNextAction()` with an unknown PaymentIntent ID, not from the elements.)

The client secret and the publishable key belong to different Stripe accounts or modes. Create the PaymentIntent with the secret key of the same account, in the same mode (test or live), as the publishable key in the browser.

### Elements look unstyled, or the loading text overlaps

The stylesheet is missing. Import it once in your app entry:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

See [Style elements](/guide/styling) for the classes it styles.

### TypeScript cannot find the package's types

Use a module resolution that reads package `exports`, such as `"moduleResolution": "bundler"` (Vite projects) or `"node16"` / `"nodenext"`, in `tsconfig.json`. The package ships declarations for both ES module files and CommonJS files (`.cts`, or `.ts` in a package without `"type": "module"`).

Up to 6.0.0-beta.2, the declarations fail under `node16` / `nodenext`: TS2834 ("Relative import paths need explicit file extensions") inside `dist/types`, exports such as `useStripe` missing or typed `any`, and TS1479 in a CommonJS file. Update the package, or use `"moduleResolution": "bundler"` on those versions.

### Vue 2.7: components do not render

vue-demi is still on its Vue 3 build because its `postinstall` script did not run (pnpm 10+ skips dependency scripts). Allow it or run `npx vue-demi-switch 2.7`; see [Use Vue Stripe on Vue 2.7](/guide/vue-2#_2-let-vue-demi-switch-to-vue-2).

On Vue 2.7, a warning about the unknown element `stripe-pricing-table` means `Vue.config.ignoredElements` is missing it.

### Server rendering fails with `ERR_UNSUPPORTED_DIR_IMPORT`

Version `6.0.0-beta.0` cannot be loaded by Node's ES module loader directly. Update to 6.0.0-beta.1 or later; on 6.0.0-beta.0, bundle it for the server as a workaround (Nuxt `build.transpile`, Vite `ssr.noExternal`). See [Use Vue Stripe with Nuxt and SSR](/guide/ssr#the-server-fails-with-err-unsupported-dir-import).

## Providers and composables

### "useStripe must be called within a VueStripeProvider component or an app using createVueStripe()"

The same message exists for `usePaymentIntent`, `useSetupIntent` and the other composables, and, with "must be used within", for the components that need Stripe (`VueStripeElements`, `VueStripeEmbeddedCheckout` and the Checkout providers). A composable finds Stripe through the providers **above** the component that calls it, so it cannot run in the component that renders the provider:

```vue
<!-- Wrong: CheckoutPage.vue calls the composable and renders the provider -->
<script setup lang="ts">
import { VueStripeProvider, useStripe } from '@vue-stripe/vue-stripe'

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const { stripe } = useStripe() // throws: no provider above this component
</script>

<template>
  <VueStripeProvider :publishable-key="key">
    <p v-if="stripe">Stripe is ready</p>
  </VueStripeProvider>
</template>
```

Move the code that calls the composable into a child component:

```vue
<!-- Correct: CheckoutPage.vue -->
<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import PaymentForm from './PaymentForm.vue'

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="key">
    <PaymentForm />
  </VueStripeProvider>
</template>
```

```vue
<!-- Correct: PaymentForm.vue -->
<script setup lang="ts">
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe() // works: VueStripeProvider is above
</script>

<template>
  <p v-if="stripe">Stripe is ready</p>
</template>
```

Or install the [plugin](/guide/plugin), which provides Stripe to the whole app.

### "VueStripePaymentElement must be used within VueStripeElements or VueStripeCheckoutElementsProvider"

Every element needs an Elements group above it. The same applies to `useStripeElements` ("Elements context not found") and to the composables that read the Payment Element. Wrap the elements, and the component that confirms, in `VueStripeElements`:

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeElements :client-secret="clientSecret">
    <VueStripePaymentElement />
    <PayButton :client-secret="clientSecret" />
  </VueStripeElements>
</VueStripeProvider>
```

With a Checkout Session, use `VueStripeCheckoutElementsProvider` instead; `useCheckoutSession` throws "must be used within a VueStripeCheckoutElementsProvider component" outside it.

### "... is not available inside Checkout Sessions; use it within VueStripeElements"

The Card, split card, IBAN, AU bank account and Link Authentication elements don't exist on Checkout Sessions. Use the Payment Element inside `VueStripeCheckoutElementsProvider`, or render those elements in their own `VueStripeElements` with a PaymentIntent.

### Confirming resolves to "Stripe not initialized"

Stripe.js did not load, so there is no Stripe instance to call. The method confirmers (`useConfirmCardPayment`, ...) reject with "Stripe.js is not loaded yet" in the same situation. Inside `VueStripeProvider` this does not happen: the provider renders its children only once Stripe.js has loaded, and shows its `#error` slot when the load fails. With the [plugin](/guide/plugin), components render before Stripe.js loads; a composable call made during the load waits for it, and only a failed load (blocked network, a secret key) ends in this error. Read the load error from `useStripe().error`:

```vue
<script setup lang="ts">
import { useStripe } from '@vue-stripe/vue-stripe'
import PaymentForm from './PaymentForm.vue'

const { stripe, error } = useStripe()
</script>

<template>
  <p v-if="error">Payments are unavailable: {{ error }}</p>
  <PaymentForm v-else-if="stripe" />
</template>
```

### Calling Stripe.js through `useStripe()` instead of a composable

`useStripe().stripe` is the raw Stripe.js instance. Calling `stripe.value.confirmPayment()` yourself skips what the composables do: `usePaymentIntent` and `useSetupIntent` run `elements.submit()` first (Stripe requires it for the Payment Element), pass the injected Elements group, and track `loading` and `error`. Use the composable for each Stripe.js method; the [Stripe.js coverage](/coverage) page lists which one wraps which method.

## Elements

### The Payment Element stays empty or shows a load error

The Elements group has neither a client secret nor `mode`. Pass `client-secret` once your server returned it (render `VueStripeElements` with `v-if="clientSecret"`), or pass `mode`, `amount` and `currency` to [collect details before creating an Intent](/guide/deferred-intent).

### The Payment Element clears what the customer typed

`VueStripeElements` creates a new Elements group whenever `client-secret`, `mode`, `amount`, `currency` or `setup-future-usage` changes, and the elements remount empty. Fix those values before the customer starts typing, or update the amount on your server and keep the same client secret. `appearance` and `locale` changes don't remount.

### "return_url" errors when confirming

Stripe needs `confirmParams.return_url` with `redirect: 'always'`, and with `redirect: 'if_required'` (the composables' default) as soon as the customer picks a payment method that redirects. Always pass an absolute URL, such as `` `${window.location.origin}/complete` ``.

### The console says "Your Elements integration is using an older API"

Stripe.js logs this warning once per page load when the Payment Element runs on a PaymentIntent client secret, as in [Accept a payment with the Payment Element](/guide/payment-element). It comes from Stripe.js, not from Vue Stripe, and it is advice, not an error: the integration is supported and payments work, so no change is needed. Stripe recommends Checkout Sessions for new integrations. The same form on a Checkout Session is in [Build your own checkout page on a Checkout Session](/guide/custom-checkout), and [Choosing an integration](/guide/approaches) compares the two.

### Apple Pay or Google Pay buttons don't appear

Wallets need HTTPS, a registered domain and a browser with a saved card. See [Test your integration](/guide/testing#wallets-apple-pay-and-google-pay).

## Still stuck

- Check the browser console for `[Vue Stripe]` messages and Stripe.js warnings. A failure your app handles through `@error`, `@loaderror` or an `#error` slot isn't logged by the library, so log the event payload in your handler while you debug.
- Compare with the matching [live demo](/live-demo/), which runs the same components in test mode.
- Search or open an issue on [GitHub](https://github.com/vue-stripe/vue-stripe/issues) with the message, your Vue and Vue Stripe versions, and a minimal reproduction.
