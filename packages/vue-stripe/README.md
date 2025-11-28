# Vue Stripe

[![npm version](https://badge.fury.io/js/%40vue-stripe%2Fvue-stripe.svg)](https://www.npmjs.com/package/@vue-stripe/vue-stripe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Vue Stripe** is a universal Vue.js library for Stripe Checkout and Elements. It supports both Vue 2.6+ and Vue 3.x with TypeScript-first development and modern Composition API.

## ✨ Features

- 🔥 **Universal Vue Support** - Works with Vue 2.6+ and Vue 3.x
- 📦 **TypeScript First** - Full TypeScript support with comprehensive types
- 🎨 **Modern Elements** - Payment Element supporting 40+ payment methods
- ⚡ **Composition API** - Vue 3 Composition API with Vue 2 compatibility
- 🔧 **Customizable** - Full support for Stripe's Appearance API
- 🧪 **Well Tested** - Comprehensive test suite
- 📱 **SSR Ready** - Support for Nuxt 2/3 and server-side rendering

## 🚀 Quick Start

### Installation

```bash
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

### Basic Usage

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements>
      <StripePaymentElement @ready="onReady" />
      <button @click="processPayment">Pay Now</button>
    </StripeElements>
  </StripeProvider>
</template>

<script setup lang="ts">
import { 
  StripeProvider, 
  StripeElements, 
  StripePaymentElement,
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

## 📚 Documentation

- [Installation Guide](https://vue-stripe.github.io/vue-stripe/guide/installation)
- [Quick Start](https://vue-stripe.github.io/vue-stripe/guide/quick-start)
- [API Reference](https://vue-stripe.github.io/vue-stripe/api/)
- [Examples](https://vue-stripe.github.io/vue-stripe/examples/)

## 🎯 Components

### Provider Components
- `StripeProvider` - Stripe instance provider
- `StripeElements` - Elements context provider

### Payment Components
- `StripePaymentElement` - Modern payment element (40+ methods)
- `StripeExpressCheckoutElement` - Wallet payments (Apple Pay, Google Pay, etc.)
- `StripeLinkAuthElement` - Link authentication
- `StripeAddressElement` - Address collection
- `StripeCheckout` - Redirect to Stripe Checkout

### Legacy Components
- `StripeCardElement` - Single card field
- `StripeCardNumberElement` - Card number only
- `StripeCardExpiryElement` - Expiry only
- `StripeCardCvcElement` - CVC only

## 🪝 Composables

- `useStripe()` - Core Stripe instance management
- `useStripeElements()` - Elements management
- `usePaymentIntent()` - Payment processing
- `useSetupIntent()` - Setup intent handling
- `useStripeCheckout()` - Checkout session management

## 🔧 Vue 2 Support

Vue Stripe automatically handles Vue 2 compatibility through `vue-demi`. For Vue 2 projects, install the Composition API plugin:

```bash
npm install @vue/composition-api
```

## 📦 TypeScript

Vue Stripe is built with TypeScript and provides comprehensive type definitions:

```typescript
import type { 
  StripeElementChangeEvent,
  PaymentIntent,
  SetupIntent 
} from '@vue-stripe/vue-stripe'
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

[MIT](LICENSE) License © 2024 Vue Stripe Contributors

## 🙏 Credits

- Built with [vue-demi](https://github.com/vueuse/vue-demi) for universal Vue support
- Powered by [Stripe.js](https://stripe.com/docs/js) official library
- Inspired by the Vue.js community

---

**Stripe Partner** - Vue Stripe is an official Stripe partner library.