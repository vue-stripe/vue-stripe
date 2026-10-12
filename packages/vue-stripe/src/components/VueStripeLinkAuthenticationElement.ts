import type {
  StripeLinkAuthenticationElement,
  StripeLinkAuthenticationElementChangeEvent,
  StripeLinkAuthenticationElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents, LoadStartEvent, LoadErrorEvent } from '../utils/element-factory'
import { BASE_EVENTS, createStripeElement } from '../utils/element-factory'

type LinkAuthenticationEvents = BaseElementEvents<
  StripeLinkAuthenticationElement,
  StripeLinkAuthenticationElementChangeEvent
> & {
  loaderstart: LoadStartEvent<'linkAuthentication'>
  loaderror: LoadErrorEvent<'linkAuthentication'>
}

/** Email input that authenticates returning Link customers. Use within `<VueStripeElements>`. */
export default /* @__PURE__ */ createStripeElement<
  StripeLinkAuthenticationElementOptions,
  StripeLinkAuthenticationElement,
  Record<never, never>,
  LinkAuthenticationEvents
>({
  elementType: 'linkAuthentication',
  componentName: 'VueStripeLinkAuthenticationElement',
  events: [...BASE_EVENTS, 'loaderstart', 'loaderror'],
  className: 'vue-stripe-link-auth',
  loadingText: 'Loading...'
})
