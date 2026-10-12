import type {
  StripeExpressCheckoutElement,
  StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent
} from '@stripe/stripe-js'
import type { LoadErrorEvent } from '../utils/element-factory'
import { createStripeElement, pick } from '../utils/element-factory'

type ExpressCheckoutEvents = {
  ready: [event: StripeExpressCheckoutElementReadyEvent]
  click: [event: StripeExpressCheckoutElementClickEvent]
  confirm: [event: StripeExpressCheckoutElementConfirmEvent]
  cancel: [event: { elementType: 'expressCheckout' }]
  focus: []
  blur: []
  escape: []
  shippingaddresschange: [event: StripeExpressCheckoutElementShippingAddressChangeEvent]
  shippingratechange: [event: StripeExpressCheckoutElementShippingRateChangeEvent]
  availablepaymentmethodschange: [
    event: StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent
  ]
  loaderror: LoadErrorEvent<'expressCheckout'>
}

/**
 * Express Checkout Element (Apple Pay, Google Pay, Link, PayPal, ...). Works within
 * `<VueStripeElements>` and `<VueStripeCheckoutElementsProvider>`. Under Checkout Sessions
 * the `click`, `shippingaddresschange` and `shippingratechange` events never fire.
 */
export default createStripeElement<
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElement,
  Record<never, never>,
  ExpressCheckoutEvents
>({
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
