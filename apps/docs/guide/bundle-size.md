---
title: "Vue Stripe bundle size: what each import costs"
description: "Vue Stripe tree-shakes: your bundle gets only what you import. Sizes for the whole library, typical checkouts and every export, measured when the site is built."
---

# Bundle size and tree-shaking

Vue Stripe is tree-shakeable. Your app's bundle gets only the components and composables you import, plus the code they share. Import the Payment Element and `usePaymentIntent`, and the Card Element, the Checkout components and the rest of the library stay out.

<BundleSize part="summary" />

The site measures these numbers from the library's own build each time it is built, so they match the version shown. [How the numbers are measured](#how-the-numbers-are-measured) explains the method.

## What a typical integration costs

An integration imports a few pieces together, and they share code: the provider plumbing and the element factory are counted once, however many pieces use them.

<BundleSize part="combinations" />

### The first element and the ones after it

Every element component is a small definition (its element type, events and options) handed to one shared factory. That factory does the real work: it creates and mounts the Stripe element, wires its events, tracks loading and errors, and renders the slots. The first element you import brings the factory with it. Every element after it adds only its own definition.

<BundleSize part="elements" />

## How tree-shaking works here

Four things let a bundler leave out what you don't use.

- **An ES module build.** The package's `exports` map sends `import` to `dist/es/index.js`, an ES module, and bundlers that don't read `exports` find the same file through the `module` field. Bundlers can only tree-shake ES modules.
- **`"sideEffects": ["*.css"]`.** This field in the package's `package.json` tells bundlers that importing the library's JavaScript does nothing by itself, so code you don't reference can go. Only the stylesheet is listed, so `import '@vue-stripe/vue-stripe/style.css'` is always kept.
- **`/* @__PURE__ */` on every definition.** Each element component is the result of a `createStripeElement({ ... })` call, and each method composable (`useConfirmCardPayment` and the other confirmers) of a factory call too. A bundler can't tell on its own that such a call has no side effects, so it would keep every component. Each of these calls is marked `/* @__PURE__ */`, which tells the bundler it may drop the result when nothing uses it.
- **Named imports.** `import { VueStripePaymentElement } from '@vue-stripe/vue-stripe'` names exactly what you use. A namespace import (`import * as VueStripe`) tree-shakes just as well while you only read members by name, such as `VueStripe.useStripe`. Code that walks the whole namespace keeps every export.

```ts
// Correct: only the provider, the Elements wrapper and the Payment Element are bundled
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

// Wrong: the loop reads every export, so the whole library is bundled
import * as VueStripe from '@vue-stripe/vue-stripe'
for (const [name, component] of Object.entries(VueStripe)) app.component(name, component)
```

The [`createVueStripe()` plugin](/api/plugin) provides Stripe to the whole app and registers no components, so installing it adds only the plugin itself.

## What these numbers leave out

- **Vue.** It is a peer dependency, so your app already has it and the numbers never count it. The same goes for `vue-demi`, the small module that lets one build run on Vue 3 and Vue 2.7 by re-exporting your app's Vue.
- **Stripe.js.** Stripe.js itself is never in your bundle. Stripe requires it to be loaded from `js.stripe.com`, and the `@stripe/stripe-js` loader adds that script tag at runtime ([How Stripe.js is loaded](/guide/stripe-js-loading) explains when). `@stripe/stripe-js` is a peer dependency you install next to Vue Stripe, and Vue Stripe imports only its `pure` loader. The table below gives that loader's own size.
- **The stylesheet.** The element styles are a separate CSS file, `@vue-stripe/vue-stripe/style.css`, which your app imports once. It is measured on its own below.

<BundleSize part="other" />

## CommonJS and UMD builds

The package ships two more builds, and neither of them tree-shakes. Each is one file with every export in it.

- **CommonJS** (`dist/cjs/index.cjs`) is what `require('@vue-stripe/vue-stripe')` loads: Node, test runners and tools that don't read ES modules. On a server its size doesn't matter. In a browser bundle it would, so check that your bundler takes the ES build. Any bundler that reads `exports` or `module` does.
- **UMD** (`dist/umd/index.js`) is for a `<script>` tag, loaded from unpkg or jsDelivr. It defines a `VueStripe` global with every export, because no bundler runs to leave anything out.

Their sizes are in the table above.

## Check the size in your own app

The numbers here are for Vue Stripe alone. Your bundler shows what it costs in your app, next to everything else:

- **Vite** prints each output file with its gzipped size at the end of `vite build`. For a breakdown by module, add [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer), which draws a treemap of the build.
- **Nuxt**: `npx nuxi analyze` builds the app and opens the same kind of treemap.
- **Vue CLI** (webpack): `vue-cli-service build --report` writes `dist/report.html`.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [vue(), visualizer({ gzipSize: true, open: true })]
})
```

In the report, look for `@vue-stripe/vue-stripe`: only the exports you use, and the code they share, should be there.

## The size budget in CI

The library has a size budget, and CI enforces it. `packages/vue-stripe/.size-limit.json` sets a limit, minified and gzipped, for the whole ES build and for three single imports. [size-limit](https://github.com/ai/size-limit) checks them on every pull request and again before each release is published, and a change that goes over a limit fails. CI also comments each pull request with the size change against its base branch. To check locally, run `pnpm size` in the repository.

<BundleSize part="budgets" />

## How the numbers are measured

When the site is built, it bundles each export from the library's ES build with [Rolldown](https://rolldown.rs), the bundler in Vite 8 and the one size-limit uses. Each measurement is an `import { ... } from '@vue-stripe/vue-stripe'`, tree-shaken and minified, with Vue and `@stripe/stripe-js` left external, then gzipped at the highest level. The few bytes of the importing module itself are taken off, as size-limit does, so the figures match the CI budgets to the byte.

Other bundlers, such as Rollup (Vite 5 to 7) and webpack, tree-shake the same ES build. They minify differently, so their bytes differ a little.

## Every export

Each export below is imported on its own, with the shared code it needs. Exports share that code, so the sizes of two exports add up to more than the two cost together. The groups follow the [API reference](/api/), smallest first.

<BundleSize part="table" />
