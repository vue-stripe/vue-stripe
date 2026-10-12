// Provider Components
export { default as VueStripeProvider } from './VueStripeProvider'
export { default as VueStripeElements } from './VueStripeElements'

// Payment Elements
export { default as VueStripePaymentElement } from './VueStripePaymentElement'
export { default as VueStripeExpressCheckoutElement } from './VueStripeExpressCheckoutElement'

// Card Elements
export { default as VueStripeCardElement } from './VueStripeCardElement'
export { default as VueStripeCardNumberElement } from './VueStripeCardNumberElement'
export { default as VueStripeCardExpiryElement } from './VueStripeCardExpiryElement'
export { default as VueStripeCardCvcElement } from './VueStripeCardCvcElement'

// Other Elements
export { default as VueStripeLinkAuthenticationElement } from './VueStripeLinkAuthenticationElement'
export { default as VueStripeAddressElement } from './VueStripeAddressElement'

// Regional elements. The standalone iDEAL, P24, EPS and FPX elements were
// removed by Stripe in Stripe.js 8 (Clover); use the Payment Element for them.
export { default as VueStripeIbanElement } from './VueStripeIbanElement'
export { default as VueStripeAuBankAccountElement } from './VueStripeAuBankAccountElement'

// Messaging Element (v5.5.0)
export { default as VueStripePaymentMethodMessagingElement } from './VueStripePaymentMethodMessagingElement'

// Checkout
export { default as VueStripeCheckout } from './VueStripeCheckout'

// Elements with Checkout Sessions (stripe.initCheckoutElementsSdk)
export { default as VueStripeCheckoutElementsProvider } from './VueStripeCheckoutElementsProvider'
/** @deprecated Renamed to VueStripeCheckoutElementsProvider (mirrors Stripe's initCheckoutElementsSdk); removed in v7. */
export { default as VueStripeCheckoutProvider } from './VueStripeCheckoutElementsProvider'

// Embedded Checkout (stripe.createEmbeddedCheckoutPage)
export { default as VueStripeEmbeddedCheckout } from './VueStripeEmbeddedCheckout'

// Elements for Checkout Sessions (Stripe.js 10)
export { default as VueStripeTaxIdElement } from './VueStripeTaxIdElement'
export { default as VueStripeCurrencySelectorElement } from './VueStripeCurrencySelectorElement'
export { default as VueStripeContactDetailsElement } from './VueStripeContactDetailsElement'
export { default as VueStripeTermsElement } from './VueStripeTermsElement'
export { default as VueStripeLinkSignupElement } from './VueStripeLinkSignupElement'

// Disclosures (React Stripe.js 7 parity): legal text rendered by Stripe.js
export { default as VueStripeFinancialAccountDisclosure } from './VueStripeFinancialAccountDisclosure'
export { default as VueStripeIssuingDisclosure } from './VueStripeIssuingDisclosure'
export { default as VueStripeTreasuryDisclosure } from './VueStripeTreasuryDisclosure'

// Pricing Table (v5.3.0)
export { default as VueStripePricingTable } from './VueStripePricingTable'
