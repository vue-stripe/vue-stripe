import type {
  StripePaymentElement,
  StripePaymentElementAvailablePaymentMethodsChangeEvent,
  StripePaymentElementCardDetailsChangeEvent,
  StripePaymentElementChangeEvent,
  StripePaymentElementOptions,
  StripePaymentElementSavedPaymentMethodRemoveEvent,
  StripePaymentElementSavedPaymentMethodUpdateEvent
} from '@stripe/stripe-js'
import type { BaseElementEvents, LoadStartEvent, LoadErrorEvent } from '../utils/element-factory'
import { BASE_EVENTS, createStripeElement, pick } from '../utils/element-factory'

type PaymentEvents = BaseElementEvents<StripePaymentElement, StripePaymentElementChangeEvent> & {
  loaderstart: LoadStartEvent<'payment'>
  loaderror: LoadErrorEvent<'payment'>
  availablepaymentmethodschange: [event: StripePaymentElementAvailablePaymentMethodsChangeEvent]
  carddetailschange: [event: StripePaymentElementCardDetailsChangeEvent]
  savedpaymentmethodupdate: [event: StripePaymentElementSavedPaymentMethodUpdateEvent]
  savedpaymentmethodremove: [event: StripePaymentElementSavedPaymentMethodRemoveEvent]
}

/**
 * Payment Element: every payment method in one UI. Works within `<VueStripeElements>`
 * and `<VueStripeCheckoutElementsProvider>` (Checkout Sessions accept a subset of options).
 */
export default /* @__PURE__ */ createStripeElement<
  StripePaymentElementOptions,
  StripePaymentElement,
  { collapse: () => void },
  PaymentEvents
>({
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
