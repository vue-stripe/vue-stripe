# API Reference

Complete API documentation for Vue Stripe components and composables.

::: tip Work in Progress
This documentation is being updated as components are tested and finalized. Components marked with ✅ are complete.
:::

## Components

### Provider Components
- [StripeProvider](/api/components/stripe-provider) - Root component that loads Stripe.js ✅
- [StripeElements](/api/components/stripe-elements) - Creates Stripe Elements instance ✅

### Element Components
- [StripeCardElement](/api/components/stripe-card-element) - Single card input ✅
- [Split Card Elements](/api/components/stripe-split-card-elements) - Number + Expiry + CVC ✅
- [StripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI ✅

#### Coming Soon
- StripeExpressCheckoutElement - Apple Pay, Google Pay, Link
- StripeAddressElement - Address collection
- StripeLinkAuthenticationElement - Link authentication
- StripeCheckout - Redirect to Stripe Checkout

## Composables

- [useStripe](/api/composables/use-stripe) - Access Stripe instance ✅
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements instance ✅
- [usePaymentIntent](/api/composables/use-payment-intent) - Payment confirmation helpers ✅

#### Coming Soon
- useSetupIntent - SetupIntent confirmation helpers
- useStripeCheckout - Redirect to Stripe Checkout

## Types

All TypeScript types are exported from the main package:

```ts
import type {
  StripeProviderProps,
  StripeElementsProps,
  UseStripeReturn,
  UseStripeElementsReturn
} from '@vue-stripe/vue-stripe'
```
