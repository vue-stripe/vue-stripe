# API Reference

Complete API documentation for Vue Stripe components and composables.

## Components

### Provider Components
- [StripeProvider](/api/components/stripe-provider) - Root component that loads Stripe.js
- [StripeElements](/api/components/stripe-elements) - Creates Stripe Elements instance

### Element Components
- [StripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI (recommended)
- [StripeExpressCheckoutElement](/api/components/stripe-express-checkout-element) - Apple Pay, Google Pay, Link
- [StripeCardElement](/api/components/stripe-card-element) - Single card input
- [Split Card Elements](/api/components/stripe-split-card-elements) - Number + Expiry + CVC
- [StripeAddressElement](/api/components/stripe-address-element) - Address collection
- [StripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element) - Link authentication

### Checkout
- [StripeCheckout](/api/components/stripe-checkout) - Embedded Stripe Checkout

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
