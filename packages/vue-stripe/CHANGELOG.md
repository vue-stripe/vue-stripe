# @vue-stripe/vue-stripe

> **Release notes for v5.4.0 and later are published on [GitHub Releases](https://github.com/vue-stripe/vue-stripe/releases).**
> The 6.0.0 beta entries point to the v6 notes; the older entries are kept for historical reference (through v5.3.0).

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
