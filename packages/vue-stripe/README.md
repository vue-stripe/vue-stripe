<p align="center">
  <img src="https://raw.githubusercontent.com/vue-stripe/vue-stripe/main/.github/assets/vue-stripe-logo-variant-1.png" alt="Vue Stripe Logo" width="250"/>
  <h1 align="center">
    Vue Stripe
    <div style="height: 10px;"></div>
    <a href="https://stripe.com/partners/vue-stripe" target="_blank"><img src="https://raw.githubusercontent.com/vue-stripe/vue-stripe/main/.github/assets/stripe_partner_badge_verified_blurple.png" alt="Stripe Partner" height="30"/></a>
  </h1>
</p>

<p align="center">
  <a href="https://stripe.com/partners/vue-stripe" target="_blank"><img src="https://raw.githubusercontent.com/vue-stripe/vue-stripe/main/.github/assets/stripe_partner_badge_verified_blurple.png" alt="Stripe Partner" width="98"/></a>
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
  <a href="https://vuestripe.com/guide/introduction">Guides</a> |
  <a href="https://vuestripe.com/api/">API</a>
</p>

---

> [Vue Stripe](https://vuestripe.com) is an official [Stripe partner](https://stripe.com/partners/vue-stripe)

## Announcement

Thank you for your patience! This is an early release of the new Vue Stripe. As with any early release, you may encounter bugs. If you find any issues or have suggestions, please [create an issue](https://github.com/vue-stripe/vue-stripe/issues) or [submit a pull request](https://github.com/vue-stripe/vue-stripe/pulls). Your contributions are greatly appreciated!

## Installation

```bash
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

## Basic Usage

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

## Components

### Provider Components

| Component | Description |
|-----------|-------------|
| `VueStripeProvider` | Root component that loads Stripe.js and provides context |
| `VueStripeElements` | Creates an Elements instance and provides it to child components |

### Payment Components

| Component | Description |
|-----------|-------------|
| `VueStripePaymentElement` | Modern payment element supporting 40+ payment methods |
| `VueStripeExpressCheckoutElement` | Wallet payments (Apple Pay, Google Pay, etc.) |
| `VueStripeLinkAuthenticationElement` | Link authentication element |
| `VueStripeAddressElement` | Address collection with Google Maps autocomplete |
| `VueStripeCheckout` | Embedded Stripe Checkout |

### VueStripeAddressElement

Collect shipping or billing addresses with Google Maps autocomplete:

```vue
<template>
  <VueStripeAddressElement
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

### VueStripeLinkAuthenticationElement

Enable Stripe Link for faster checkout by collecting and authenticating the customer's email.

> **Note:** This element collects email only and **must be paired with `VueStripePaymentElement`** for a complete checkout flow. It cannot process payments on its own.

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <!-- Step 1: Email + Link authentication -->
      <VueStripeLinkAuthenticationElement @change="onEmailChange" />

      <!-- Step 2: Payment methods (auto-fills if Link authenticated) -->
      <VueStripePaymentElement @change="onPaymentChange" />

      <button :disabled="!canPay">Pay Now</button>
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeLinkAuthenticationElement,
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
| `VueStripeCardElement` | Single card input field |
| `VueStripeCardNumberElement` | Card number input |
| `VueStripeCardExpiryElement` | Expiry date input |
| `VueStripeCardCvcElement` | CVC input |

### European Regional Elements

| Component | Description |
|-----------|-------------|
| `VueStripeIbanElement` | IBAN input for SEPA payments |
| `VueStripeIdealBankElement` | iDEAL bank selector (Netherlands) |
| `VueStripeP24BankElement` | Przelewy24 bank selector (Poland) |
| `VueStripeEpsBankElement` | EPS bank selector (Austria) |

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

- [Website](https://vuestripe.com)
- [Guides](https://vuestripe.com/guide/introduction)
- [API Reference](https://vuestripe.com/api/)
- [Backend Data Generator](https://backend.vuestripe.com) - Generate test client secrets and payment intents

## License

[MIT](LICENSE) License © 2017-2025 Vue Stripe Contributors
