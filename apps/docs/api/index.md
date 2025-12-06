# API Reference

Complete API documentation for Vue Stripe components and composables.

## Components

### Provider Components
- [VueStripeProvider](/api/components/stripe-provider) - Root component that loads Stripe.js
- [VueStripeElements](/api/components/stripe-elements) - Creates Stripe Elements instance

### Element Components
- [VueStripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI (recommended)
- [VueStripeExpressCheckoutElement](/api/components/stripe-express-checkout-element) - Apple Pay, Google Pay, Link
- [VueStripeCardElement](/api/components/stripe-card-element) - Single card input
- [Split Card Elements](/api/components/stripe-split-card-elements) - Number + Expiry + CVC
- [VueStripeAddressElement](/api/components/stripe-address-element) - Address collection
- [VueStripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element) - Link authentication

### European Payment Elements
- [VueStripeIbanElement](/api/components/stripe-iban-element) - IBAN collection for SEPA payments
- [VueStripeIdealBankElement](/api/components/stripe-ideal-bank-element) - iDEAL bank selector (Netherlands)
- [VueStripeP24BankElement](/api/components/stripe-p24-bank-element) - Przelewy24 bank selector (Poland)
- [VueStripeEpsBankElement](/api/components/stripe-eps-bank-element) - EPS bank selector (Austria)

### Checkout
- [VueStripeCheckout](/api/components/stripe-checkout) - Embedded Stripe Checkout

## Composables

- [useStripe](/api/composables/use-stripe) - Access Stripe instance
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements instance
- [usePaymentIntent](/api/composables/use-payment-intent) - Payment confirmation helpers
- [useSetupIntent](/api/composables/use-setup-intent) - SetupIntent confirmation helpers
- [useStripeCheckout](/api/composables/use-stripe-checkout) - Redirect to Stripe Checkout

## Plugin

- [createVueStripe](/api/plugin) - Vue plugin for global Stripe configuration

## Types

All TypeScript types are exported from the main package:

```ts
import type {
  StripeProviderProps,
  StripeElementsProps,
  UseStripeReturn,
  UseStripeElementsReturn,
  UsePaymentIntentReturn,
  UseSetupIntentReturn,
  VueStripeOptions
} from '@vue-stripe/vue-stripe'
```
