# @vue-stripe/vue-stripe

[![npm version](https://img.shields.io/npm/v/@vue-stripe/vue-stripe.svg?style=flat-square)](https://www.npmjs.com/package/@vue-stripe/vue-stripe)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@vue-stripe/vue-stripe?style=flat-square)](https://bundlephobia.com/package/@vue-stripe/vue-stripe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Universal Vue.js library for Stripe Checkout and Elements. Supports both Vue 2.6+ and Vue 3.x with TypeScript-first development and modern Composition API.

> This package is part of the [Vue Stripe monorepo](../../README.md). For contributing guidelines and development setup, see the root README.

## Installation

```bash
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

For Vue 2 projects, also install the Composition API plugin:

```bash
npm install @vue/composition-api
```

## Basic Usage

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

## Components

### Provider Components

| Component | Description |
|-----------|-------------|
| `StripeProvider` | Root component that loads Stripe.js and provides context |
| `StripeElements` | Creates Elements instance and provides it to child components |

### Payment Components

| Component | Description |
|-----------|-------------|
| `StripePaymentElement` | Modern payment element supporting 40+ payment methods |
| `StripeExpressCheckoutElement` | Wallet payments (Apple Pay, Google Pay, etc.) |
| `StripeLinkAuthenticationElement` | Link authentication |
| `StripeAddressElement` | Address collection with Google Maps autocomplete |
| `StripeCheckout` | Embedded Stripe Checkout |

### StripeAddressElement

Collect shipping or billing addresses with built-in Google Maps autocomplete:

```vue
<template>
  <StripeAddressElement
    ref="addressRef"
    :options="{ mode: 'shipping' }"
    @change="onAddressChange"
  />
  <button @click="validateAddress">Validate</button>
</template>

<script setup>
import { ref } from 'vue'

const addressRef = ref()

// Use getValue() to programmatically get address data
const validateAddress = async () => {
  const result = await addressRef.value?.getValue()
  if (result.complete) {
    console.log('Valid address:', result.value)
  }
}
</script>
```

### StripeLinkAuthenticationElement

Enable Stripe Link for faster checkout by collecting and authenticating customer email.

> **Pairing Note:** This element collects email only and **must be paired with `StripePaymentElement`** for a complete checkout flow. It cannot process payments on its own.

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <!-- Step 1: Email + Link authentication -->
      <StripeLinkAuthenticationElement @change="onEmailChange" />

      <!-- Step 2: Payment methods (auto-fills if Link authenticated) -->
      <StripePaymentElement @change="onPaymentChange" />

      <button :disabled="!canPay">Pay Now</button>
    </StripeElements>
  </StripeProvider>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const emailComplete = ref(false)
const paymentComplete = ref(false)
const canPay = computed(() => emailComplete.value && paymentComplete.value)

const onEmailChange = (event) => {
  emailComplete.value = event.complete
  if (event.complete) {
    console.log('Email:', event.value.email)
  }
}

const onPaymentChange = (event) => {
  paymentComplete.value = event.complete
}
</script>
```

### Legacy Card Components

| Component | Description |
|-----------|-------------|
| `StripeCardElement` | Single card input field |
| `StripeCardNumberElement` | Card number only |
| `StripeCardExpiryElement` | Expiry date only |
| `StripeCardCvcElement` | CVC only |

## Composables

| Composable | Description |
|------------|-------------|
| `useStripe()` | Access Stripe instance |
| `useStripeElements()` | Access Elements instance |
| `usePaymentIntent()` | Payment confirmation helpers |
| `useSetupIntent()` | Setup intent handling |
| `useStripeCheckout()` | Checkout session management |

## TypeScript

Full TypeScript support with re-exported Stripe.js types:

```typescript
import type {
  StripeElementChangeEvent,
  PaymentIntent,
  SetupIntent
} from '@vue-stripe/vue-stripe'
```

## Documentation

- [Installation Guide](https://vue-stripe.github.io/vue-stripe/guide/installation)
- [Quick Start](https://vue-stripe.github.io/vue-stripe/guide/quick-start)
- [API Reference](https://vue-stripe.github.io/vue-stripe/api/)
- [Examples](https://vue-stripe.github.io/vue-stripe/examples/)

## License

[MIT](LICENSE) License © 2024 Vue Stripe Contributors
