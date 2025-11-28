# API Reference

Complete API documentation for Vue Stripe components and composables.

::: tip Work in Progress
This documentation is being updated as components are tested and finalized. Components marked with 🔄 are currently being tested.
:::

## Components

### Provider Components
- [StripeProvider](/api/components/stripe-provider) - Root component that loads Stripe.js ✅
- [StripeElements](/api/components/stripe-elements) - Creates Stripe Elements instance ✅

### Element Components
- [StripeCardElement](/api/components/stripe-card-element) - Single card input 🔄

#### Coming Soon
- StripePaymentElement - All-in-one payment UI
- StripeCardNumberElement - Card number input (split)
- StripeCardExpiryElement - Card expiry input (split)
- StripeCardCvcElement - Card CVC input (split)
- StripeExpressCheckoutElement - Apple Pay, Google Pay, Link
- StripeAddressElement - Address collection
- StripeLinkAuthenticationElement - Link authentication
- StripeCheckout - Redirect to Stripe Checkout

## Composables

- [useStripe](/api/composables/use-stripe) - Access Stripe instance ✅
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements instance ✅

#### Coming Soon
- usePaymentIntent - Payment confirmation helpers
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
