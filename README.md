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
  <a href="https://github.com/sponsors/jofftiquez"><img src="https://img.shields.io/github/sponsors/jofftiquez?style=flat-square&label=sponsors" alt="GitHub Sponsors"/></a>
  <a href="https://www.npmjs.com/package/@vue-stripe/vue-stripe"><img src="https://img.shields.io/npm/v/@vue-stripe/vue-stripe.svg?style=flat-square" alt="npm version"/></a>
  <img src="https://img.shields.io/bundlephobia/min/@vue-stripe/vue-stripe?style=flat-square" alt="npm bundle size"/>
  <img src="https://img.shields.io/npm/dw/@vue-stripe/vue-stripe?style=flat-square" alt="npm downloads"/>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

<p align="center">
  <strong>Vue.js library for Stripe Checkout and Elements</strong><br/>
  Vue 3 and Vue 2.7, TypeScript-first
</p>

<p align="center">
  <a href="https://vuestripe.com">Website</a> |
  <a href="https://vuestripe.com/guide/introduction">Guides</a> |
  <a href="https://vuestripe.com/api/">API</a>
  <a href="https://playground.vuestripe.com">Playground</a>
  <a href="https://backend.vuestripe.com">Backend</a>
</p>

---

> [Vue Stripe](https://vuestripe.com) is an official [Stripe partner](https://stripe.com/partners/vue-stripe)

## Announcement

Thank you for your patience! This is an early release of the new Vue Stripe. As with any early release, you may encounter bugs. If you find any issues or have suggestions, please [create an issue](https://github.com/vue-stripe/vue-stripe/issues) or [submit a pull request](https://github.com/vue-stripe/vue-stripe/pulls). Your contributions are greatly appreciated!

### A note on AI-assisted maintenance

I've decided to start using AI to help me maintain Vue Stripe, and I want to be upfront with you about it. **Rest assured that everything is still kept under heavy scrutiny** — every change is reviewed, tested, and verified by me before it ships.

To be honest about the reality of it: I maintain this project largely on my own, and only in whatever extra time I can find. That time is limited, and I'm often not able to give it my full 100%. With just one person, it's genuinely hard to find the time to provide the quality and pace of work the project deserves without some extra help. Bringing AI in as an assistant lets me move faster and cover more ground — more tests, better docs, quicker fixes — while I stay in the loop as the human who reviews and approves everything.

Thank you for understanding, and for continuing to support Vue Stripe.

## Features

- **Vue 3 and Vue 2.7** — One build for both, tested on each in CI
- **Stripe.js 10** — Payment, Express Checkout, Address, Tax ID, Currency Selector and more, plus Checkout Sessions with Elements
- **TypeScript First** — Full TypeScript support with comprehensive types
- **Modern Elements** — Payment Element supporting 40+ payment methods
- **Composition API** — Composables for confirming payments (one per Stripe.js confirm method), tokens, Financial Connections, Identity and Checkout Sessions
- **Every Checkout** — Hosted Checkout, Embedded Checkout, Custom Checkout and the Checkout Form (beta)
- **100% Stripe.js coverage** — Every Stripe.js 10 element and method has a component or composable ([coverage](https://vuestripe.com/coverage))
- **Customizable** — Full support for Stripe's Appearance API
- **Well Tested** — Comprehensive test suite
- **SSR Ready** — Support for Nuxt 3 and server-side rendering

## Quick Start

### Requirements

| Package | Version |
|---------|---------|
| `vue` | `^2.7.0 \|\| ^3.0.0` (Vue 2.6 is not supported) |
| `@stripe/stripe-js` | `^10.0.0` (Stripe.js Endive) |

Upgrading from v5? Read [Migrating from v5 to v6](https://vuestripe.com/guide/migration-v6).

### Installation

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```

Import the component styles once, for example in `main.ts`:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

### Basic Usage

Composables such as `usePaymentIntent()` read the Stripe context, so call them in a component rendered **inside** `VueStripeElements`:

```vue
<!-- CheckoutPage.vue -->
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
      <PayButton :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup lang="ts">
import { VueStripeProvider, VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'
import PayButton from './PayButton.vue'

const publishableKey = 'pk_test_...'
const clientSecret = 'pi_..._secret_...' // from your server
</script>
```

```vue
<!-- PayButton.vue -->
<template>
  <button :disabled="loading" @click="pay">Pay now</button>
  <p v-if="error">{{ error }}</p>
</template>

<script setup lang="ts">
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmPayment, loading, error } = usePaymentIntent()

const pay = () =>
  confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` }
  })
</script>

## Documentation

- [Website](https://vuestripe.com) - Official website for Vue Stripe
- [Guides](https://vuestripe.com/guide/introduction) - Guides for using Vue Stripe
- [API Reference](https://vuestripe.com/api/) - API reference for Vue Stripe components and composables
- [Playground](https://playground.vuestripe.com) - Interactive playground for testing Vue Stripe components and integrations
- [Backend](https://backend.vuestripe.com) - Backend for the playground

## Monorepo Structure

This repository is organized as a monorepo using pnpm workspaces and Turborepo:

```
vue-stripe/
├── packages/
│   ├── vue-stripe/        # Main library (@vue-stripe/vue-stripe)
│   └── vue2-smoke/        # Runs the built library under Vue 2.7 in CI
├── apps/
│   ├── docs/              # VitePress documentation site
│   ├── playground/        # Development playground
│   └── backend/           # Backend for the playground
└── tools/
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

- Node.js 22+ (24 recommended, see `.nvmrc`)
- pnpm 12+ (`corepack enable`)

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

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)]

<a href="https://github.com/vue-stripe/vue-stripe/graphs/contributors"><img src="https://contrib.rocks/image?repo=vue-stripe/vue-stripe" alt="Vue Stripe contributors" /></a>

## Sponsors

If Vue Stripe saves you time, you can support its maintenance through [GitHub Sponsors](https://github.com/sponsors/jofftiquez).

## License

[MIT](LICENSE) License. Copyright 2017-2026 Vue Stripe Contributors.

---

Made with love by [Joff Tiquez](https://twitter.com/jrtiquez)
