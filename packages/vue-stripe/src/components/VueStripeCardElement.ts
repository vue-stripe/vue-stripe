import type {
  StripeCardElement,
  StripeCardElementChangeEvent,
  StripeCardElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents, CreateOnly, LoadErrorEvent } from '../utils/element-factory'
import { BASE_EVENTS, createStripeElement } from '../utils/element-factory'

type CardEvents = BaseElementEvents<StripeCardElement, StripeCardElementChangeEvent> & {
  networkschange: [event: { elementType: 'card' }]
  loaderror: LoadErrorEvent<'card'>
}

/** Single-line card input (number, expiry, CVC, postal code). Use within `<VueStripeElements>`. */
export default /* @__PURE__ */ createStripeElement<
  StripeCardElementOptions,
  StripeCardElement,
  Record<never, never>,
  CardEvents
>({
  elementType: 'card',
  componentName: 'VueStripeCardElement',
  events: [...BASE_EVENTS, 'networkschange', 'loaderror'],
  createOnly: { disableLink: true, preferredNetwork: true } satisfies CreateOnly<
    StripeCardElementOptions,
    StripeCardElement
  >,
  loadingText: 'Loading card form...'
})
