# API reference

Every export of `@vue-stripe/vue-stripe`: components, composables, the plugin and types. To find the export that wraps a Stripe.js method or element, use [Stripe.js coverage](/coverage).

## Compatibility

| Requirement | Supported |
|-------------|-----------|
| Vue | `^2.7.0 \|\| ^3.0.0` (peer dependency) |
| Stripe.js | `@stripe/stripe-js` `^10.0.0`, Stripe.js Endive (peer dependency) |
| Rendering | Client only. Stripe.js runs in the browser; render Vue Stripe components on the client in SSR apps. |
| Module formats | ES, CommonJS and UMD builds; TypeScript declarations included |
| Stylesheet | `@vue-stripe/vue-stripe/style.css`, imported once per app |

## Components

### Provider components

| Component | Description |
|-----------|-------------|
| [VueStripeProvider](/api/components/stripe-provider) | Loads Stripe.js and provides the `Stripe` instance |
| [VueStripeElements](/api/components/stripe-elements) | Creates a `StripeElements` instance and provides it to element components |

### Element components

| Component | Description |
|-----------|-------------|
| [VueStripePaymentElement](/api/components/stripe-payment-element) | Payment Element: cards, wallets, bank debits and local payment methods |
| [VueStripeExpressCheckoutElement](/api/components/stripe-express-checkout-element) | Express Checkout Element: Apple Pay, Google Pay, Link and other wallet buttons |
| [VueStripeCardElement](/api/components/stripe-card-element) | Card Element: number, expiry and CVC in one field |
| [Split Card Elements](/api/components/stripe-split-card-elements) | `VueStripeCardNumberElement`, `VueStripeCardExpiryElement`, `VueStripeCardCvcElement` |
| [VueStripeAddressElement](/api/components/stripe-address-element) | Address Element: shipping or billing address |
| [VueStripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element) | Link Authentication Element: email and Link sign-in |
| [VueStripePaymentMethodMessagingElement](/api/components/stripe-payment-method-messaging-element) | Payment Method Messaging Element: buy-now-pay-later messaging |
| [VueStripeTaxIdElement](/api/components/stripe-tax-id-element) | Tax ID Element: business name and tax ID (Checkout Sessions, beta) |
| [VueStripeCurrencySelectorElement](/api/components/stripe-currency-selector-element) | Currency Selector Element (Checkout Sessions, Adaptive Pricing) |
| [VueStripeContactDetailsElement](/api/components/stripe-contact-details-element) | Contact Details Element: customer email (Checkout Sessions or Elements) |
| [VueStripeTermsElement](/api/components/stripe-terms-element) | Terms Element: terms the customer accepts (Stripe beta) |
| [VueStripeLinkSignupElement](/api/components/stripe-link-signup-element) | Link Signup Element: save details to Link (Stripe beta) |

### Regional elements

| Component | Description |
|-----------|-------------|
| [VueStripeIbanElement](/api/components/stripe-iban-element) | IBAN Element: SEPA Direct Debit |
| [VueStripeAuBankAccountElement](/api/components/stripe-au-bank-account-element) | AU Bank Account Element: BECS Direct Debit (Australia) |

Stripe.js Clover (8.0) removed the standalone iDEAL, P24, EPS and FPX elements. The Payment Element collects these payment methods.

### Issuing elements

| Component | Description |
|-----------|-------------|
| [Issuing Elements](/api/components/stripe-issuing-elements) | `VueStripeIssuingCardNumberDisplayElement`, `...CvcDisplayElement`, `...ExpiryDisplayElement`, `...PinDisplayElement`, `...CopyButtonElement`, `...AddToWalletButtonElement`: issued card details in Stripe-hosted iframes |

### Checkout and subscriptions

| Component | Description |
|-----------|-------------|
| [VueStripeCheckout](/api/components/stripe-checkout) | Redirects to Stripe Checkout (Checkout Session URL) |
| [VueStripeEmbeddedCheckout](/api/components/stripe-embedded-checkout) | Embedded Checkout (`stripe.createEmbeddedCheckoutPage()`) |
| [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) | Checkout Elements SDK: Elements on a Checkout Session. `VueStripeCheckoutProvider` is a deprecated alias. |
| [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider) | Checkout Form SDK, `ui_mode: 'form'` (beta, requires Stripe access) |
| [VueStripeCheckoutForm](/api/components/stripe-checkout-form) | Checkout Form: Stripe's complete checkout form in one element (beta, requires Stripe access) |
| [VueStripePricingTable](/api/components/stripe-pricing-table) | Embedded Stripe pricing table |

### Disclosures

| Component | Description |
|-----------|-------------|
| [VueStripeFinancialAccountDisclosure](/api/components/stripe-financial-account-disclosure) | Legal text for Financial Accounts for platforms |
| [VueStripeIssuingDisclosure](/api/components/stripe-issuing-disclosure) | Legal text for Issuing card programs |
| [VueStripeTreasuryDisclosure](/api/components/stripe-treasury-disclosure) | Legal text for Treasury financial accounts |

## Composables

