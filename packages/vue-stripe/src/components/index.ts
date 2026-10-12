// Provider Components
export { default as VueStripeProvider } from './VueStripeProvider.vue'
export { default as VueStripeElements } from './VueStripeElements.vue'

// Payment Elements
export { default as VueStripePaymentElement } from './VueStripePaymentElement.vue'
export { default as VueStripeExpressCheckoutElement } from './VueStripeExpressCheckoutElement.vue'

// Card Elements
export { default as VueStripeCardElement } from './VueStripeCardElement.vue'
export { default as VueStripeCardNumberElement } from './VueStripeCardNumberElement.vue'
export { default as VueStripeCardExpiryElement } from './VueStripeCardExpiryElement.vue'
export { default as VueStripeCardCvcElement } from './VueStripeCardCvcElement.vue'

// Other Elements
export { default as VueStripeLinkAuthenticationElement } from './VueStripeLinkAuthenticationElement.vue'
export { default as VueStripeAddressElement } from './VueStripeAddressElement.vue'

// Regional elements. The standalone iDEAL, P24, EPS and FPX elements were
// removed by Stripe in Stripe.js 8 (Clover); use the Payment Element for them.
export { default as VueStripeIbanElement } from './VueStripeIbanElement.vue'
export { default as VueStripeAuBankAccountElement } from './VueStripeAuBankAccountElement.vue'

// Messaging Element (v5.5.0)
export { default as VueStripePaymentMethodMessagingElement } from './VueStripePaymentMethodMessagingElement.vue'

// Checkout
export { default as VueStripeCheckout } from './VueStripeCheckout.vue'

// Elements with Checkout Sessions (stripe.initCheckoutElementsSdk)
export { default as VueStripeCheckoutElementsProvider } from './VueStripeCheckoutProvider.vue'
/** @deprecated Renamed to VueStripeCheckoutElementsProvider (mirrors Stripe's initCheckoutElementsSdk); removed in v7. */
export { default as VueStripeCheckoutProvider } from './VueStripeCheckoutProvider.vue'

// Pricing Table (v5.3.0)
export { default as VueStripePricingTable } from './VueStripePricingTable.vue'
