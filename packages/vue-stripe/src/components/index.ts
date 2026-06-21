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

// European Regional Elements (v5.2.0)
// NOTE: the standalone iDEAL / P24 / EPS / FPX bank elements were removed in
// @stripe/stripe-js 8.0.0 (and dropped here in v6.0.0). Collect those payment
// methods via VueStripePaymentElement instead.
export { default as VueStripeIbanElement } from './VueStripeIbanElement.vue'

// Custom Checkout Elements (stripe-js 8.x)
export { default as VueStripeCurrencySelectorElement } from './VueStripeCurrencySelectorElement.vue'
export { default as VueStripeTaxIdElement } from './VueStripeTaxIdElement.vue'

// Messaging Element (v5.5.0)
export { default as VueStripePaymentMethodMessagingElement } from './VueStripePaymentMethodMessagingElement.vue'

// Checkout
export { default as VueStripeCheckout } from './VueStripeCheckout.vue'

// Custom Checkout (ui_mode: 'custom')
export { default as VueStripeCheckoutProvider } from './VueStripeCheckoutProvider.vue'

// Pricing Table (v5.3.0)
export { default as VueStripePricingTable } from './VueStripePricingTable.vue'

// APAC Regional Elements
export { default as VueStripeAuBankAccountElement } from './VueStripeAuBankAccountElement.vue'
