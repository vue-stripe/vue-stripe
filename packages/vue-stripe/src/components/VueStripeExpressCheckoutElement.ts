import { createStripeElement, pick } from '../utils/element-factory'

/**
 * Express Checkout Element (Apple Pay, Google Pay, Link, PayPal, ...). Works within
 * `<VueStripeElements>` and `<VueStripeCheckoutElementsProvider>`. Under Checkout Sessions
 * the `click`, `shippingaddresschange` and `shippingratechange` events never fire.
 */
export default createStripeElement({
  elementType: 'expressCheckout',
  componentName: 'VueStripeExpressCheckoutElement',
  events: [
    'ready',
    'click',
    'confirm',
    'cancel',
    'focus',
    'blur',
    'escape',
    'shippingaddresschange',
    'shippingratechange',
    'availablepaymentmethodschange',
    'loaderror'
  ],
  className: 'vue-stripe-express-checkout-element',
  // `ready` carries availablePaymentMethods, which wallet UIs need.
  readyPayload: 'event',
  checkout: (sdk, options) =>
    sdk.createExpressCheckoutElement(
      pick(options, [
        'buttonHeight',
        'buttonTheme',
        'buttonType',
        'layout',
        'paymentMethods',
        'paymentMethodOrder'
      ]) as never
    ),
  loadingText: 'Loading express checkout...'
})
