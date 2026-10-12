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
- [VueStripePaymentMethodMessagingElement](/api/components/stripe-payment-method-messaging-element) - Buy Now, Pay Later messaging
- [VueStripeTaxIdElement](/api/components/stripe-tax-id-element) - Business name and tax ID (Checkout Sessions, beta)
- [VueStripeCurrencySelectorElement](/api/components/stripe-currency-selector-element) - Currency picker (Checkout Sessions, Adaptive Pricing)
- [VueStripeContactDetailsElement](/api/components/stripe-contact-details-element) - Customer email (Checkout Sessions or Elements)
- [VueStripeTermsElement](/api/components/stripe-terms-element) - Terms the customer accepts (Stripe beta)
- [VueStripeLinkSignupElement](/api/components/stripe-link-signup-element) - Save details to Link (Stripe beta)

### Regional Payment Elements
- [VueStripeIbanElement](/api/components/stripe-iban-element) - IBAN collection for SEPA payments
- [VueStripeAuBankAccountElement](/api/components/stripe-au-bank-account-element) - BECS Direct Debit (Australia)

Stripe removed the standalone iDEAL, P24, EPS and FPX elements in Stripe.js Clover (8.0); collect these payment methods with the [Payment Element](/api/components/stripe-payment-element).

### Checkout
- [VueStripeCheckout](/api/components/stripe-checkout) - Redirect to hosted Stripe Checkout (session URL)
- [VueStripeEmbeddedCheckout](/api/components/stripe-embedded-checkout) - Stripe's Checkout page embedded in your page (`stripe.createEmbeddedCheckoutPage()`). Walkthrough: [Embedded Checkout guide](/guide/embedded-checkout)
- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - Elements with Checkout Sessions (`VueStripeCheckoutProvider` is a deprecated alias). Walkthrough: [Custom Checkout guide](/guide/custom-checkout)
- [VueStripePricingTable](/api/components/stripe-pricing-table) - Embedded Stripe pricing table

### Disclosures
Legal text rendered by Stripe.js (React Stripe.js 7 parity):
- [VueStripeFinancialAccountDisclosure](/api/components/stripe-financial-account-disclosure) - Financial Accounts for platforms
- [VueStripeIssuingDisclosure](/api/components/stripe-issuing-disclosure) - Issuing card programs
- [VueStripeTreasuryDisclosure](/api/components/stripe-treasury-disclosure) - Treasury financial accounts

## Composables

- [useStripe](/api/composables/use-stripe) - Access Stripe instance
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements instance
- [usePaymentIntent](/api/composables/use-payment-intent) - Payment confirmation helpers
- [useSetupIntent](/api/composables/use-setup-intent) - SetupIntent confirmation helpers
- [useCreatePaymentMethod](/api/composables/use-create-payment-method) - Create a PaymentMethod
- [useHandleNextAction](/api/composables/use-handle-next-action) - Complete a required next action (3DS, ...)
- [useStripeCheckout](/api/composables/use-stripe-checkout) - Redirect to Stripe Checkout (alias: `useCheckout`)
- [useCheckoutSession](/api/composables/use-checkout-session) - Drive a Checkout Session inside `VueStripeCheckoutElementsProvider`

## Plugin

- [createVueStripe](/api/plugin) - Vue plugin that provides Stripe app-wide (an alternative to `VueStripeProvider`)

## Types

All TypeScript types are exported from the main package:

```ts
import type {
  // Configuration and component props
  VueStripeOptions,
  VueStripeProviderProps,
  VueStripeElementsProps,
  VueStripeCheckoutElementsProviderProps,
  VueStripeCheckoutProviderProps, // deprecated alias name
  VueStripePricingTableProps,
  VueStripeEmbeddedCheckoutProps,

  // Composable return values and options
  UseStripeReturn,
  UseStripeElementsReturn,
  UsePaymentIntentReturn,
  UseSetupIntentReturn,
  UseCreatePaymentMethodReturn,
  UseHandleNextActionReturn,
  UseCheckoutSessionReturn,
  UseStripeCheckoutReturn,
  ConfirmPaymentOptions,
  ConfirmSetupOptions,
  CreatePaymentMethodOptions,
  HandleNextActionOptions,
  CheckoutRedirectOptions,

  // Composable results
  ElementsSubmitResult,
  VueStripeErrorResult,
  ConfirmPaymentResult,
  ConfirmSetupResult,
  CreatePaymentMethodResult,
  HandleNextActionResult,

  // Element components (template refs, InstanceType)
  StripeElementComponent,
  StripeElementExposed,
  BaseElementEvents,

  // Re-exported Stripe.js element types
  StripeTaxIdElement,
  StripeTaxIdElementOptions,
  StripeTaxIdElementChangeEvent,
  StripeCurrencySelectorElement,
  StripeContactDetailsElement,
  StripeContactDetailsElementOptions,
  StripeContactDetailsElementChangeEvent,
  StripeTermsElement,
  StripeTermsElementOptions,
  StripeLinkSignupElement,
  StripeLinkSignupElementOptions,

  // Disclosure components
  StripeDisclosureComponent,
  DisclosureStripeProp,
  DisclosureError,
  FinancialAccountDisclosureOptions,
  IssuingDisclosureOptions,
  TreasuryDisclosureOptions,

  // Re-exported Stripe.js Checkout Elements SDK types
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutLoadActionsResult,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult,

  // Re-exported Stripe.js Embedded Checkout types
  StripeEmbeddedCheckout,
  StripeEmbeddedCheckoutOptions,
  StripeEmbeddedCheckoutAnalyticsEventUnion,
  StripeEmbeddedCheckoutLineItemsChangeEvent
} from '@vue-stripe/vue-stripe'
```

The package also re-exports the common Stripe.js types under their original names (`Stripe`, `StripeElements`, `StripeCardElement`, `StripePaymentElement`, `StripeAddressElement`, `StripeExpressCheckoutElement`, change and confirm event types, ...). See `src/index.ts` for the full list.

### Error classes

```ts
import {
  VueStripeProviderError,
  VueStripeElementsError,
  VueStripeCheckoutError
} from '@vue-stripe/vue-stripe'
```

### Removed in v6

| Removed export | Replacement |
|----------------|-------------|
| `StripeCheckout` (type) | `StripeCheckoutElementsSdk` |
| `LegacyCheckoutOptions` | `CheckoutRedirectOptions` (`{ url }`); create the Checkout Session on your server |
| `VueStripeLoadError`, `createVueStripeError` | The typed error classes above (`VueStripeProviderError`, `VueStripeElementsError`, `VueStripeCheckoutError`) |
