---
title: "Types and errors: TypeScript reference"
description: "TypeScript types and error classes exported by @vue-stripe/vue-stripe, including the re-exported Stripe.js types and the typed Vue Stripe errors."
---

# Types and errors

The TypeScript types and error classes that `@vue-stripe/vue-stripe` exports. Import every type from the package, not from `@stripe/stripe-js`: the Stripe.js types below are re-exported under their original names, so one import covers both.

```ts
// Listing: how to import types, not a complete sample
import type { UsePaymentIntentReturn, StripePaymentElementOptions } from '@vue-stripe/vue-stripe'
```

## Vue Stripe types

Types defined by Vue Stripe.

### Configuration and props

| Type | Description |
|------|-------------|
| `VueStripeOptions` | Options of [`createVueStripe()`](/api/plugin) |
| `VueStripeConfig` | The resolved config (`publishableKey`, `stripeAccount`, `apiVersion`, `locale`) that the provider and the plugin [provide](/api/components/stripe-provider#provides) under `stripeConfigInjectionKey` |
| `VueStripeProviderProps` | Props of [`VueStripeProvider`](/api/components/stripe-provider) |
| `VueStripeElementsProps` | Props of [`VueStripeElements`](/api/components/stripe-elements) |
| `VueStripeCheckoutElementsProviderProps` | Props of [`VueStripeCheckoutElementsProvider`](/api/components/stripe-checkout-provider) |
| `VueStripeCheckoutProviderProps` | Same type under the deprecated alias name |
| `VueStripeCheckoutFormProviderProps` | Props of [`VueStripeCheckoutFormProvider`](/api/components/stripe-checkout-form-provider) |
| `VueStripeEmbeddedCheckoutProps` | Props of [`VueStripeEmbeddedCheckout`](/api/components/stripe-embedded-checkout) |
| `VueStripePricingTableProps` | Props of [`VueStripePricingTable`](/api/components/stripe-pricing-table) |
| `PaymentElementType` | Payment method type names the Payment Element can show |
| `ExpressCheckoutType` | `'apple_pay' \| 'google_pay' \| 'paypal' \| 'amazon_pay' \| 'link'` |

### Composable return values and options

| Type | Used by |
|------|---------|
| `UseStripeReturn` | [`useStripe`](/api/composables/use-stripe) |
| `UseStripeElementsReturn`, `ElementsSubmitResult` | [`useStripeElements`](/api/composables/use-stripe-elements) |
| `UsePaymentIntentReturn`, `ConfirmPaymentOptions`, `ConfirmPaymentResult` | [`usePaymentIntent`](/api/composables/use-payment-intent) |
| `UseSetupIntentReturn`, `ConfirmSetupOptions`, `ConfirmSetupResult` | [`useSetupIntent`](/api/composables/use-setup-intent) |
| `UseStripeCheckoutReturn`, `CheckoutRedirectOptions` | [`useStripeCheckout`](/api/composables/use-stripe-checkout) |
| `UseCheckoutSessionReturn` | [`useCheckoutSession`](/api/composables/use-checkout-session) |
| `UseCheckoutFormReturn` | [`useCheckoutForm`](/api/composables/use-checkout-form) |
| `UseCreatePaymentMethodReturn`, `CreatePaymentMethodOptions`, `CreatePaymentMethodResult` | [`useCreatePaymentMethod`](/api/composables/use-create-payment-method) |
| `UseCreateConfirmationTokenReturn`, `CreateConfirmationTokenOptions` | [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token) |
| `UseHandleNextActionReturn`, `HandleNextActionOptions`, `HandleNextActionResult` | [`useHandleNextAction`](/api/composables/use-handle-next-action) |
| `UseFinancialConnectionsReturn`, `CollectFinancialConnectionsAccountsOptions`, `CollectFinancialConnectionsAccountsResult`, `CollectBankAccountForPaymentOptions`, `CollectBankAccountForPaymentResult`, `CollectBankAccountForSetupOptions`, `CollectBankAccountForSetupResult`, `CollectBankAccountTokenOptions`, `CollectBankAccountTokenResult` | [`useFinancialConnections`](/api/composables/use-financial-connections) |
| `UseIdentityReturn`, `VerifyIdentityResult` | [`useIdentity`](/api/composables/use-identity) |
| `UsePaymentRequestReturn`, `PaymentRequestEventMap`, `PaymentRequestEventType`, `PaymentRequestEventHandler` | [`usePaymentRequest`](/api/composables/use-payment-request) |
| `UseStripeMethodReturn<K>`, `StripeMethodName` | The [method composables](/api/composables/confirm/) (`useConfirm<Method>Payment` / `Setup`, `useCreateToken`, `useRadarSession`, ...): the Stripe method `K` under its own name plus `loading` and `error` |
| `VueStripeErrorResult` | The `{ error: { message } }` result a composable resolves to when Stripe.js has not loaded or the Stripe call threw. See [return value](/api/composables/confirm/#return-value) |

### Components and context

| Type | Description |
|------|-------------|
| `StripeElementComponent<TOptions, TElement, TExtra, TEvents>` | Public type of every element component; use it with `InstanceType<typeof ...>` for template refs |
| `StripeElementExposed<TElement>` | Members every element component exposes: `element`, `loading`, `error`, `focus()`, `blur()`, `clear()` |
| `BaseElementEvents<TElement, TChange>` | Payloads of the `ready`, `change`, `focus`, `blur` and `escape` events. `focus`, `blur` and `escape` carry `{ elementType }`, with the element type taken from `TChange` |
| `VueStripeElement`, `VueStripeElementEvents` | Element state (`stripe`, `element`, `loading`, `error`) and the `ready` / `change` handler signatures |
| `StripeDisclosureComponent<TOptions>` | Public type of the disclosure components |
| `DisclosureStripeProp` | The disclosures' `stripe` prop: a `Stripe` instance, a Promise of one, or `null` |
| `DisclosureError` | Payload of a disclosure's `error` event: a `StripeError`, or `{ message }` |
| `FinancialAccountDisclosureOptions`, `IssuingDisclosureOptions`, `TreasuryDisclosureOptions` | `options` of the three [disclosure components](/api/components/stripe-financial-account-disclosure) |
| `VueStripeContext` | What `VueStripeProvider` provides: `stripe`, `loading`, `error` refs |
| `VueStripeElementsContext` | What `VueStripeElements` provides: `elements`, `loading`, `error` refs |
| `VueStripeError` | Shape of a Stripe error: `type`, `code`, `message`, `decline_code`, `param` |

## Re-exported Stripe.js types

These come from `@stripe/stripe-js` 10 unchanged. Stripe documents them in the [Stripe.js reference](https://docs.stripe.com/js).

```ts
// Listing of the re-exported Stripe.js types, not a sample
import type {
  // Core
  Stripe,
  StripeConstructorOptions,
  StripeError,
  ReleaseTrain,
  PaymentIntent,
  SetupIntent,
  ConfirmPaymentData,
  ConfirmSetupData,
  ConfirmCardSetupData,
  ConfirmationTokenResult,
  CreatePaymentMethodData,
  CreatePaymentMethodFromElements,

  // Elements group
  StripeElements,
  StripeElement,
  StripeElementType,
  StripeElementsOptions,
  StripeElementsOptionsClientSecret,
  StripeElementsOptionsMode,
  StripeElementsUpdateOptions,
  StripeElementChangeEvent,
  Appearance,
  CssFontSource,
  CustomFontSource,

  // Elements, their options and events
  StripePaymentElement,
  StripePaymentElementOptions,
  StripePaymentElementChangeEvent,
  StripePaymentElementAvailablePaymentMethodsChangeEvent,
  StripePaymentElementCardDetailsChangeEvent,
  StripePaymentElementSavedPaymentMethodRemoveEvent,
  StripePaymentElementSavedPaymentMethodUpdateEvent,
  StripeExpressCheckoutElement,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
  StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  StripeCardElement,
  StripeCardElementOptions,
  StripeCardElementChangeEvent,
  StripeCardNumberElement,
  StripeCardNumberElementOptions,
  StripeCardNumberElementChangeEvent,
  StripeCardExpiryElement,
  StripeCardExpiryElementOptions,
  StripeCardExpiryElementChangeEvent,
  StripeCardCvcElement,
  StripeCardCvcElementOptions,
  StripeCardCvcElementChangeEvent,
  StripeAddressElement,
  StripeAddressElementOptions,
  StripeAddressElementChangeEvent,
  StripeLinkAuthenticationElement,
  StripeLinkAuthenticationElementOptions,
  StripeLinkAuthenticationElementChangeEvent,
  StripePaymentMethodMessagingElement,
  StripePaymentMethodMessagingElementOptions,
  StripeIbanElement,
  StripeIbanElementOptions,
  StripeIbanElementChangeEvent,
  StripeAuBankAccountElement,
  StripeAuBankAccountElementOptions,
  StripeAuBankAccountElementChangeEvent,
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

  // Issuing elements
  StripeIssuingCardNumberDisplayElement,
  StripeIssuingCardNumberDisplayElementOptions,
  StripeIssuingCardCvcDisplayElement,
  StripeIssuingCardCvcDisplayElementOptions,
  StripeIssuingCardExpiryDisplayElement,
  StripeIssuingCardExpiryDisplayElementOptions,
  StripeIssuingCardPinDisplayElement,
  StripeIssuingCardPinDisplayElementOptions,
  StripeIssuingCardCopyButtonElement,
  StripeIssuingCardCopyButtonElementOptions,
  StripeIssuingAddToWalletButtonElement,
  StripeIssuingAddToWalletButtonElementOptions,

  // Checkout Elements SDK
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutLoadActionsResult,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult,

  // Checkout Form SDK (beta)
  StripeCheckoutFormSdk,
  StripeCheckoutFormSdkOptions,
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutFormLoadActionsResult,
  StripeCheckoutForm,
  StripeCheckoutFormOptions,
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormValue,

  // Embedded Checkout
  StripeEmbeddedCheckout,
  StripeEmbeddedCheckoutOptions,
  StripeEmbeddedCheckoutAnalyticsEventUnion,
  StripeEmbeddedCheckoutLineItemsChangeEvent,

  // Financial Connections
  PreCollectedConsent,

  // Payment Request API
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

The package's `src/index.ts` is the source of this list.

## Error classes

```ts
// Listing of the error classes, not a sample
import {
  VueStripeProviderError,
  VueStripeElementsError,
  VueStripeCheckoutError
} from '@vue-stripe/vue-stripe'
```

All three extend `Error` and set `name` to the class name. They signal integration mistakes and are thrown during component setup or when the composable is called, except where the table says a call rejects. Stripe's own errors (declines, validation) come back as `{ error }` results; [return value](/api/composables/confirm/#return-value) lists which calls resolve and which reject.

| Class | Thrown when |
|-------|-------------|
| `VueStripeProviderError` | No Stripe context: a composable or component that needs Stripe runs outside `VueStripeProvider` (and without the [plugin](/api/plugin)); `VueStripeProvider` has neither `publishableKey` nor `stripeKey`; a call of a [method composable](/api/composables/confirm/) (`useConfirm*`, `useCreateToken`, `useRadarSession`, ...) made before Stripe.js has loaded rejects with it |
| `VueStripeElementsError` | An element component or Elements composable (`useStripeElements`, the element flow of `useCreateConfirmationToken`) runs outside `VueStripeElements` or a Checkout provider, or the element can't be created there |
| `VueStripeCheckoutError` | `useCheckoutSession` runs outside `VueStripeCheckoutElementsProvider`, `useCheckoutForm` outside `VueStripeCheckoutFormProvider`, or `useStripeCheckout().redirectToCheckout()` gets no `url` (it rejects with this error) |

## Removed in v6

| Removed export | Replacement |
|----------------|-------------|
| `StripeCheckout` (type) | `StripeCheckoutElementsSdk` |
| `LegacyCheckoutOptions` | `CheckoutRedirectOptions` (`{ url }`); create the Checkout Session on your server |
| `VueStripeLoadError`, `createVueStripeError` | The typed error classes above (`VueStripeProviderError`, `VueStripeElementsError`, `VueStripeCheckoutError`) |

[Upgrade from v5 to v6](/guide/migration-v6) lists every breaking change.
