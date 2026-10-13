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
 * the `click`, `shippingaddresschange` and `shippingratechange` events never fire. Those
 * three are passed to Stripe only when you listen for them; a listener must call
 * `event.resolve()` (or `reject()`).
 */
export default /* @__PURE__ */ createStripeElement<
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElement,
  Record<never, never>,
  ExpressCheckoutEvents,
  // Stripe.js throws an IntegrationError on clear(); calling it is a type error.
  'clear'
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
  // Once these have a handler, Stripe waits for it to call resolve() (1 s for click, 20 s
  // for the shipping events), so they are only subscribed when the app listens.
  listenerOnlyEvents: ['click', 'shippingaddresschange', 'shippingratechange'],
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
  loadingText: 'Loading express checkout...',
  // Replaces the shared clear(), which would make Stripe.js throw.
  expose: () => ({
    clear: () => {
      console.warn('[Vue Stripe] clear() is not supported by the Express Checkout Element')
    }
  })
})
