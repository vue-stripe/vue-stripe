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
  UseCheckoutSessionReturn,
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
  // Event types
  StripeCardElementChangeEvent,
  StripePaymentElementChangeEvent,
  StripeAddressElementChangeEvent,
  StripeLinkAuthenticationElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementClickEvent,
  // Custom Checkout types
  StripeCheckout,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult
} from './types'

// Export checkout composable types (defined alongside useStripeCheckout)
export type {
  UseStripeCheckoutReturn,
  CheckoutRedirectOptions,
  LegacyCheckoutOptions
} from './composables/useStripeCheckout'

// Export all components
export * from './components'

// Export all composables
export * from './composables'

// Export error classes
export {
  VueStripeProviderError,
  VueStripeElementsError,
  VueStripeCheckoutError,
  VueStripeLoadError,
  createVueStripeError
} from './utils/errors'

// Export plugin
export { createVueStripe } from './plugin'

// Re-export Stripe.js for convenience
export { loadStripe } from '@stripe/stripe-js'
