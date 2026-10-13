import type {
  StripeCardCvcElement,
  StripeCardCvcElementChangeEvent,
  StripeCardCvcElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type CardCvcEvents = BaseElementEvents<StripeCardCvcElement, StripeCardCvcElementChangeEvent>

/** Split card cardCvc input. Use within `<VueStripeElements>` next to the other split card elements. */
export default /* @__PURE__ */ createStripeElement<
  StripeCardCvcElementOptions,
  StripeCardCvcElement,
  Record<never, never>,
  CardCvcEvents
>({
  elementType: 'cardCvc',
  componentName: 'VueStripeCardCvcElement',
  loadingText: 'Loading card CVC...'
})
