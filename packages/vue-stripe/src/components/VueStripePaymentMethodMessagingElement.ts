import type {
  StripePaymentMethodMessagingElement,
  StripePaymentMethodMessagingElementOptions
} from '@stripe/stripe-js'
import { createStripeElement } from '../utils/element-factory'

type PaymentMethodMessagingEvents = { ready: [element: StripePaymentMethodMessagingElement] }

/**
 * Payment Method Messaging Element: promotional BNPL messaging (Affirm, Klarna,
 * Afterpay/Clearpay) for the order amount. Display-only; use within `<VueStripeElements>`, e.g.
 * `:options="{ amount: 1099, currency: 'usd', paymentMethodTypes: ['klarna'], countryCode: 'US' }"`.
 * @see https://docs.stripe.com/js/element/payment_method_messaging_element
 */
export default /* @__PURE__ */ createStripeElement<
  StripePaymentMethodMessagingElementOptions,
  StripePaymentMethodMessagingElement,
  Record<never, never>,
  PaymentMethodMessagingEvents
>({
  elementType: 'paymentMethodMessaging',
  componentName: 'VueStripePaymentMethodMessagingElement',
  events: ['ready']
})
