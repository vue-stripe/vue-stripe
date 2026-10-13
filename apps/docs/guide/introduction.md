---
description: "About Vue Stripe: a Vue 3 and Vue 2.7 library that wraps Stripe.js 10 Elements, Checkout and methods in components and composables, and why."
---

# About Vue Stripe

Vue Stripe is a Vue library for the browser side of a Stripe integration. It wraps [Stripe.js](https://docs.stripe.com/js) 10 (the Endive release) in Vue components and composables. Components cover Stripe's Elements and its embedded Checkout UIs. Composables cover the Stripe.js methods that confirm payments, create tokens and run next actions. One build runs on Vue 3 and Vue 2.7.

This page explains what the library covers, what it leaves to you, and why it is built the way it is. To start building, take the [first test payment tutorial](/guide/first-payment) or go straight to the [installation guide](/guide/installation).

## What Vue Stripe wraps

Stripe.js is the script Stripe hosts at `js.stripe.com`. It renders the payment fields inside Stripe-hosted iframes and talks to Stripe's API with your publishable key. Using it from Vue directly means a lot of glue code. You load the script once, keep a `Stripe` instance and an Elements group somewhere your components can reach, mount each element into a DOM node after render, attach and detach event listeners, call `update()` when options change, `destroy()` on unmount, and track loading and error state for every call a button makes.

Vue Stripe does that glue work and nothing more. The objects stay Stripe's own:

- `VueStripeProvider` holds the `Stripe` instance that `loadStripe()` returns.
- `VueStripeElements` holds the Elements group that `stripe.elements()` returns.
- Each element component, such as `VueStripePaymentElement`, holds one element that `elements.create()` returns.
- Each composable, such as `usePaymentIntent()` or `useConfirmCardPayment()`, wraps one Stripe.js method and adds `loading` and `error` refs.

Because the components follow Stripe's object model, Stripe's own documentation still applies. An option Stripe documents for `elements.create('payment', options)` goes in the Payment Element's `options` prop. A result Stripe documents for `stripe.confirmPayment()` is what `confirmPayment()` resolves to. The types come from `@stripe/stripe-js`, and the library re-exports the ones its components and composables use.

Every element and method in Stripe.js 10 has a component or composable. The [Stripe.js coverage page](/coverage) maps each one to its wrapper, and the [reference](/api/) documents every export.

## What it leaves to you

Vue Stripe runs only in the browser. Everything that needs your secret key happens on your server, with Stripe's server library or the API:

- creating PaymentIntents, SetupIntents, Checkout Sessions and Customers,
- confirming on the server, when you choose that flow,
- receiving webhooks and fulfilling orders.

The guides show server code next to the Vue code where a flow needs it. [Payment objects](/guide/payment-objects) explains what each server-side object is for, and [What runs where](/guide/security) explains which key and which secret belong on which side.

Vue Stripe has no payment UI of its own, either. Stripe renders the fields, and the [Appearance API](/api/components/stripe-elements#appearance-api) styles them. The library only adds a thin wrapper around each element for its loading and error states. That wrapper is styled by a small stylesheet, `@vue-stripe/vue-stripe/style.css`, which you import once.

## Design choices

### Providers and composables, not a global object

Stripe state lives in Vue's provide/inject tree. A provider supplies the `Stripe` instance, an Elements provider supplies the group, and components and composables below them inject what they need. This keeps several Stripe accounts or Elements groups on one page apart, and it matches how Stripe scopes its own objects. An element belongs to one group, and `confirmPayment()` confirms what that group collected. [How Vue Stripe works](/guide/architecture) follows the chain in detail.

For apps that use Stripe on many pages, the [`createVueStripe()`](/api/plugin) plugin provides the `Stripe` instance app-wide instead. [Choosing an integration](/guide/approaches#plugin-or-provider) compares the two.

### A composable for every call

You could call methods on the raw `stripe` object from `useStripe()`. The composables exist because almost every call needs the same extras. A Pay button needs a `loading` flag to disable itself and an `error` message to show. The Payment Element needs `elements.submit()` to run before `confirmPayment()`. The call needs the Elements group from the nearest provider. The composables do this the same way everywhere, so a component never has to hold the raw instance.

The method composables pass their arguments to Stripe.js unchanged and return Stripe's result unchanged. Stripe's documentation for `stripe.confirmSepaDebitPayment()` is the documentation for `useConfirmSepaDebitPayment()`.

### Stripe.js loads only when needed

The library imports Stripe.js through the `@stripe/stripe-js/pure` entry, so importing Vue Stripe loads nothing. Stripe.js is requested when the first provider mounts, and providers that mount together share one load. [How Stripe.js is loaded](/guide/stripe-js-loading) explains the reasons and the trade-offs, including Stripe's advanced fraud signals.

### One build for Vue 3 and Vue 2.7

Every component is a render function written against [vue-demi](https://github.com/vueuse/vue-demi), with no single-file components in the library. vue-demi resolves to Vue 3 or Vue 2.7 at install time, so one published build serves both. CI mounts that build on Vue 2.7 to check it. Vue 2.6 and older are not supported, because the components rely on APIs that arrived in 2.7. See [Use Vue Stripe on Vue 2.7](/guide/vue-2) for the Vue 2.7 setup.

### Stripe objects stay out of Vue's reactivity

The `Stripe` instance, the Elements group and each element are held in shallow refs and never made deeply reactive. Vue's proxies would wrap Stripe's internal state, so an element passed back to Stripe would no longer be the object Stripe created. The composables return these objects through `computed()` rather than `readonly()` for the same reason: on Vue 2.7, `readonly()` copies plain objects.

### Errors that name the missing piece

Using a component or composable outside the provider it needs throws a typed error that names the wrapper it expected (`VueStripeProviderError`, `VueStripeElementsError` or `VueStripeCheckoutError`). Every console message from the library starts with `[Vue Stripe]`, so its messages are easy to tell apart from Stripe.js's.

## Relation to Stripe.js versions

Stripe ships Stripe.js in named release trains, and each major version of `@stripe/stripe-js` loads one train. Vue Stripe 6 requires `@stripe/stripe-js` 10, which loads Endive. When Stripe removes an element or a method in a new train, Vue Stripe removes its wrapper in the matching major release, because there is nothing left to wrap. [Stripe.js versions](/guide/stripe-js-versions) covers what Clover, Dahlia and Endive changed, and why some v5 components are gone.

## Who maintains it

[Joff Tiquez](https://github.com/jofftiquez) created Vue Stripe in 2017 and has maintained it since. The code, issues and releases are on [GitHub](https://github.com/vue-stripe/vue-stripe), and the package is published to npm as [`@vue-stripe/vue-stripe`](https://www.npmjs.com/package/@vue-stripe/vue-stripe).

## Where to go next

- [Take your first test payment](/guide/first-payment): the tutorial, start to finish.
- [How-to guides](/guide/): one page per task.
- [Reference](/api/): every component, composable and type.
- [How Vue Stripe works](/guide/architecture) and [Choosing an integration](/guide/approaches): the rest of the explanation.
- [Live demos](/live-demo/): every flow running against Stripe's test mode.
