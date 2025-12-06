<p align="center">
  <img src="./.github/assets/vue-stripe-logo-variant-1.png" alt="Vue Stripe Logo" width="250"/>
  <h1 align="center">
    Vue Stripe
    <div style="height: 10px;"></div>
    <a href="https://stripe.com/partners/vue-stripe" target="_blank"><img src="./.github/assets/stripe_partner_badge_verified_blurple.png" alt="Stripe Partner" height="30"/></a>
  
  </h1>
</p>

<p align="center">
  <a href="https://stripe.com/partners/vue-stripe" target="_blank"><img src="./.github/assets/stripe_partner_badge_verified_blurple.png" alt="Stripe Partner" width="98"/></a>
  <a href="https://opencollective.com/vue-stripe-checkout"><img src="https://opencollective.com/vue-stripe-checkout/all/badge.svg?label=financial+contributors" alt="Financial Contributors on Open Collective"/></a>
  <a href="https://www.npmjs.com/package/@vue-stripe/vue-stripe"><img src="https://img.shields.io/npm/v/@vue-stripe/vue-stripe.svg?style=flat-square" alt="npm version"/></a>
  <img src="https://img.shields.io/bundlephobia/min/@vue-stripe/vue-stripe?style=flat-square" alt="npm bundle size"/>
  <img src="https://img.shields.io/npm/dw/@vue-stripe/vue-stripe?style=flat-square" alt="npm downloads"/>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

<p align="center">
  <strong>Vue.js library for Stripe Checkout and Elements</strong><br/>
  Vue 3.x with TypeScript-first development
</p>

<p align="center">
  <a href="https://vuestripe.com">Website</a> |
  <a href="https://vuestripe.com/guides/">Guides</a> |
  <a href="https://vuestripe.com/api/">API</a>
</p>

---

> [Vue Stripe](https://vuestripe.com) is an official [Stripe partner](https://stripe.com/partners/vue-stripe)

## Announcement

Thank you for your patience! This is an early release of the new Vue Stripe. As with any early release, you may encounter bugs. If you find any issues or have suggestions, please [create an issue](https://github.com/vue-stripe/vue-stripe/issues) or [submit a pull request](https://github.com/vue-stripe/vue-stripe/pulls). Your contributions are greatly appreciated!

## Features

- **Vue 3** — Built for Vue 3.x
- **TypeScript First** — Full TypeScript support with comprehensive types
- **Modern Elements** — Payment Element supporting 40+ payment methods
- **Composition API** — Vue 3 Composition API
- **Customizable** — Full support for Stripe's Appearance API
- **Well Tested** — Comprehensive test suite
- **SSR Ready** — Support for Nuxt 3 and server-side rendering

## Quick Start

```bash
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripePaymentElement @ready="onReady" />
      <button @click="processPayment">Pay Now</button>
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup lang="ts">
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'

const publishableKey = 'pk_test_...'
const { confirmPayment } = usePaymentIntent()

const processPayment = async () => {
  const result = await confirmPayment(clientSecret)
  // Handle result
}
</script>
```

## Documentation

- [Website](https://vuestripe.com)
- [Guides](https://vuestripe.com/guide/introduction)
- [API Reference](https://vuestripe.com/api/)
- [Backend Data Generator](https://backend.vuestripe.com) - Generate test client secrets and payment intents

## Monorepo Structure

This repository is organized as a monorepo using pnpm workspaces and Turborepo:

```
vue-stripe/
├── packages/
│   └── vue-stripe/        # Main library (@vue-stripe/vue-stripe)
├── apps/
│   ├── docs/              # VitePress documentation site
│   └── playground/        # Development playground
│   └── backend/           # Backend for the playground
└── tools/
    ├── eslint-config/     # Shared ESLint configuration
    └── typescript-config/ # Shared TypeScript configuration
```

### Packages

| Package | Description |
|---------|-------------|
| [@vue-stripe/vue-stripe](./packages/vue-stripe) | Main library package |
| [@vue-stripe/docs](./apps/docs) | VitePress documentation |
| [@vue-stripe/playground](./apps/playground) | Development playground |
| [@vue-stripe/backend](./apps/backend) | Backend for the playground |

## Development

### Prerequisites

- Node.js 20+
- pnpm 8+

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development (all apps)
pnpm dev

# Start playground only
pnpm playground:dev

# Start documentation only
pnpm docs:dev
```

### Building & Testing

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all packages
pnpm lint
```

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)]

<a href="https://github.com/jofftiquez/vue-stripe-checkout/graphs/contributors"><img src="https://opencollective.com/vue-stripe-checkout/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/vue-stripe-checkout/contribute)]

#### Individuals

<a href="https://opencollective.com/vue-stripe-checkout"><img src="https://opencollective.com/vue-stripe-checkout/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/vue-stripe-checkout/contribute)]

<a href="https://opencollective.com/vue-stripe-checkout/organization/0/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/1/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/2/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/3/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/4/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/5/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/6/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/7/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/8/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/vue-stripe-checkout/organization/9/website"><img src="https://opencollective.com/vue-stripe-checkout/organization/9/avatar.svg"></a>

## License

[MIT](LICENSE) License © 2017-2025 Vue Stripe Contributors

---

Made with :heart: by [Joff Tiquez](https://twitter.com/jrtiquez)
