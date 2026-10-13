# @vue-stripe/vue-stripe

> **Release notes for v5.4.0 and later are published on [GitHub Releases](https://github.com/vue-stripe/vue-stripe/releases).**
> The 6.0.0-beta.0 entry points to the v6 notes; the older entries are kept for historical reference (through v5.3.0).

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
