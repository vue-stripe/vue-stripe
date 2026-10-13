# Troubleshoot common problems

Find the message or symptom you see, then apply the fix. Errors that Vue Stripe throws start with the component or composable name; console messages from the library start with `[Vue Stripe]`.

## Setup

### "publishableKey or stripeKey is required"

`VueStripeProvider` received no key, usually because the environment variable is empty in the browser:

- Check the variable prefix your build tool exposes to client code (`VITE_`, `VUE_APP_`, `NUXT_PUBLIC_`); see [Install and set up](/guide/installation#_3-add-your-publishable-key).
- Restart the dev server after editing `.env` files; most tools read them only at startup.

### The provider shows an error instead of loading

The provider's `#error` slot (or its default error text) means Stripe.js could not load or rejected the key:

- **Blocked script**: an ad blocker, privacy extension or Content Security Policy blocked `https://js.stripe.com`. Allow Stripe's hosts in your CSP as listed in [Stripe's CSP guide](https://docs.stripe.com/security/guide#content-security-policy) (at least `https://js.stripe.com` in `script-src` and `frame-src`), and test in a clean browser profile.
- **Wrong key**: the key must be a publishable key, `pk_test_...` or `pk_live_...`, with no spaces or line breaks. A secret key (`sk_...`) is rejected by Stripe.js; never send it to the browser.

### Elements show "No such payment_intent" or a key error

The client secret and the publishable key belong to different Stripe accounts or modes. Create the PaymentIntent with the secret key of the same account, in the same mode (test or live), as the publishable key in the browser.

### Elements look unstyled, or the loading text overlaps

The stylesheet is missing. Import it once in your app entry:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

See [Style elements](/guide/styling) for the classes it styles.

### TypeScript cannot find the package's types

Use a module resolution that reads package `exports`, such as `"moduleResolution": "bundler"` (Vite projects) or `"node16"` / `"nodenext"`, in `tsconfig.json`.

### Vue 2.7: components do not render

vue-demi is still on its Vue 3 build because its `postinstall` script did not run (pnpm 10+ skips dependency scripts). Allow it or run `npx vue-demi-switch 2.7`; see [Use Vue Stripe on Vue 2.7](/guide/vue-2#_2-let-vue-demi-switch-to-vue-2).

On Vue 2.7, a warning about the unknown element `stripe-pricing-table` means `Vue.config.ignoredElements` is missing it.

### Server rendering fails with `ERR_UNSUPPORTED_DIR_IMPORT`

Version `6.0.0-beta.0` cannot be loaded by Node's ES module loader directly. Update to 6.0.0-beta.1 or later; on 6.0.0-beta.0, bundle it for the server as a workaround (Nuxt `build.transpile`, Vite `ssr.noExternal`). See [Use Vue Stripe with Nuxt and SSR](/guide/ssr#the-server-fails-with-err-unsupported-dir-import).

## Providers and composables

### "useStripe must be called within a VueStripeProvider component or an app using createVueStripe()"

The same message exists for `usePaymentIntent`, `useSetupIntent` and the other composables. A composable finds Stripe through the providers **above** the component that calls it, so it cannot run in the component that renders the provider:

```vue
<!-- Wrong: CheckoutPage.vue calls the composable and renders the provider -->
<script setup>
import { VueStripeProvider, useStripe } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe() // throws: no provider above this component
</script>

<template>
  <VueStripeProvider :publishable-key="key">
    ...
  </VueStripeProvider>
</template>
```

Move the code that calls the composable into a child component:

```vue
<!-- Correct: CheckoutPage.vue -->
<template>
  <VueStripeProvider :publishable-key="key">
    <PaymentForm />
  </VueStripeProvider>
</template>
```

```vue
<!-- Correct: PaymentForm.vue -->
<script setup>
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe() // works: VueStripeProvider is above
</script>
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

The call ran before Stripe.js finished loading, for example directly in `setup()`. Confirm from a user action, and disable the button until Stripe is ready:

```vue
<script setup>
import { useStripe, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: { type: String, required: true } })
const { stripe } = useStripe()
const { confirmPayment, loading } = usePaymentIntent()

const pay = () =>
  confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` }
  })
</script>

<template>
  <button :disabled="!stripe || loading" @click="pay">Pay</button>
</template>
```

Inside `VueStripeProvider` this rarely happens, because the provider renders its children only once Stripe.js has loaded. With the plugin, components render before Stripe.js loads. The method confirmers (`useConfirmCardPayment`, ...) reject with "Stripe.js is not loaded yet" in the same situation.

### Calling Stripe.js through `useStripe()` instead of a composable

`useStripe().stripe` is the raw Stripe.js instance. Calling `stripe.value.confirmPayment()` yourself skips what the composables do: `usePaymentIntent` and `useSetupIntent` run `elements.submit()` first (Stripe requires it for the Payment Element), pass the injected Elements group, and track `loading` and `error`. Use the composable for each Stripe.js method; the [Stripe.js coverage](/coverage) page lists which one wraps which method.

## Elements

### The Payment Element stays empty or shows a load error

The Elements group has neither a client secret nor `mode`. Pass `client-secret` once your server returned it (render `VueStripeElements` with `v-if="clientSecret"`), or pass `mode`, `amount` and `currency` to [collect details before creating an Intent](/guide/deferred-intent).

### The Payment Element clears what the customer typed

`VueStripeElements` creates a new Elements group whenever `client-secret`, `mode`, `amount`, `currency` or `setup-future-usage` changes, and the elements remount empty. Fix those values before the customer starts typing, or update the amount on your server and keep the same client secret. `appearance` and `locale` changes don't remount.

### "return_url" errors when confirming

Stripe needs `confirmParams.return_url` with `redirect: 'always'`, and with `redirect: 'if_required'` (the composables' default) as soon as the customer picks a payment method that redirects. Always pass an absolute URL, such as `` `${window.location.origin}/complete` ``.

### Apple Pay or Google Pay buttons don't appear

Wallets need HTTPS, a registered domain and a browser with a saved card. See [Test your integration](/guide/testing#wallets-apple-pay-and-google-pay).

## Still stuck

- Check the browser console for `[Vue Stripe]` messages and Stripe.js warnings.
- Compare with the matching [live demo](/live-demo/), which runs the same components in test mode.
- Search or open an issue on [GitHub](https://github.com/vue-stripe/vue-stripe/issues) with the message, your Vue and Vue Stripe versions, and a minimal reproduction.
