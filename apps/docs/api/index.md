# API Reference

Complete API documentation for Vue Stripe components and composables.

## Components

### Provider Components
- [StripeProvider](/api/components/stripe-provider) - Root component that loads Stripe.js
- [StripeElements](/api/components/stripe-elements) - Creates Stripe Elements instance

### Element Components
- [StripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI
- [StripeCardElement](/api/components/stripe-card-element) - Single card input
- [StripeCardNumberElement](/api/components/stripe-card-number-element) - Card number input
- [StripeCardExpiryElement](/api/components/stripe-card-expiry-element) - Card expiry input
- [StripeCardCvcElement](/api/components/stripe-card-cvc-element) - Card CVC input
- [StripeExpressCheckoutElement](/api/components/stripe-express-checkout-element) - Apple Pay, Google Pay, Link
- [StripeAddressElement](/api/components/stripe-address-element) - Address collection
- [StripeLinkAuthenticationElement](/api/components/stripe-link-auth-element) - Link authentication

## Composables

- [useStripe](/api/composables/use-stripe) - Access Stripe instance
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements instance
- [usePaymentIntent](/api/composables/use-payment-intent) - Payment confirmation helpers
- [useSetupIntent](/api/composables/use-setup-intent) - SetupIntent confirmation helpers
- [useStripeCheckout](/api/composables/use-stripe-checkout) - Redirect to Stripe Checkout

## Plugin

- [VueStripePlugin](/api/plugin) - Global plugin registration

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

See [Types Reference](/api/types) for the full list.
