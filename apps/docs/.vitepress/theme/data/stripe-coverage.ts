// Stripe.js feature coverage matrix for Vue Stripe.
//
// This is the single source of truth for the home-page coverage tracker.
// A guard test (packages/vue-stripe/tests/coverage-matrix.test.ts) verifies that
// every `covered` entry's `artifact` is a real export of @vue-stripe/vue-stripe,
// so the numbers here cannot drift above what actually ships.
//
// status:
//   covered    – a dedicated Vue component or composable wraps it
//   accessible – no wrapper, but reachable via the raw stripe / elements instance
//                (useStripe().stripe / useStripeElements().elements)
//   planned    – on the roadmap (issue linked)
//   deprecated – deprecated by Stripe; intentionally not wrapped

export type CoverageStatus = 'covered' | 'accessible' | 'planned' | 'deprecated'

export interface CoverageItem {
  name: string
  /** Stripe.js API surface, e.g. elements.create('payment') or stripe.confirmPayment() */
  api: string
  status: CoverageStatus
  /** Vue Stripe export that covers it (required when status === 'covered'). */
  artifact?: string
  /** Roadmap issue number (when status === 'planned'). */
  issue?: number
}

export interface CoverageCategory {
  group: string
  items: CoverageItem[]
}

export const coverage: CoverageCategory[] = [
  {
    group: 'Core',
    items: [
      { name: 'Stripe Provider', api: 'loadStripe()', status: 'covered', artifact: 'VueStripeProvider' },
      { name: 'Plugin', api: 'createVueStripe()', status: 'covered', artifact: 'createVueStripe' },
      { name: 'Elements group', api: 'stripe.elements()', status: 'covered', artifact: 'VueStripeElements' },
      { name: 'useStripe', api: 'Stripe instance', status: 'covered', artifact: 'useStripe' },
      { name: 'useStripeElements', api: 'elements + submit()', status: 'covered', artifact: 'useStripeElements' }
    ]
  },
  {
    group: 'Payment Elements',
    items: [
      { name: 'Payment Element', api: "create('payment')", status: 'covered', artifact: 'VueStripePaymentElement' },
      { name: 'Express Checkout Element', api: "create('expressCheckout')", status: 'covered', artifact: 'VueStripeExpressCheckoutElement' },
      { name: 'Payment Request Button', api: "create('paymentRequestButton')", status: 'accessible' }
    ]
  },
  {
    group: 'Card Elements',
    items: [
      { name: 'Card Element', api: "create('card')", status: 'covered', artifact: 'VueStripeCardElement' },
      { name: 'Card Number', api: "create('cardNumber')", status: 'covered', artifact: 'VueStripeCardNumberElement' },
      { name: 'Card Expiry', api: "create('cardExpiry')", status: 'covered', artifact: 'VueStripeCardExpiryElement' },
      { name: 'Card CVC', api: "create('cardCvc')", status: 'covered', artifact: 'VueStripeCardCvcElement' }
    ]
  },
  {
    group: 'Bank & Regional Elements',
    items: [
      { name: 'IBAN Element', api: "create('iban')", status: 'covered', artifact: 'VueStripeIbanElement' },
      { name: 'iDEAL Bank', api: "create('idealBank')", status: 'covered', artifact: 'VueStripeIdealBankElement' },
      { name: 'P24 Bank', api: "create('p24Bank')", status: 'covered', artifact: 'VueStripeP24BankElement' },
      { name: 'EPS Bank', api: "create('epsBank')", status: 'covered', artifact: 'VueStripeEpsBankElement' },
      { name: 'FPX Bank', api: "create('fpxBank')", status: 'accessible' },
      { name: 'AU Bank Account', api: "create('auBankAccount')", status: 'accessible' }
    ]
  },
  {
    group: 'Address & Link',
    items: [
      { name: 'Address Element', api: "create('address')", status: 'covered', artifact: 'VueStripeAddressElement' },
      { name: 'Link Authentication', api: "create('linkAuthentication')", status: 'covered', artifact: 'VueStripeLinkAuthenticationElement' },
      { name: 'Shipping Address', api: "create('shippingAddress')", status: 'deprecated' }
    ]
  },
  {
    group: 'Messaging Elements',
    items: [
      { name: 'Payment Method Messaging', api: "create('paymentMethodMessaging')", status: 'planned', issue: 378 },
      { name: 'Affirm Message', api: "create('affirmMessage')", status: 'accessible' },
      { name: 'Afterpay/Clearpay Message', api: "create('afterpayClearpayMessage')", status: 'accessible' }
    ]
  },
  {
    group: 'Other Elements',
    items: [
      { name: 'Currency Selector', api: "create('currencySelector')", status: 'planned', issue: 382 },
      { name: 'Tax ID', api: "create('taxId')", status: 'planned', issue: 383 }
    ]
  },
  {
    group: 'Issuing Elements',
    items: [
      { name: 'Card Number Display', api: "create('issuingCardNumberDisplay')", status: 'accessible' },
      { name: 'Card CVC Display', api: "create('issuingCardCvcDisplay')", status: 'accessible' },
      { name: 'Card Expiry Display', api: "create('issuingCardExpiryDisplay')", status: 'accessible' },
      { name: 'Card PIN Display', api: "create('issuingCardPinDisplay')", status: 'accessible' },
      { name: 'Card Copy Button', api: "create('issuingCardCopyButton')", status: 'accessible' }
    ]
  },
  {
    group: 'Checkout',
    items: [
      { name: 'Redirect to Checkout', api: 'stripe.redirectToCheckout()', status: 'covered', artifact: 'VueStripeCheckout' },
      { name: 'Checkout composable', api: 'redirect helpers', status: 'covered', artifact: 'useStripeCheckout' },
      { name: 'Pricing Table', api: '<stripe-pricing-table>', status: 'covered', artifact: 'VueStripePricingTable' },
      { name: 'Embedded Checkout', api: 'stripe.initEmbeddedCheckout()', status: 'planned', issue: 379 },
      { name: 'Custom Checkout', api: 'stripe.initCheckout()', status: 'planned', issue: 388 }
    ]
  },
  {
    group: 'Payments & Setup',
    items: [
      { name: 'Confirm Payment', api: 'stripe.confirmPayment()', status: 'covered', artifact: 'usePaymentIntent' },
      { name: 'Confirm Setup', api: 'stripe.confirmSetup()', status: 'covered', artifact: 'useSetupIntent' },
      { name: 'Create Payment Method', api: 'stripe.createPaymentMethod()', status: 'covered', artifact: 'useCreatePaymentMethod' },
      { name: 'Handle Next Action', api: 'stripe.handleNextAction()', status: 'covered', artifact: 'useHandleNextAction' },
      { name: 'Retrieve Payment Intent', api: 'stripe.retrievePaymentIntent()', status: 'covered', artifact: 'usePaymentIntent' },
      { name: 'Retrieve Setup Intent', api: 'stripe.retrieveSetupIntent()', status: 'covered', artifact: 'useSetupIntent' },
      { name: 'Confirm Card Payment', api: 'stripe.confirmCardPayment()', status: 'accessible' },
      { name: 'Confirm Card Setup', api: 'stripe.confirmCardSetup()', status: 'accessible' },
      { name: 'Create Token', api: 'stripe.createToken()', status: 'accessible' },
      { name: 'Create Confirmation Token', api: 'stripe.createConfirmationToken()', status: 'accessible' }
    ]
  },
  {
    group: 'Advanced',
    items: [
      { name: 'Financial Connections', api: 'stripe.collectFinancialConnectionsAccounts()', status: 'planned', issue: 393 },
      { name: 'Identity Verification', api: 'stripe.verifyIdentity()', status: 'planned', issue: 393 },
      { name: 'Bank Account Collection', api: 'stripe.collectBankAccountForPayment()', status: 'accessible' }
    ]
  }
]
