# @vue-stripe/vue-stripe

> **Release notes for v5.4.0 and later are published on [GitHub Releases](https://github.com/vue-stripe/vue-stripe/releases).**
> The 6.0.0 entry points to the migration guide; the older entries are kept for historical reference (through v5.3.0).

## 6.0.0

Stripe.js 10 (Endive), Vue 2.7 and Vue 3 from one build, and Checkout Sessions with Elements through `VueStripeCheckoutElementsProvider`. This is a breaking release: read [Migrating from v5 to v6](https://vuestripe.com/guide/migration-v6). The full notes are on the [v6.0.0 GitHub Release](https://github.com/vue-stripe/vue-stripe/releases/tag/v6.0.0).

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
