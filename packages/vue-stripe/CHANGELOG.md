# @vue-stripe/vue-stripe

> **Full release notes for v5.4.0 and later are published on [GitHub Releases](https://github.com/vue-stripe/vue-stripe/releases).**
> The v6 entries below summarize each release and link to its notes; the older entries are kept for historical reference (through v5.3.0).

## 6.1.0

Adds the Checkout Elements SDK methods from Stripe.js 10.2.0. The peer range stays `@stripe/stripe-js@^10.0.0`; nothing changes for apps on 10.0 or 10.1.

- `useCheckoutSession()` returns `updateIndividualName()`, `updateBusinessName()` and `getContactDetailsElement()`. The [coverage tracker](https://vuestripe.com/coverage) stays at 100%.
- The type declarations are built with TypeScript 6. `hx()`, `statusShell()` and `renderElement()` declare their `VNode` return type, so the emitted declarations import from `vue-demi` instead of `vue`, and the declaration post-build step rewrites bare `.` / `..` specifiers to `../index.js` / `../index.cjs`.

Notes: the [v6.1.0 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.1.0).

## 6.0.0

First stable release of v6, published under `latest`: `npm install @vue-stripe/vue-stripe@^6 @stripe/stripe-js@^10`. It contains the whole v6 line from 6.0.0-beta.0 (Stripe.js 10 Endive, Vue 3 and Vue 2.7 from one build, 100% Stripe.js coverage); breaking changes are in [Migrating from v5 to v6](https://vuestripe.com/guide/migration-v6). Library changes since beta.6:

- Under `createVueStripe()` alone, a failed Stripe.js load (blocked script, empty key) reaches `@error` and `#error` in `VueStripeEmbeddedCheckout`, the disclosures, `VueStripeElements` and both Checkout providers, instead of leaving them on their loader (#773).
- The disclosures report a rejected `:stripe` promise through `@error` instead of an uncaught error (#774).
- `locale` on `VueStripeProvider` and `VueStripeElements` is typed with Stripe's locales instead of `string`, so a typo such as `locale="jp"` fails type-checking (#776).
- `VueStripePricingTable` hides its element with the `hidden` attribute instead of an inline style, so a nonce-based CSP without `'unsafe-inline'` no longer reports a violation on server-rendered pages (#784).

Notes: the [v6.0.0 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0).

## 6.0.0-beta.6 (pre-release)

- Components that throw from `setup()` when their wrapper or publishable key is missing no longer trigger Vue's follow-up "missing template or render function" warning under an app error handler such as Nuxt's (#745).
- The disclosures log an unhandled Stripe `{ error }` result as `[Vue Stripe]`, like the other components (#761).
- Development moves to `@stripe/stripe-js` 10.1.0; the peer range stays `^10.0.0`.

Notes: the [v6.0.0-beta.6 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.6).

## 6.0.0-beta.5 (pre-release)

- The UMD build bundles the `@stripe/stripe-js` loader, so a script-tag page needs only Vue, vue-demi and Vue Stripe. Before, `VueStripeProvider` failed with "Cannot read properties of undefined (reading 'loadStripe')" (#714).
- `VueStripePricingTable` under `createVueStripe()` with an empty key renders `#error` and emits `@error` instead of throwing, which failed SSR pages with HTTP 500 (#728).

Notes: the [v6.0.0-beta.5 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.5).

## 6.0.0-beta.4 (pre-release)

- `VueStripeCheckoutElementsProvider` and `VueStripeCheckoutFormProvider` check the client secret before Stripe.js gets it, so a failed `fetch-client-secret` shows `#error` without an extra uncaught rejection (#697).
- `VueStripeEmbeddedCheckout` passes `onComplete` and `onAnalyticsEvent` only when you listen for `@complete` / `@analytics`, which removes Stripe.js's `redirect_on_completion: always` warning (#688).
- `VueStripeElements` skips `elements.update()` when an inline `appearance` or `locale` is deep-equal, which ends an update loop with `@update-end` handlers (#704).
- Unused element components are tree-shaken in esbuild bundles too; `import { useStripe }` drops from 2.8 kB to 557 B gzipped.
- Instances created with the library's `loadStripe` re-export register Vue Stripe's Stripe partner details, as provider and plugin instances already did.

Notes: the [v6.0.0-beta.4 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.4).

## 6.0.0-beta.3 (pre-release)

Release candidate after two docs-only dogfood rounds across Nuxt 4, Vite + Vue 3, Vue 2.7 and Vue 3 on Vue CLI, Quasar, VitePress, custom Vite SSR and Laravel + Inertia (120 issues, all fixed). Library changes since beta.2:

- The CommonJS build is `dist/cjs/index.cjs`, so `require()` returns the exports; the type declarations resolve under `node16`/`nodenext` (ESM and CJS) and no longer import a stylesheet.
- Providers fail independently, providers with the same arguments share one Stripe instance, and the deprecated `apiVersion` is ignored with a warning instead of breaking the Stripe.js load.
- Every load or creation failure reaches `@error` / `#error`: Payment Method Messaging, Express Checkout without an Intent, Embedded Checkout `fetch-client-secret`, the Currency Selector, and a rejected Checkout `loadActions()`. `[Vue Stripe]` console errors are logged only when the app does not handle the failure.
- Composables under `createVueStripe()` start and wait for the Stripe.js load; `loading` stays true until the last overlapping call settles; Checkout session actions always resolve `{ type }`.
- Create-only element options are never sent to `update()`; the Express Checkout element has no `clear()` in its type; the split card number forwards `networkschange` and `loaderror`.
- Provider, Checkout provider and pricing table states are keyed, so slot roots never keep the library's markup; on Vue 2.7 an element error no longer reuses the Stripe mount node.
- Typed slot props on every component, Stripe.js types for the `VueStripeElements` props, and `stripeConfigInjectionKey` is exported.
- The default stylesheet sizes card, IBAN and BECS fields as `border-box`.

Docs: new guides for Quasar, Laravel and Inertia, VitePress and Vite SSR; per-method requirements for the 46 confirmers; every TypeScript sample compiles on its own. Notes: the [v6.0.0-beta.3 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.3).

## 6.0.0-beta.2 (pre-release)

- Express Checkout: the `click`, `shippingaddresschange` and `shippingratechange` events are passed to Stripe only when you listen for them. Stripe waits for `resolve()` once a handler is attached, so an Express Checkout Element without `@click` never opened its payment sheet.
- `VueStripeElements`: `appearance`, `fonts` and `options` are typed with Stripe's `Appearance`, `CssFontSource | CustomFontSource` and `StripeElementsOptions`, so a variable typed as Stripe's `Appearance` type-checks.
- `apiVersion` (the `VueStripeProvider` prop and the `createVueStripe()` option) is deprecated. Versioned Stripe.js (Endive) always uses its release train's API version; the value is still forwarded.

Notes: the [v6.0.0-beta.2 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.2).

## 6.0.0-beta.1 (pre-release)

Fixes server-side rendering without a bundler. The ES build of 6.0.0-beta.0 imported `@stripe/stripe-js/pure` as a directory, which plain Node ESM rejects (`ERR_UNSUPPORTED_DIR_IMPORT`), so Vite SSR externals, Nuxt dev and Nitro failed to load the library. It now imports `@stripe/stripe-js/pure/index.mjs`. Since beta.0 it also adds optional Elements injection in `usePaymentIntent` / `useSetupIntent` / `useCreatePaymentMethod` and re-exports the Stripe.js types used in the public API. Notes: the [v6.0.0-beta.1 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.1).

## 6.0.0-beta.0 (pre-release)

First public beta of v6, published under the `beta` dist-tag (`npm install @vue-stripe/vue-stripe@beta`). It contains the whole v6 line: the Stripe.js 10 upgrade and the Stripe.js 10 parity work (Embedded Checkout, Checkout Form SDK, Issuing, Contact Details / Terms / Link Signup, disclosures, the `useConfirm*` and token composables, `usePaymentRequest`, `createVueStripe()` as a global provider). Breaking changes: [Migrating from v5 to v6](https://vuestripe.com/guide/migration-v6). Notes: the [v6.0.0-beta.0 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0-beta.0).

## 5.3.0

### Minor Changes

- feat: add VueStripePricingTable component
  - New component to embed Stripe pricing tables directly in Vue applications
  - Loads pricing-table.js script dynamically
  - Supports customerEmail, customerSessionClientSecret, and clientReferenceId props
  - Emits load and error events
  - Includes loading and error slots for custom UI
  - No backend code required - configuration happens in Stripe Dashboard

### Patch Changes

- Add live demo examples in the the vitepress docs
