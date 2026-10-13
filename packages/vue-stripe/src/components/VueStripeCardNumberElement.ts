import type {
  StripeCardNumberElement,
  StripeCardNumberElementChangeEvent,
  StripeCardNumberElementOptions
} from '@stripe/stripe-js'
import type {
  BaseElementEvents,
  CreateOnly,
  LoadErrorEvent,
  NetworksChangeEvent
} from '../utils/element-factory'
import { BASE_EVENTS, createStripeElement } from '../utils/element-factory'

type CardNumberEvents = BaseElementEvents<
  StripeCardNumberElement,
  StripeCardNumberElementChangeEvent
> & {
  networkschange: NetworksChangeEvent<'cardNumber'>
  loaderror: LoadErrorEvent<'cardNumber'>
}

/** Split card cardNumber input. Use within `<VueStripeElements>` next to the other split card elements. */
export default /* @__PURE__ */ createStripeElement<
  StripeCardNumberElementOptions,
  StripeCardNumberElement,
  Record<never, never>,
  CardNumberEvents
>({
  elementType: 'cardNumber',
  componentName: 'VueStripeCardNumberElement',
  events: [...BASE_EVENTS, 'networkschange', 'loaderror'],
  createOnly: { disableLink: true, preferredNetwork: true } satisfies CreateOnly<
    StripeCardNumberElementOptions,
    StripeCardNumberElement
  >,
  loadingText: 'Loading card number...'
})
