// Component styles, emitted as dist/vue-stripe.css (exported as '@vue-stripe/vue-stripe/style.css').
import './styles.css'

// Export all types (Vue-specific + Stripe.js types)
// Vue components use VueStripe* prefix, so Stripe.js types can use original names
export type {
  // Vue-specific types
  VueStripeOptions,
  VueStripeElement,
  VueStripeProviderProps,
  VueStripeElementsProps,
  VueStripeElementEvents,
  UseStripeReturn,
  UseStripeElementsReturn,
  UsePaymentIntentReturn,
  UseSetupIntentReturn,
  ConfirmPaymentOptions,
  ConfirmSetupOptions,
  UseCreatePaymentMethodReturn,
  CreatePaymentMethodOptions,
  UseHandleNextActionReturn,
  HandleNextActionOptions,
  VueStripeCheckoutProviderProps,
  VueStripeCheckoutElementsProviderProps,
  VueStripeCheckoutFormProviderProps,
  VueStripePricingTableProps,
  VueStripeEmbeddedCheckoutProps,
  ElementsSubmitResult,
  UseCheckoutSessionReturn,
  UseCheckoutFormReturn,
  VueStripeErrorResult,
  ConfirmPaymentResult,
  ConfirmSetupResult,
  CreatePaymentMethodResult,
  HandleNextActionResult,
  UseFinancialConnectionsReturn,
  CollectFinancialConnectionsAccountsOptions,
  CollectBankAccountForPaymentOptions,
  CollectBankAccountForSetupOptions,
  CollectBankAccountTokenOptions,
  CollectFinancialConnectionsAccountsResult,
  CollectBankAccountForPaymentResult,
  CollectBankAccountForSetupResult,
  CollectBankAccountTokenResult,
  UseIdentityReturn,
  VerifyIdentityResult,
  PaymentElementType,
  ExpressCheckoutType,
  VueStripeError,
  VueStripeContext,
  VueStripeElementsContext,
  // Stripe.js types (original names - no conflicts now)
  Stripe,
  StripeElements,
  StripeElement,
  StripeElementType,
  StripeElementsOptions,
  StripeElementChangeEvent,
  PaymentIntent,
  SetupIntent,
  ConfirmPaymentData,
  ConfirmCardSetupData,
  // Stripe element types
  StripeCardElement,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement,
  StripePaymentElement,
  StripeAddressElement,
  StripeLinkAuthenticationElement,
  StripeExpressCheckoutElement,
  StripeTaxIdElement,
  StripeTaxIdElementOptions,
  StripeCurrencySelectorElement,
  StripeContactDetailsElement,
  StripeContactDetailsElementOptions,
  StripeTermsElement,
  StripeTermsElementOptions,
  StripeLinkSignupElement,
  StripeLinkSignupElementOptions,
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
  // Event types
  StripeCardElementChangeEvent,
  StripePaymentElementChangeEvent,
  StripeAddressElementChangeEvent,
  StripeLinkAuthenticationElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeTaxIdElementChangeEvent,
  StripeContactDetailsElementChangeEvent,
  // Elements with Checkout Sessions (Checkout Elements SDK) types
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutLoadActionsResult,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult,
  // Embedded Checkout types
  StripeEmbeddedCheckout,
  StripeEmbeddedCheckoutOptions,
  StripeEmbeddedCheckoutAnalyticsEventUnion,
  StripeEmbeddedCheckoutLineItemsChangeEvent,
  PreCollectedConsent,
  // Checkout Form SDK types (Stripe beta)
  StripeCheckoutFormSdk,
  StripeCheckoutFormSdkOptions,
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutFormLoadActionsResult,
  StripeCheckoutForm,
  StripeCheckoutFormOptions,
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormValue
} from './types'

// Export checkout composable types (defined alongside useStripeCheckout)
export type {
  UseStripeCheckoutReturn,
  CheckoutRedirectOptions
} from './composables/useStripeCheckout'

// Return type of the method composables (useConfirmCardPayment, ...)
export type { UseStripeMethodReturn, StripeMethodName } from './utils/method-factory'

// Public types of the element components (template refs, InstanceType, custom elements)
export type {
  StripeElementComponent,
  StripeElementExposed,
  BaseElementEvents
} from './utils/element-types'

// Public types of the disclosure components (React Stripe.js 7 parity)
export type {
  StripeDisclosureComponent,
  DisclosureStripeProp,
  DisclosureError,
  FinancialAccountDisclosureOptions,
  IssuingDisclosureOptions,
  TreasuryDisclosureOptions
} from './utils/disclosure'

// Export all components
export * from './components'

// Export all composables
export * from './composables'

// Export error classes
export {
  VueStripeProviderError,
  VueStripeElementsError,
  VueStripeCheckoutError
} from './utils/errors'

// Export plugin
export { createVueStripe } from './plugin'

// Re-export Stripe.js for convenience
export { loadStripe } from '@stripe/stripe-js'