| Composable | Description |
|------------|-------------|
| [useStripe](/api/composables/use-stripe) | The `Stripe` instance and its loading and error state |
| [useStripeElements](/api/composables/use-stripe-elements) | The `StripeElements` instance, `getElement`, `submit` and `fetchUpdates` |
| [usePaymentIntent](/api/composables/use-payment-intent) | `stripe.confirmPayment()` with the Elements group; runs `elements.submit()` first |
| [useSetupIntent](/api/composables/use-setup-intent) | `stripe.confirmSetup()` with the Elements group; runs `elements.submit()` first |
| [useStripeCheckout](/api/composables/use-stripe-checkout) | Redirects to Stripe Checkout (alias: `useCheckout`) |
| [useCheckoutSession](/api/composables/use-checkout-session) | Checkout Session state and actions inside `VueStripeCheckoutElementsProvider` |
| [useCheckoutForm](/api/composables/use-checkout-form) | Checkout Form state, session and confirm inside `VueStripeCheckoutFormProvider` (beta) |
| [useCreatePaymentMethod](/api/composables/use-create-payment-method) | `stripe.createPaymentMethod()` |
| [useHandleNextAction](/api/composables/use-handle-next-action) | `stripe.handleNextAction()`: 3D Secure and other next actions |
| [useCreateConfirmationToken](/api/composables/use-create-confirmation-token) | `stripe.createConfirmationToken()` from the Payment Element |
| [useCreateToken](/api/composables/use-create-token) | `stripe.createToken()`: card, bank account, PII, Connect account or person |
| [useHandleCardAction](/api/composables/use-handle-card-action) | `stripe.handleCardAction()` for manually confirmed PaymentIntents (legacy) |
| [useVerifyMicrodepositsForPayment](/api/composables/use-verify-microdeposits-for-payment) | `stripe.verifyMicrodepositsForPayment()` |
| [useVerifyMicrodepositsForSetup](/api/composables/use-verify-microdeposits-for-setup) | `stripe.verifyMicrodepositsForSetup()` |
| [useRadarSession](/api/composables/use-radar-session) | `stripe.createRadarSession()` |
| [useEphemeralKeyNonce](/api/composables/use-ephemeral-key-nonce) | `stripe.createEphemeralKeyNonce()` for Issuing elements |
| [useFinancialConnections](/api/composables/use-financial-connections) | Financial Connections and US bank account collection |
| [useIdentity](/api/composables/use-identity) | `stripe.verifyIdentity()`: the Stripe Identity modal |
| [usePaymentRequest](/api/composables/use-payment-request) | `stripe.paymentRequest()` behind your own button |

### Method confirmers

One composable per Stripe.js `confirm<Method>Payment` and `confirm<Method>Setup` method, such as `useConfirmCardPayment` and `useConfirmSepaDebitSetup`. The [method confirmers overview](/api/composables/confirm/) lists all of them and their shared return value.

| Page | Payment methods |
|------|-----------------|
| [Cards](/api/composables/confirm/cards) | Card |
| [Bank debits](/api/composables/confirm/bank-debits) | ACSS, AU BECS, Bacs, SEPA, US bank account |
| [Redirects and bank transfers](/api/composables/confirm/redirects) | Bancontact, EPS, FPX, giropay, iDEAL, Przelewy24, Sofort, Pay by Bank, Multibanco, customer balance |
| [Wallets](/api/composables/confirm/wallets) | Alipay, Amazon Pay, BLIK, Cash App Pay, GrabPay, MobilePay, PayNow, PayPal, Pix, PromptPay, TWINT, WeChat Pay |
| [Buy now, pay later](/api/composables/confirm/bnpl) | Affirm, Afterpay / Clearpay, Billie, Klarna |
| [Vouchers](/api/composables/confirm/vouchers) | Boleto, Konbini, OXXO |

## Plugin

| Export | Description |
|--------|-------------|
| [createVueStripe](/api/plugin) | Vue plugin that provides Stripe to the whole app, in place of `VueStripeProvider` |

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
  VueStripeCheckoutFormProviderProps,
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
  UseCheckoutFormReturn,
  UseStripeCheckoutReturn,
  UseStripeMethodReturn, // useConfirm<Method>Payment / Setup
  ConfirmPaymentOptions,
  ConfirmSetupOptions,
  CreatePaymentMethodOptions,
  HandleNextActionOptions,
  UseFinancialConnectionsReturn,
  UseIdentityReturn,
  UsePaymentRequestReturn,
  PaymentRequestEventMap,
  PaymentRequestEventType,
  PaymentRequestEventHandler,
  CollectFinancialConnectionsAccountsOptions,
  CollectBankAccountForPaymentOptions,
  CollectBankAccountForSetupOptions,
  CollectBankAccountTokenOptions,
  CheckoutRedirectOptions,

  // Composable results
  ElementsSubmitResult,
  VueStripeErrorResult,
  ConfirmPaymentResult,
  ConfirmSetupResult,
  CreatePaymentMethodResult,
  HandleNextActionResult,
  CollectFinancialConnectionsAccountsResult,
  CollectBankAccountForPaymentResult,
  CollectBankAccountForSetupResult,
  CollectBankAccountTokenResult,
  VerifyIdentityResult,

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
  StripeEmbeddedCheckoutLineItemsChangeEvent,
  // Re-exported Stripe.js Financial Connections type
  PreCollectedConsent,

  // Re-exported Stripe.js Checkout Form SDK types (beta)
  StripeCheckoutFormSdk,
  StripeCheckoutFormSdkOptions,
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutFormLoadActionsResult,
  StripeCheckoutForm,
  StripeCheckoutFormOptions,
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormValue,
  // Re-exported Stripe.js Payment Request API types
  PaymentRequest,
  PaymentRequestOptions,
  PaymentRequestUpdateOptions,
  PaymentRequestItem,
  PaymentRequestShippingOption,
  PaymentRequestShippingAddress,
  PaymentRequestWallet,
  PaymentRequestCompleteStatus,
  PaymentRequestUpdateDetails,
  CanMakePaymentResult,
  PaymentRequestTokenEvent,
  PaymentRequestPaymentMethodEvent,
  PaymentRequestSourceEvent,
  PaymentRequestShippingAddressEvent,
  PaymentRequestShippingOptionEvent
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
