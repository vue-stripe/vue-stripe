// Stripe.js 10 (Endive) feature coverage matrix for Vue Stripe.
//
// This is the single source of truth for the home-page coverage tracker.
// A guard test (packages/vue-stripe/tests/coverage-matrix.test.ts) verifies that
// every `covered` entry's `artifact` is a real export of @vue-stripe/vue-stripe,
// so the numbers here cannot drift above what actually ships.
//
// A second guard (packages/vue-stripe/tests/stripe-surface.test.ts) parses the
// installed @stripe/stripe-js type definitions: every method and element type
// must be listed in exactly one row's `surface` with status `covered` or
// `deprecated`, and every `surface` key must still exist in the types. A
// Stripe.js upgrade that adds surface fails the build until it is classified here.
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
  /** Why a deprecated row is not wrapped and what replaces it (shown on the page). */
  note?: string
  /**
   * The @stripe/stripe-js type members this row accounts for, as
   * `<declaring type>.<member>` (`Stripe.confirmPayment`, `StripeElementType.card`,
   * `StripePaymentElement.collapse`). Checked by tests/stripe-surface.test.ts.
   */
  surface?: string[]
}

export interface CoverageCategory {
  group: string
  items: CoverageItem[]
}

// A `stripe.confirm<Method>Payment/Setup()` row, covered by its `useConfirm<Method>...` composable.
const confirmer = (name: string, method: string, note?: string): CoverageItem => ({
  name,
  api: `stripe.${method}()`,
  status: 'covered',
  artifact: `use${method.charAt(0).toUpperCase()}${method.slice(1)}`,
  surface: [`Stripe.${method}`],
  ...(note ? { note } : {})
})

