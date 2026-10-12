// Stripe.js 10 (Endive) feature coverage matrix for Vue Stripe.
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
//   deprecated – deprecated or removed by Stripe (use the Payment Element or the
//                listed replacement); intentionally not wrapped

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
      {
        name: 'Stripe Provider',
        api: 'loadStripe()',
        status: 'covered',
        artifact: 'VueStripeProvider'
      },
      { name: 'Plugin', api: 'createVueStripe()', status: 'covered', artifact: 'createVueStripe' },
      {
        name: 'Elements group',
        api: 'stripe.elements()',
        status: 'covered',
        artifact: 'VueStripeElements'
      },
      { name: 'useStripe', api: 'Stripe instance', status: 'covered', artifact: 'useStripe' },
      {
        name: 'useStripeElements',
        api: 'elements + submit()',
        status: 'covered',
        artifact: 'useStripeElements'
      },
      {
        name: 'Elements fetchUpdates / update-end',
        api: "elements.fetchUpdates(), on('update-end')",
        status: 'covered',
        artifact: 'useStripeElements'
      }
    ]
  },
  {
    group: 'Payment Elements',
    items: [
      {
        name: 'Payment Element',
        api: "create('payment')",
        status: 'covered',
        artifact: 'VueStripePaymentElement'
      },
      {
        name: 'Express Checkout Element',
        api: "create('expressCheckout')",
        status: 'covered',
        artifact: 'VueStripeExpressCheckoutElement'
      },
      {
        // Removed in Endive; the Express Checkout Element replaces it.
        name: 'Payment Request Button',
        api: "create('paymentRequestButton')",
        status: 'deprecated'
      },
      { name: 'Payment Request API', api: 'stripe.paymentRequest()', status: 'accessible' }
    ]
  },
  {
    group: 'Card Elements',
    items: [
      {
        name: 'Card Element',
        api: "create('card')",
        status: 'covered',
        artifact: 'VueStripeCardElement'
      },
      {
        name: 'Card Number',
        api: "create('cardNumber')",
        status: 'covered',
        artifact: 'VueStripeCardNumberElement'
      },
      {
        name: 'Card Expiry',
        api: "create('cardExpiry')",
        status: 'covered',
        artifact: 'VueStripeCardExpiryElement'
      },
      {
        name: 'Card CVC',
        api: "create('cardCvc')",
        status: 'covered',
        artifact: 'VueStripeCardCvcElement'
      }
    ]
  },
  {
    group: 'Bank & Regional Elements',
    items: [
      {
        name: 'IBAN Element',
        api: "create('iban')",
        status: 'covered',
        artifact: 'VueStripeIbanElement'
      },
      {
        // Removed in Clover; collect these methods with the Payment Element.
        name: 'iDEAL / P24 / EPS / FPX bank elements',
        api: "create('idealBank' | 'p24Bank' | 'epsBank' | 'fpxBank')",
        status: 'deprecated'
      },
      {
        name: 'AU Bank Account',
        api: "create('auBankAccount')",
        status: 'covered',
        artifact: 'VueStripeAuBankAccountElement'
      }
    ]
  },
  {
    group: 'Address & Link',
    items: [
      {
        name: 'Address Element',
        api: "create('address')",
        status: 'covered',
        artifact: 'VueStripeAddressElement'
      },
      {
        name: 'Link Authentication',
        api: "create('linkAuthentication')",
        status: 'covered',
        artifact: 'VueStripeLinkAuthenticationElement'
      },
      { name: 'Shipping Address', api: "create('shippingAddress')", status: 'deprecated' },
      { name: 'Contact Details', api: "create('contactDetails')", status: 'planned', issue: 494 },
      { name: 'Link Signup', api: "create('linkSignup')", status: 'planned', issue: 494 },
      { name: 'Terms', api: "create('terms')", status: 'planned', issue: 494 }
    ]
  },
  {
    group: 'Messaging Elements',
    items: [
      {
        name: 'Payment Method Messaging (BNPL)',
        api: "create('paymentMethodMessaging')",
        status: 'covered',
        artifact: 'VueStripePaymentMethodMessagingElement'
      },
      {
        // Removed in Clover; use the Payment Method Messaging Element.
        name: 'Affirm Message',
        api: "create('affirmMessage')",
        status: 'deprecated'
      },
      {
        name: 'Afterpay/Clearpay Message',
        api: "create('afterpayClearpayMessage')",
        status: 'deprecated'
      }
    ]
  },
  {
    group: 'Checkout Session Elements',
    items: [
      // Checkout Elements SDK elements; Tax ID and Currency Selector also exist on
      // elements.create() behind a Stripe beta.
      {
        name: 'Currency Selector',
        api: "checkout.createCurrencySelectorElement() / create('currencySelector')",
        status: 'covered',
        artifact: 'VueStripeCurrencySelectorElement'
      },
      {
        name: 'Tax ID',
        api: "checkout.createTaxIdElement() / create('taxId')",
        status: 'covered',
        artifact: 'VueStripeTaxIdElement'
      }
    ]
  },
  {
    group: 'Issuing Elements',
    items: [
      {
        name: 'Card Number Display',
        api: "create('issuingCardNumberDisplay')",
        status: 'accessible'
      },
      { name: 'Card CVC Display', api: "create('issuingCardCvcDisplay')", status: 'accessible' },
      {
        name: 'Card Expiry Display',
        api: "create('issuingCardExpiryDisplay')",
        status: 'accessible'
      },
      { name: 'Card PIN Display', api: "create('issuingCardPinDisplay')", status: 'accessible' },
      { name: 'Card Copy Button', api: "create('issuingCardCopyButton')", status: 'accessible' },
      {
        // No typed elements.create() overload in Stripe.js 10.0.0.
        name: 'Add to Wallet (Issuing)',
        api: "create('issuingAddToWalletButton')",
        status: 'planned',
        issue: 495
      },
      {
        name: 'Disclosures (Financial Account / Issuing / Treasury)',
        api: 'legal text components (React Stripe.js parity)',
        status: 'planned',
        issue: 494
      }
    ]
  },
  {
    group: 'Checkout',
    items: [
      {
        name: 'Hosted Checkout redirect',
        api: 'session.url redirect',
        status: 'covered',
        artifact: 'VueStripeCheckout'
      },
      {
        name: 'Checkout redirect composable',
        api: 'redirectToCheckout({ url }) / redirectToUrl()',
        status: 'covered',
        artifact: 'useStripeCheckout'
      },
      {
        // Removed in Clover (sessionId / lineItems client-side redirect).
        name: 'Client-side redirectToCheckout',
        api: 'stripe.redirectToCheckout()',
        status: 'deprecated'
      },
      {
        name: 'Pricing Table',
        api: '<stripe-pricing-table>',
        status: 'covered',
        artifact: 'VueStripePricingTable'
      },
      {
        name: 'Embedded Checkout',
        api: 'stripe.createEmbeddedCheckoutPage()',
        status: 'covered',
        artifact: 'VueStripeEmbeddedCheckout'
      },
      {
        name: 'Elements with Checkout Sessions',
        api: 'stripe.initCheckoutElementsSdk()',
        status: 'covered',
        artifact: 'VueStripeCheckoutElementsProvider'
      },
      {
        name: 'Checkout Form',
        api: 'stripe.initCheckoutFormSdk()',
        status: 'planned',
        issue: 493
      }
    ]
  },
  {
    group: 'Payments & Setup',
    items: [
      {
        name: 'Confirm Payment',
        api: 'stripe.confirmPayment()',
        status: 'covered',
        artifact: 'usePaymentIntent'
      },
      {
        name: 'Confirm Setup',
        api: 'stripe.confirmSetup()',
        status: 'covered',
        artifact: 'useSetupIntent'
      },
      {
        name: 'Create Payment Method',
        api: 'stripe.createPaymentMethod()',
        status: 'covered',
        artifact: 'useCreatePaymentMethod'
      },
      {
        name: 'Handle Next Action',
        api: 'stripe.handleNextAction()',
        status: 'covered',
        artifact: 'useHandleNextAction'
      },
      {
        name: 'Retrieve Payment Intent',
        api: 'stripe.retrievePaymentIntent()',
        status: 'covered',
        artifact: 'usePaymentIntent'
      },
      {
        name: 'Retrieve Setup Intent',
        api: 'stripe.retrieveSetupIntent()',
        status: 'covered',
        artifact: 'useSetupIntent'
      },
      {
        // ~50 confirmers incl. confirmCardPayment, confirmAmazonPaySetup, confirmBlikSetup,
        // confirmPayByBankPayment. Dedicated composables are planned in #503.
        name: 'Method-specific confirm*',
        api: 'stripe.confirm<Method>Payment/Setup()',
        status: 'accessible'
      },
      { name: 'Create Token', api: 'stripe.createToken()', status: 'accessible' },
      {
        name: 'Create Confirmation Token',
        api: 'stripe.createConfirmationToken()',
        status: 'accessible'
      },
      {
        name: 'Radar session / ephemeral key nonce',
        api: 'stripe.createRadarSession(), createEphemeralKeyNonce()',
        status: 'accessible'
      }
    ]
  },
  {
    group: 'Advanced',
    items: [
      {
        name: 'Financial Connections',
        api: 'stripe.collectFinancialConnectionsAccounts()',
        status: 'planned',
        issue: 496
      },
      {
        name: 'Identity Verification',
        api: 'stripe.verifyIdentity()',
        status: 'planned',
        issue: 496
      },
      {
        name: 'Bank Account Collection / Token',
        api: 'stripe.collectBankAccountForPayment(), collectBankAccountToken()',
        status: 'planned',
        issue: 496
      }
    ]
  }
]
