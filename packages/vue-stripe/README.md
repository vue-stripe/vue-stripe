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

## Requirements

| Package | Version |
|---------|---------|
| `vue` | `^2.7.0 \|\| ^3.0.0` (Vue 2.6 is not supported) |
| `@stripe/stripe-js` | `^10.0.0` (Stripe.js Endive) |

Upgrading from v5? Read [Migrating from v5 to v6](https://vuestripe.com/guide/migration-v6).

## Installation

```bash
npm install @vue-stripe/vue-stripe@^6 @stripe/stripe-js@^10
```

Import the component styles once, for example in `main.ts`:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

## Basic Usage

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

## Components

### Providers

| Component | Description |
|-----------|-------------|
| `VueStripeProvider` | Loads Stripe.js and provides the Stripe instance |
| `VueStripeElements` | Creates an Elements group (client secret or mode/currency/amount) |
| `VueStripeCheckoutElementsProvider` | Elements with Checkout Sessions (`ui_mode: 'elements'`); `VueStripeCheckoutProvider` is a deprecated alias |
| `VueStripeCheckoutFormProvider` | Checkout Form SDK for a Checkout Session with `ui_mode: 'form'` (Stripe beta) |

Or install the `createVueStripe()` plugin to provide Stripe to the whole app without a `VueStripeProvider`.

### Elements

| Component | Description |
|-----------|-------------|
| `VueStripePaymentElement` | Every payment method in one UI (recommended) |
| `VueStripeExpressCheckoutElement` | Apple Pay, Google Pay, Link and other wallets |
| `VueStripeLinkAuthenticationElement` | Email collection and Link sign-in |
| `VueStripeAddressElement` | Billing or shipping address with autocomplete |
| `VueStripePaymentMethodMessagingElement` | Buy now, pay later messaging |
| `VueStripeCardElement` | Single card input |
| `VueStripeCardNumberElement`, `VueStripeCardExpiryElement`, `VueStripeCardCvcElement` | Split card inputs |
| `VueStripeIbanElement` | IBAN for SEPA Direct Debit |
| `VueStripeAuBankAccountElement` | BECS Direct Debit (Australia) |
| `VueStripeTaxIdElement` | Business tax ID (Checkout Sessions, Stripe beta) |
| `VueStripeCurrencySelectorElement` | Local currency selection (Checkout Sessions, Adaptive Pricing) |
| `VueStripeContactDetailsElement` | Customer email (Checkout Sessions or Elements) |
| `VueStripeTermsElement` | Terms the customer accepts (Stripe beta) |
| `VueStripeLinkSignupElement` | Save details to Link (Stripe beta) |
| `VueStripeIssuingCardNumberDisplayElement`, `VueStripeIssuingCardCvcDisplayElement`, `VueStripeIssuingCardExpiryDisplayElement`, `VueStripeIssuingCardPinDisplayElement` | Stripe Issuing card details in Stripe-hosted iframes |
| `VueStripeIssuingCardCopyButtonElement`, `VueStripeIssuingAddToWalletButtonElement` | Copy an issued card detail; add an issued card to a wallet (Stripe private preview) |

Stripe removed the standalone iDEAL, P24, EPS and FPX elements; the Payment Element collects these payment methods.

### Checkout

| Component | Description |
|-----------|-------------|
| `VueStripeCheckout` | Button that redirects to a hosted Checkout Session URL |
| `VueStripeEmbeddedCheckout` | Stripe's Checkout page embedded in your page (`ui_mode: 'embedded_page'`) |
| `VueStripeCheckoutForm` | Stripe's complete checkout form as one element, inside `VueStripeCheckoutFormProvider` (Stripe beta) |
| `VueStripePricingTable` | Embeds a pricing table configured in the Stripe Dashboard |

### Disclosures

| Component | Description |
|-----------|-------------|
| `VueStripeFinancialAccountDisclosure`, `VueStripeIssuingDisclosure`, `VueStripeTreasuryDisclosure` | Legal text rendered by Stripe.js (React Stripe.js 7 parity) |

## Composables

| Composable | Description |
|------------|-------------|
| `useStripe()` | The Stripe instance |
| `useStripeElements()` | The Elements group, `submit()`, `fetchUpdates()` and `getElement()` |
| `usePaymentIntent()` | Confirm and retrieve PaymentIntents |
| `useSetupIntent()` | Confirm and retrieve SetupIntents |
| `useConfirmCardPayment()`, `useConfirmSepaDebitSetup()`, ... | One composable per Stripe.js `confirm<Method>Payment` / `confirm<Method>Setup` method (46 in Stripe.js 10) |
| `useCreatePaymentMethod()` | Create a PaymentMethod from Elements |
| `useCreateConfirmationToken()` | Create a ConfirmationToken to confirm on your server |
| `useCreateToken()` | Create a Token (card, bank account, PII, Connect account / person) |
| `useHandleNextAction()` | Finish 3D Secure and other next actions |
| `useHandleCardAction()` | 3D Secure for manually confirmed PaymentIntents (legacy) |
| `useVerifyMicrodepositsForPayment()`, `useVerifyMicrodepositsForSetup()` | Verify a bank account with micro-deposits |
| `useRadarSession()` | Create a Radar Session for fraud signals |
| `useEphemeralKeyNonce()` | Create the nonce for the Issuing Elements |
| `useFinancialConnections()` | Financial Connections and ACH bank account collection |
| `useIdentity()` | Stripe Identity verification modal |
| `usePaymentRequest()` | Payment Request API behind your own button (prefer the Express Checkout Element for new integrations) |
| `useCheckoutSession()` | Session state and actions inside `VueStripeCheckoutElementsProvider` |
| `useCheckoutForm()` | Confirm the Checkout Form and drive its session inside `VueStripeCheckoutFormProvider` (Stripe beta) |
| `useStripeCheckout()` | Redirect to a hosted Checkout Session URL |

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

- [Website](https://vuestripe.com) - Official website for Vue Stripe
- [Guides](https://vuestripe.com/guide/introduction) - Guides for using Vue Stripe
- [API Reference](https://vuestripe.com/api/) - API reference for Vue Stripe components and composables
- [Playground](https://playground.vuestripe.com) - Interactive playground for testing Vue Stripe components and integrations
- [Backend](https://backend.vuestripe.com) - Backend for the playground

## License

[MIT](LICENSE) License. Copyright 2017-2026 Vue Stripe Contributors.