export const coverage: CoverageCategory[] = [
  {
    group: 'Core',
    items: [
      {
        name: 'Stripe Provider',
        api: 'loadStripe()',
        status: 'covered',
        artifact: 'VueStripeProvider',
        surface: ['loadStripe']
      },
      {
        // The provider and createVueStripe() register Vue Stripe as the wrapper library.
        name: 'Wrapper library registration',
        api: 'stripe.registerAppInfo()',
        status: 'covered',
        artifact: 'VueStripeProvider',
        surface: ['Stripe.registerAppInfo']
      },
      {
        name: 'Developer tools option',
        api: 'loadStripe(key, { developerTools })',
        status: 'covered',
        artifact: 'VueStripeProvider'
      },
      {
        name: 'Advanced fraud signals opt-out',
        api: 'loadStripe.setLoadParameters({ advancedFraudSignals })',
        status: 'covered',
        artifact: 'VueStripeProvider',
        surface: ['loadStripe.setLoadParameters']
      },
      {
        // A type: re-exported from the package, documented on the provider page.
        name: 'Release train',
        api: "ReleaseTrain ('endive')",
        status: 'covered',
        artifact: 'VueStripeProvider'
      },
      { name: 'Plugin', api: 'createVueStripe()', status: 'covered', artifact: 'createVueStripe' },
      {
        name: 'Elements group',
        api: 'stripe.elements()',
        status: 'covered',
        artifact: 'VueStripeElements',
        // The appearance / locale props are applied with elements.update().
        surface: ['Stripe.elements', 'StripeElements.update']
      },
      { name: 'useStripe', api: 'Stripe instance', status: 'covered', artifact: 'useStripe' },
      {
        name: 'useStripeElements',
        api: 'elements + submit()',
        status: 'covered',
        artifact: 'useStripeElements',
        surface: ['StripeElements.submit']
      },
      {
        name: 'Elements fetchUpdates',
        api: 'elements.fetchUpdates()',
        status: 'covered',
        artifact: 'useStripeElements',
        surface: ['StripeElements.fetchUpdates']
      },
      {
        name: 'Elements getElement',
        api: 'elements.getElement()',
        status: 'covered',
        artifact: 'useStripeElements',
        surface: ['StripeElements.getElement']
      },
      {
        name: 'Elements update-end event',
        api: "elements.on('update-end')",
        status: 'covered',
        artifact: 'VueStripeElements',
        surface: ['StripeElements.on']
      },
      {
        // Every element component (createStripeElement) creates, mounts, listens, updates
        // and destroys its element and exposes focus / blur / clear; the Payment Element
        // stands for all of them. Unmounting the component (v-if) is element.unmount();
        // Vue's `.once` event modifier is element.once().
        name: 'Element lifecycle, events and updates',
        api: 'elements.create() / element.mount() / on() / update() / destroy()',
        status: 'covered',
        artifact: 'VueStripePaymentElement',
        surface: [
          'StripeElements.create',
          'StripeElementBase.mount',
          'StripeElementBase.unmount',
          'StripeElementBase.destroy',
          'StripeElementBase.focus',
          'StripeElementBase.blur',
          'StripeElementBase.clear',
          'StripeElement.on',
          'StripeElement.once',
          'StripeElement.off',
          'StripeElement.update'
        ]
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
        artifact: 'VueStripePaymentElement',
        surface: [
          'StripeElementType.payment',
          'StripeCheckoutElementsSdk.createPaymentElement',
          'StripePaymentElement.collapse'
        ]
      },
      {
        name: 'Express Checkout Element',
        api: "create('expressCheckout')",
        status: 'covered',
        artifact: 'VueStripeExpressCheckoutElement',
        surface: [
          'StripeElementType.expressCheckout',
          'StripeCheckoutElementsSdk.createExpressCheckoutElement'
        ]
      },
      {
        // Removed in Endive; the Express Checkout Element replaces it.
        name: 'Payment Request Button',
        note: 'Removed by Stripe in Endive. Use the Express Checkout Element.',
        api: "create('paymentRequestButton')",
        status: 'deprecated'
      },
      {
        // The API object survives the button element's removal; Stripe recommends
        // the Express Checkout Element for new integrations.
        name: 'Payment Request API',
        api: 'stripe.paymentRequest()',
        status: 'covered',
        artifact: 'usePaymentRequest',
        surface: [
          'Stripe.paymentRequest',
          'PaymentRequest.canMakePayment',
          'PaymentRequest.show',
          'PaymentRequest.abort',
          'PaymentRequest.isShowing',
          'PaymentRequest.update',
          'PaymentRequest.on',
          'PaymentRequest.once',
          'PaymentRequest.off'
        ]
      }
    ]
  },
  {
    group: 'Card Elements',
    items: [
      {
        name: 'Card Element',
        api: "create('card')",
        status: 'covered',
        artifact: 'VueStripeCardElement',
        surface: ['StripeElementType.card']
      },
      {
        name: 'Card Number',
        api: "create('cardNumber')",
        status: 'covered',
        artifact: 'VueStripeCardNumberElement',
        surface: ['StripeElementType.cardNumber']
      },
      {
        name: 'Card Expiry',
        api: "create('cardExpiry')",
        status: 'covered',
        artifact: 'VueStripeCardExpiryElement',
        surface: ['StripeElementType.cardExpiry']
      },
      {
        name: 'Card CVC',
        api: "create('cardCvc')",
        status: 'covered',
        artifact: 'VueStripeCardCvcElement',
        surface: ['StripeElementType.cardCvc']
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
        artifact: 'VueStripeIbanElement',
        surface: ['StripeElementType.iban']
      },
      {
        // Removed in Clover; collect these methods with the Payment Element.
        name: 'iDEAL / P24 / EPS / FPX bank elements',
        note: 'Removed by Stripe in Clover. The Payment Element collects these methods.',
        api: "create('idealBank' | 'p24Bank' | 'epsBank' | 'fpxBank')",
        status: 'deprecated'
      },
      {
        name: 'AU Bank Account',
        api: "create('auBankAccount')",
        status: 'covered',
        artifact: 'VueStripeAuBankAccountElement',
        surface: ['StripeElementType.auBankAccount']
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
        artifact: 'VueStripeAddressElement',
        surface: [
          'StripeElementType.address',
          'StripeCheckoutElementsSdk.createBillingAddressElement',
          'StripeCheckoutElementsSdk.createShippingAddressElement',
          'StripeAddressElement.getValue'
        ]
      },
      {
        name: 'Link Authentication',
        api: "create('linkAuthentication')",
        status: 'covered',
        artifact: 'VueStripeLinkAuthenticationElement',
        surface: ['StripeElementType.linkAuthentication']
      },
      {
        // Superseded by the Address Element in shipping mode.
        name: 'Shipping Address',
        note: 'Superseded by the Address Element in shipping mode.',
        api: "create('shippingAddress')",
        status: 'deprecated',
        surface: ['StripeElementType.shippingAddress']
      },
      {
        name: 'Contact Details',
        api: "checkout.createContactDetailsElement() / create('contactDetails')",
        status: 'covered',
        artifact: 'VueStripeContactDetailsElement',
        surface: [
          'StripeElementType.contactDetails',
          'StripeCheckoutElementsSdk.createContactDetailsElement'
        ]
      },
      {
        // Stripe beta.
        name: 'Link Signup',
        api: "checkout.createLinkSignupElement() / create('linkSignup')",
        status: 'covered',
        artifact: 'VueStripeLinkSignupElement',
        surface: [
          'StripeElementType.linkSignup',
          'StripeCheckoutElementsSdk.createLinkSignupElement'
        ]
      },
      {
        // Stripe beta.
        name: 'Terms',
        api: "checkout.createTermsElement() / create('terms')",
        status: 'covered',
        artifact: 'VueStripeTermsElement',
        surface: ['StripeElementType.terms', 'StripeCheckoutElementsSdk.createTermsElement']
      }
    ]
  },
  {
    group: 'Messaging Elements',
    items: [
      {
        name: 'Payment Method Messaging (BNPL)',
        api: "create('paymentMethodMessaging')",
        status: 'covered',
        artifact: 'VueStripePaymentMethodMessagingElement',
        surface: ['StripeElementType.paymentMethodMessaging']
      },
      {
        // Removed in Clover; use the Payment Method Messaging Element.
        name: 'Affirm Message',
        note: 'Removed by Stripe in Clover. Use the Payment Method Messaging Element.',
        api: "create('affirmMessage')",
        status: 'deprecated'
      },
      {
        name: 'Afterpay/Clearpay Message',
        note: 'Removed by Stripe in Clover. Use the Payment Method Messaging Element.',
        api: "create('afterpayClearpayMessage')",
        status: 'deprecated'
      }
    ]
  },
  {
    group: 'Checkout Session Elements',
    items: [
      // Checkout Form SDK form (Stripe beta); the Currency Selector is created by both SDKs.
      {
        name: 'Checkout Form element',
        api: 'checkoutFormSdk.createForm()',
        status: 'covered',
        artifact: 'VueStripeCheckoutForm',
        surface: [
          'StripeElementType.paymentForm',
          'StripeCheckoutFormSdk.createForm',
          'StripeCheckoutForm.getValue',
          'StripeCheckoutForm.setView'
        ]
      },
      // Checkout Elements SDK elements; Tax ID and Currency Selector also exist on
      // elements.create() behind a Stripe beta.
      {
        name: 'Currency Selector',
        api: "checkout.createCurrencySelectorElement() / create('currencySelector')",
        status: 'covered',
        artifact: 'VueStripeCurrencySelectorElement',
        surface: [
          'StripeElementType.currencySelector',
          'StripeCheckoutElementsSdk.createCurrencySelectorElement',
          'StripeCheckoutFormSdk.createCurrencySelectorElement'
        ]
      },
      {
        name: 'Tax ID',
        api: "checkout.createTaxIdElement() / create('taxId')",
        status: 'covered',
        artifact: 'VueStripeTaxIdElement',
        surface: [
          'StripeElementType.taxId',
          'StripeCheckoutElementsSdk.createTaxIdElement',
          'StripeTaxIdElement.getValue'
        ]
      }
    ]
  },
  {
    group: 'Issuing Elements',
    items: [
      {
        name: 'Card Number Display',
        api: "create('issuingCardNumberDisplay')",
        status: 'covered',
        artifact: 'VueStripeIssuingCardNumberDisplayElement',
        surface: ['StripeElementType.issuingCardNumberDisplay']
      },
      {
        name: 'Card CVC Display',
        api: "create('issuingCardCvcDisplay')",
        status: 'covered',
        artifact: 'VueStripeIssuingCardCvcDisplayElement',
        surface: ['StripeElementType.issuingCardCvcDisplay']
      },
      {
        name: 'Card Expiry Display',
        api: "create('issuingCardExpiryDisplay')",
        status: 'covered',
        artifact: 'VueStripeIssuingCardExpiryDisplayElement',
        surface: ['StripeElementType.issuingCardExpiryDisplay']
      },
      {
        name: 'Card PIN Display',
        api: "create('issuingCardPinDisplay')",
        status: 'covered',
        artifact: 'VueStripeIssuingCardPinDisplayElement',
        surface: ['StripeElementType.issuingCardPinDisplay']
      },
      {
        name: 'Card Copy Button',
        api: "create('issuingCardCopyButton')",
        status: 'covered',
        artifact: 'VueStripeIssuingCardCopyButtonElement',
        surface: ['StripeElementType.issuingCardCopyButton']
      },
      {
        // No typed elements.create() overload in Stripe.js 10.0.0; created by type string.
        name: 'Add to Wallet (Issuing)',
        api: "create('issuingAddToWalletButton')",
        status: 'covered',
        artifact: 'VueStripeIssuingAddToWalletButtonElement',
        surface: ['StripeElementType.issuingAddToWalletButton']
      }
    ]
  },
  {
    // Legal text rendered by Stripe.js (React Stripe.js 7 parity components). The
    // create*Disclosure() methods exist at runtime but not in the 10.0.0 .d.ts; the
    // surface guard allow-lists them.
    group: 'Disclosures',
    items: [
      {
        name: 'Financial Account Disclosure',
        api: 'stripe.createFinancialAccountDisclosure()',
        status: 'covered',
        artifact: 'VueStripeFinancialAccountDisclosure',
        surface: ['Stripe.createFinancialAccountDisclosure']
      },
      {
        name: 'Issuing Disclosure',
        api: 'stripe.createIssuingDisclosure()',
        status: 'covered',
        artifact: 'VueStripeIssuingDisclosure',
        surface: ['Stripe.createIssuingDisclosure']
      },
      {
        name: 'Treasury Disclosure',
        api: 'stripe.createTreasuryDisclosure()',
        status: 'covered',
        artifact: 'VueStripeTreasuryDisclosure',
        surface: ['Stripe.createTreasuryDisclosure']
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
        note: 'Removed by Stripe in Clover. Create the session on your server and redirect to its URL.',
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
        // The component mounts the page and destroys it on unmount; removing the component
        // (v-if) is checkout.unmount(), and a new component mounts a new page.
        name: 'Embedded Checkout',
        api: 'stripe.createEmbeddedCheckoutPage()',
        status: 'covered',
        artifact: 'VueStripeEmbeddedCheckout',
        surface: [
          'Stripe.createEmbeddedCheckoutPage',
          'StripeEmbeddedCheckout.mount',
          'StripeEmbeddedCheckout.unmount',
          'StripeEmbeddedCheckout.destroy'
        ]
      },
      {
        name: 'Elements with Checkout Sessions',
        api: 'stripe.initCheckoutElementsSdk()',
        status: 'covered',
        artifact: 'VueStripeCheckoutElementsProvider',
        surface: [
          'Stripe.initCheckoutElementsSdk',
          'StripeCheckoutElementsSdk.on',
          'StripeCheckoutElementsSdk.loadActions'
        ]
      },
      {
        // The Checkout Form SDK's actions are a subset of these (same type, minus five).
        name: 'Checkout session actions',
        api: 'actions.confirm() / applyPromotionCode() / update*() / changeAppearance()',
        status: 'covered',
        artifact: 'useCheckoutSession',
        surface: [
          'StripeCheckoutLoadActionsSuccess.confirm',
          'StripeCheckoutLoadActionsSuccess.getSession',
          'StripeCheckoutLoadActionsSuccess.applyPromotionCode',
          'StripeCheckoutLoadActionsSuccess.removePromotionCode',
          'StripeCheckoutLoadActionsSuccess.updateEmail',
          'StripeCheckoutLoadActionsSuccess.updatePhoneNumber',
          'StripeCheckoutLoadActionsSuccess.updateBillingAddress',
          'StripeCheckoutLoadActionsSuccess.updateShippingAddress',
          'StripeCheckoutLoadActionsSuccess.updateLineItemQuantity',
          'StripeCheckoutLoadActionsSuccess.updateShippingOption',
          'StripeCheckoutLoadActionsSuccess.updateTaxIdInfo',
          'StripeCheckoutLoadActionsSuccess.runServerUpdate',
          'StripeCheckoutLoadActionsSuccess.validateElements',
          'StripeCheckoutLoadActionsSuccess.addOptionalLineItem',
          'StripeCheckoutLoadActionsSuccess.removeOptionalLineItem',
          'StripeCheckoutElementsSdk.changeAppearance',
          'StripeCheckoutElementsSdk.loadFonts'
        ]
      },
      {
        name: 'Checkout element getters',
        api: 'checkout.getPaymentElement() / get*Element()',
        status: 'covered',
        artifact: 'useCheckoutSession',
        surface: [
          'StripeCheckoutElementsSdk.getPaymentElement',
          'StripeCheckoutElementsSdk.getBillingAddressElement',
          'StripeCheckoutElementsSdk.getShippingAddressElement',
          'StripeCheckoutElementsSdk.getExpressCheckoutElement',
          'StripeCheckoutElementsSdk.getCurrencySelectorElement',
          'StripeCheckoutElementsSdk.getTaxIdElement',
          'StripeCheckoutElementsSdk.getTermsElement',
          'StripeCheckoutElementsSdk.getLinkSignupElement'
        ]
      },
      {
        // Stripe beta: the account needs Checkout Form access.
        name: 'Checkout Form',
        api: 'stripe.initCheckoutFormSdk()',
        status: 'covered',
        artifact: 'VueStripeCheckoutFormProvider',
        surface: [
          'Stripe.initCheckoutFormSdk',
          'StripeCheckoutFormSdk.on',
          'StripeCheckoutFormSdk.loadActions'
        ]
      },
      {
        name: 'Checkout Form SDK methods',
        api: 'checkoutFormSdk.getForm() / changeAppearance() / loadFonts()',
        status: 'covered',
        artifact: 'useCheckoutForm',
        surface: [
          'StripeCheckoutFormSdk.getForm',
          'StripeCheckoutFormSdk.getCurrencySelectorElement',
          'StripeCheckoutFormSdk.changeAppearance',
          'StripeCheckoutFormSdk.loadFonts'
        ]
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
        artifact: 'usePaymentIntent',
        surface: ['Stripe.confirmPayment']
      },
      {
        name: 'Confirm Setup',
        api: 'stripe.confirmSetup()',
        status: 'covered',
        artifact: 'useSetupIntent',
        surface: ['Stripe.confirmSetup']
      },
      {
        name: 'Create Payment Method',
        api: 'stripe.createPaymentMethod()',
        status: 'covered',
        artifact: 'useCreatePaymentMethod',
        surface: ['Stripe.createPaymentMethod']
      },
      {
        name: 'Handle Next Action',
        api: 'stripe.handleNextAction()',
        status: 'covered',
        artifact: 'useHandleNextAction',
        surface: ['Stripe.handleNextAction']
      },
      {
        name: 'Retrieve Payment Intent',
        api: 'stripe.retrievePaymentIntent()',
        status: 'covered',
        artifact: 'usePaymentIntent',
        surface: ['Stripe.retrievePaymentIntent']
      },
      {
        name: 'Retrieve Setup Intent',
        api: 'stripe.retrieveSetupIntent()',
        status: 'covered',
        artifact: 'useSetupIntent',
        surface: ['Stripe.retrieveSetupIntent']
      },
      {
        name: 'Create Token',
        api: 'stripe.createToken()',
        status: 'covered',
        artifact: 'useCreateToken',
        surface: ['Stripe.createToken']
      },
      {
        name: 'Create Confirmation Token',
        api: 'stripe.createConfirmationToken()',
        status: 'covered',
        artifact: 'useCreateConfirmationToken',
        surface: ['Stripe.createConfirmationToken']
      },
      {
        name: 'Handle Card Action',
        api: 'stripe.handleCardAction()',
        status: 'covered',
        artifact: 'useHandleCardAction',
        surface: ['Stripe.handleCardAction']
      },
      {
        name: 'Verify micro-deposits (payment)',
        api: 'stripe.verifyMicrodepositsForPayment()',
        status: 'covered',
        artifact: 'useVerifyMicrodepositsForPayment',
        surface: ['Stripe.verifyMicrodepositsForPayment']
      },
      {
        name: 'Verify micro-deposits (setup)',
        api: 'stripe.verifyMicrodepositsForSetup()',
        status: 'covered',
        artifact: 'useVerifyMicrodepositsForSetup',
        surface: ['Stripe.verifyMicrodepositsForSetup']
      },
      {
        name: 'Radar Session',
        api: 'stripe.createRadarSession()',
        status: 'covered',
        artifact: 'useRadarSession',
        surface: ['Stripe.createRadarSession']
      },
      {
        name: 'Ephemeral Key Nonce (Issuing)',
        api: 'stripe.createEphemeralKeyNonce()',
        status: 'covered',
        artifact: 'useEphemeralKeyNonce',
        surface: ['Stripe.createEphemeralKeyNonce']
      },
      {
        // Stripe discontinued the Orders API; the methods remain in the types.
        name: 'Orders',
        note: 'Stripe discontinued the Orders API; the methods remain in the types only.',
        api: 'stripe.processOrder() / retrieveOrder()',
        status: 'deprecated',
        surface: ['Stripe.processOrder', 'Stripe.retrieveOrder']
      }
    ]
  },
  {
    // One composable per method-specific confirmer (useConfirmCardPayment, ...).
    group: 'Payment method confirmers',
    items: [
      confirmer('ACSS Debit payment', 'confirmAcssDebitPayment'),
      confirmer('ACSS Debit setup', 'confirmAcssDebitSetup'),
      confirmer('Affirm payment', 'confirmAffirmPayment'),
      confirmer('Afterpay / Clearpay payment', 'confirmAfterpayClearpayPayment'),
      confirmer('Alipay payment', 'confirmAlipayPayment'),
      confirmer('Amazon Pay setup', 'confirmAmazonPaySetup'),
      confirmer('AU BECS Debit payment', 'confirmAuBecsDebitPayment'),
      confirmer('AU BECS Debit setup', 'confirmAuBecsDebitSetup'),
      confirmer('Bacs Debit setup', 'confirmBacsDebitSetup'),
      confirmer('Bancontact payment', 'confirmBancontactPayment'),
      confirmer('Bancontact setup', 'confirmBancontactSetup'),
      confirmer(
        'Billie payment',
        'confirmBilliePayment',
        'Stripe beta: needs a betas flag on VueStripeProvider.'
      ),
      confirmer('BLIK payment', 'confirmBlikPayment'),
      confirmer('BLIK setup', 'confirmBlikSetup'),
      confirmer('Boleto payment', 'confirmBoletoPayment'),
      confirmer('Card payment', 'confirmCardPayment'),
      confirmer('Card setup', 'confirmCardSetup'),
      confirmer('Cash App Pay payment', 'confirmCashappPayment'),
      confirmer('Cash App Pay setup', 'confirmCashappSetup'),
      confirmer('Customer balance payment', 'confirmCustomerBalancePayment'),
      confirmer('EPS payment', 'confirmEpsPayment'),
      confirmer('FPX payment', 'confirmFpxPayment'),
      confirmer(
        'giropay payment',
        'confirmGiropayPayment',
        'Deprecated by Stripe: confirming returns payment_method_not_available.'
      ),
      confirmer('GrabPay payment', 'confirmGrabPayPayment'),
      confirmer('iDEAL payment', 'confirmIdealPayment'),
      confirmer('iDEAL setup', 'confirmIdealSetup'),
      confirmer('Klarna payment', 'confirmKlarnaPayment'),
      confirmer('Konbini payment', 'confirmKonbiniPayment'),
      confirmer('MobilePay payment', 'confirmMobilepayPayment'),
      confirmer('Multibanco payment', 'confirmMultibancoPayment'),
      confirmer('OXXO payment', 'confirmOxxoPayment'),
      confirmer('Przelewy24 payment', 'confirmP24Payment'),
      confirmer('Pay by Bank payment', 'confirmPayByBankPayment'),
      confirmer('PayNow payment', 'confirmPayNowPayment'),
      confirmer('PayPal payment', 'confirmPayPalPayment'),
      confirmer('PayPal setup', 'confirmPayPalSetup'),
      confirmer('Pix payment', 'confirmPixPayment'),
      confirmer('PromptPay payment', 'confirmPromptPayPayment'),
      confirmer('SEPA Debit payment', 'confirmSepaDebitPayment'),
      confirmer('SEPA Debit setup', 'confirmSepaDebitSetup'),
      confirmer(
        'Sofort payment',
        'confirmSofortPayment',
        'Deprecated by Stripe: confirming returns payment_method_not_available.'
      ),
      confirmer(
        'Sofort setup',
        'confirmSofortSetup',
        'Deprecated by Stripe, though a sandbox still redirected in October 2026.'
      ),
      confirmer('TWINT payment', 'confirmTwintPayment'),
      confirmer('US bank account payment', 'confirmUsBankAccountPayment'),
      confirmer('US bank account setup', 'confirmUsBankAccountSetup'),
      confirmer('WeChat Pay payment', 'confirmWechatPayPayment')
    ]
  },
  {
    group: 'Advanced',
    items: [
      {
        name: 'Financial Connections',
        api: 'stripe.collectFinancialConnectionsAccounts()',
        status: 'covered',
        artifact: 'useFinancialConnections',
        surface: ['Stripe.collectFinancialConnectionsAccounts']
      },
      {
        name: 'Identity Verification',
        api: 'stripe.verifyIdentity()',
        status: 'covered',
        artifact: 'useIdentity',
        surface: ['Stripe.verifyIdentity']
      },
      {
        name: 'Bank Account Collection / Token',
        api: 'stripe.collectBankAccountForPayment/Setup(), collectBankAccountToken()',
        status: 'covered',
        artifact: 'useFinancialConnections',
        surface: [
          'Stripe.collectBankAccountForPayment',
          'Stripe.collectBankAccountForSetup',
          'Stripe.collectBankAccountToken'
        ]
      }
    ]
  }
]
