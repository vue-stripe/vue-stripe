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
  StripeExpressCheckoutElementClickEvent
} from './types'

// Export all components
export * from './components'

// Export all composables
export * from './composables'

// Export error classes
export {
  VueStripeProviderError,
  VueStripeElementsError,
  VueStripeLoadError,
  createVueStripeError
} from './utils/errors'

// Export plugin
export { createVueStripe } from './plugin'

// Re-export Stripe.js for convenience
export { loadStripe } from '@stripe/stripe-js'
