import type {
  StripeCardNumberElement,
  StripeCardNumberElementChangeEvent,
  StripeCardNumberElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type CardNumberEvents = BaseElementEvents<
  StripeCardNumberElement,
  StripeCardNumberElementChangeEvent
>

/** Split card cardNumber input. Use within `<VueStripeElements>` next to the other split card elements. */
export default /* @__PURE__ */ createStripeElement<
  StripeCardNumberElementOptions,
  StripeCardNumberElement,
  Record<never, never>,
  CardNumberEvents
>({
  elementType: 'cardNumber',
  componentName: 'VueStripeCardNumberElement',
  loadingText: 'Loading card number...'
})
