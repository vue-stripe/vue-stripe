import type {
  StripeCardExpiryElement,
  StripeCardExpiryElementChangeEvent,
  StripeCardExpiryElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type CardExpiryEvents = BaseElementEvents<
  StripeCardExpiryElement,
  StripeCardExpiryElementChangeEvent
>

/** Split card cardExpiry input. Use within `<VueStripeElements>` next to the other split card elements. */
export default /* @__PURE__ */ createStripeElement<
  StripeCardExpiryElementOptions,
  StripeCardExpiryElement,
  Record<never, never>,
  CardExpiryEvents
>({
  elementType: 'cardExpiry',
  componentName: 'VueStripeCardExpiryElement',
  loadingText: 'Loading card expiry...'
})
