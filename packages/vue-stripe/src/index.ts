// Export types without conflicts
export type {
  VueStripeOptions,
  VueStripeElement,
  StripeProviderProps,
  StripeElementsProps,
  StripeElementEvents,
  UseStripeReturn,
  UseStripeElementsReturn,
  UsePaymentIntentReturn,
  UseSetupIntentReturn,
  PaymentElementType,
  ExpressCheckoutType,
  StripeError,
  StripeContext,
  StripeElementsContext
} from './types'

// Re-export Stripe.js types
export type {
  Stripe,
  StripeElements,
  StripeElement,
  StripeElementType,
  StripeElementChangeEvent,
  PaymentIntent,
  SetupIntent,
  ConfirmPaymentData,
  ConfirmCardSetupData
} from '@stripe/stripe-js'

// Export all components
export * from './components'

// Export all composables
export * from './composables'

// Export plugin
export { createVueStripe } from './plugin'
export { default } from './plugin'

// Re-export Stripe.js for convenience
export { loadStripe } from '@stripe/stripe-js'