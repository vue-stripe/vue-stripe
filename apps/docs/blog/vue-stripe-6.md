---
title: "Vue Stripe 6: Stripe.js 10 for Vue 3 and Vue 2.7"
date: 2026-11-08
description: "Vue Stripe 6 is out: Stripe.js 10 (Endive), one build for Vue 3 and Vue 2.7, every Stripe.js element and method wrapped, and live demos to open in StackBlitz."
---

# Vue Stripe 6: Stripe.js 10 for Vue 3 and Vue 2.7

<BlogPostDate />

Vue Stripe 6 is out. It moves the library to **Stripe.js 10 (Endive)**, Stripe's current release train, and one build runs on **Vue 3 and Vue 2.7**. Version 6.0.0 shipped on October 15 and is npm's `latest`; 6.1.0 followed on November 1.

```bash
npm install @vue-stripe/vue-stripe@^6 @stripe/stripe-js@^10
```

```ts
// main.ts: once, before the components render
import '@vue-stripe/vue-stripe/style.css'
```

New to Vue Stripe? [Take your first test payment](/guide/first-payment). Coming from v5? Skip to [Upgrading from v5](#upgrading-from-v5).

## Every Stripe.js 10 element and method

v6 wraps all of Stripe.js 10. The [Stripe.js coverage tracker](/coverage) lists each element and method next to the Vue Stripe component or composable that wraps it, and it stays at 100%. What v6 adds:

- **New Checkout integrations.** [`VueStripeEmbeddedCheckout`](/guide/embedded-checkout) puts Stripe's prebuilt Checkout page inside yours. The [Checkout Form](/guide/checkout-form) (`VueStripeCheckoutFormProvider`, `VueStripeCheckoutForm` and `useCheckoutForm()`) is a Stripe beta.
- **Elements inside Checkout Sessions.** The Payment, Address, Express Checkout and other element components mount from the session inside `VueStripeCheckoutElementsProvider`, so you can [build your own page on a Checkout Session](/guide/custom-checkout) with the same components you use elsewhere.
- **New elements:** Tax ID, Currency Selector and Contact Details; Terms and Link Signup (Stripe betas); the [Issuing elements](/guide/issuing); and the Issuing, Treasury and Financial Account disclosures.
- **New composables:** confirmation tokens, tokens, card actions and micro-deposit verification; Radar sessions, ephemeral key nonces, Financial Connections, [Identity](/guide/identity) and Payment Request; and one [method confirmer](/api/composables/confirm/) per Stripe.js `confirm<Method>Payment` and `confirm<Method>Setup` method.

## Stripe for the whole app with one plugin

In v5, `createVueStripe()` only stored the publishable key, and every page still needed a `VueStripeProvider`. In v6 the plugin loads Stripe.js the first time something needs it, so element components, `VueStripeElements` and the composables work without a provider:

```ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

createApp(App)
  .use(createVueStripe({ publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY }))
  .mount('#app')
```

See [Provide Stripe app-wide](/guide/plugin).

## Vue 3 and Vue 2.7, typed, small

- **One build for both Vues.** The same package runs on Vue 3 and Vue 2.7, checked by a Vue 2.7 compatibility suite. See [Use Vue Stripe on Vue 2.7](/guide/vue-2).
- **Typed throughout.** `locale`, events, slots and exposed members are typed, and `vue-tsc` with `strictTemplates` checks your templates, so a typo such as `locale="jp"` fails type-checking.
- **Small and tree-shakeable.** At 6.0.0 the whole library was 11.8 kB gzipped, and a Payment Element checkout added about 5 kB to an app. The [bundle size page](/guide/bundle-size) has the current numbers for every export.
- **A script-tag build.** The UMD build bundles the Stripe.js loader, so a page without a bundler needs only Vue, vue-demi and Vue Stripe ([Without a bundler](/guide/installation#without-a-bundler)).

## What 6.1 adds

6.1.0 picks up the Checkout Elements SDK methods from Stripe.js 10.2.0. `useCheckoutSession()` returns `updateIndividualName()` and `updateBusinessName()`, which set the customer's name or business name on a session with name collection, and `getContactDetailsElement()`. It is a drop-in update: the peer range stays `@stripe/stripe-js@^10.0.0`, and nothing changes for apps on Stripe.js 10.0 or 10.1.

A scheduled workflow now opens an issue whenever a new `@stripe/stripe-js` is released, so new Stripe.js features reach Vue Stripe quickly. 6.1 closed the first one.

## Copy a demo that works

The [live demos](/live-demo/) run each flow against Stripe's test mode: Stripe Checkout, the Payment Element, Embedded and custom Checkout, wallets, bank debits, saved cards, tokens, Identity and subscriptions. Each demo page now shows the code it runs, in tabs under the demo, imported from the same files the demo uses, so the code on the page is never out of date.

Next to the code, **Open in StackBlitz** opens the demo as a Vite + Vue project with every file it imports, on the published `@vue-stripe/vue-stripe`, in Stripe test mode against the demo backend. Fork it, swap in your own test key and backend, and you have a running starting point. Try it on the [Payment Element demo](/live-demo/payment-element).

## Tested by building real apps from the docs

Before 6.0.0, six rounds of dogfood testing built real apps from the docs alone, with the published package, and took real Stripe test payments:

- in Vite + Vue 3, Nuxt 4, Vue 2.7, Quasar, Laravel 12 and 13, VitePress and Vite SSR;
- in Vue CLI, Rsbuild, Astro and Ionic;
- in Chromium, Firefox, WebKit and phone profiles;
- in a v5 app upgraded with the migration guide;
- under failure conditions: offline, blocked Stripe.js and a strict CSP.

Every issue they found was fixed before the release, and the library shipped with 1,897 unit tests. The rounds also produced the framework guides: [Nuxt and SSR](/guide/ssr), [Vite SSR](/guide/vite-ssr), [VitePress](/guide/vitepress), [Quasar](/guide/quasar) and [Laravel with Inertia](/guide/laravel), plus guides for [webhooks](/guide/webhooks), [testing](/guide/testing) and [error handling](/guide/error-handling). For AI assistants, every page has a Markdown copy, indexed in `/llms.txt`.

## Upgrading from v5

v6 is a major release, and most of its breaking changes follow Stripe: parts of Stripe.js that Stripe removed or renamed between the Basil, Clover, Dahlia and Endive releases are gone or renamed here too.

| | v5 | v6 |
| --- | --- | --- |
| `vue` | `^2.6 \|\| ^3` | `^2.7 \|\| ^3` |
| `@stripe/stripe-js` | `^7.5 \|\| ^8.5` | `^10.0.0` (Endive) |
| Stylesheet | none | `@vue-stripe/vue-stripe/style.css` |

The changes you are most likely to hit:

- **Vue 2.6 is no longer supported.** Upgrade to Vue 2.7 first.
- **Import the stylesheet.** The components carry no styles of their own.
- **The iDEAL, P24, EPS and FPX bank elements are removed**, because Stripe removed them. The Payment Element collects those methods.
- **Hosted Checkout takes a URL.** `<VueStripeCheckout :session-url>` replaces session IDs, price IDs and line items; create the session on your server.
- **`VueStripeCheckoutProvider` is now `VueStripeCheckoutElementsProvider`.** The old name still works as a deprecated alias, but `@ready` now receives the session's actions, and actions called before it resolve to an error.
- **Your server changes too.** Replace `payment_method_types` with `allowed_payment_method_types`, and create Checkout Sessions with Elements with `ui_mode: 'elements'` on API version Dahlia or later.

[Upgrade from v5 to v6](/guide/migration-v6) walks through every change with its replacement, the order to deploy the server changes in, and a checklist. If you are on a 6.0.0 beta, `npm update` moves you to the latest 6.x.

## Thank you

Vue Stripe has been around since 2017, and it is a Stripe Verified Partner library. Thanks to everyone who filed issues, tested the betas and sent fixes. If something in v6 or its docs does not work for you, [open an issue](https://github.com/vue-stripe/vue-stripe/issues/new/choose), and if Vue Stripe saves you time, a [star on GitHub](https://github.com/vue-stripe/vue-stripe) helps others find it.

The full notes are on GitHub: [v6.0.0](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0) and [v6.1.0](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.1.0).
