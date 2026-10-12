import { BASE_EVENTS, createStripeElement, pick } from '../utils/element-factory'

/**
 * Payment Element: every payment method in one UI. Works within `<VueStripeElements>`
 * and `<VueStripeCheckoutElementsProvider>` (Checkout Sessions accept a subset of options).
 */
export default createStripeElement({
  elementType: 'payment',
  componentName: 'VueStripePaymentElement',
  // Stripe.js 10 union. There is no `loaderstop` event (the v5 component listened for one).
  events: [
    ...BASE_EVENTS,
    'loaderstart',
    'loaderror',
    'availablepaymentmethodschange',
    'carddetailschange',
    'savedpaymentmethodupdate',
    'savedpaymentmethodremove'
  ],
  checkout: (sdk, options) =>
    sdk.createPaymentElement(
      pick(options, [
        'layout',
        'paymentMethodOrder',
        'readOnly',
        'terms',
        'fields',
        'wallets',
        'walletOptions'
      ])
    ),
  expose: (element) => ({
    collapse: () => (element.value as { collapse?: () => void } | null)?.collapse?.()
  }),
  loadingText: 'Loading payment form...'
})
