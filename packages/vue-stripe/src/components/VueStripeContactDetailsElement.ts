import type {
  StripeContactDetailsElement,
  StripeContactDetailsElementChangeEvent,
  StripeContactDetailsElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents, LoadStartEvent, LoadErrorEvent } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type ContactDetailsEvents = BaseElementEvents<
  StripeContactDetailsElement,
  StripeContactDetailsElementChangeEvent
> & {
  loaderstart: LoadStartEvent<'contactDetails'>
  loaderror: LoadErrorEvent<'contactDetails'>
}

/**
 * Contact Details Element: collects the customer's email.
 * Use within `<VueStripeCheckoutElementsProvider>` (`checkout.createContactDetailsElement()`,
 * which takes no options) or within `<VueStripeElements>` (`elements.create('contactDetails')`).
 */
export default /* @__PURE__ */ createStripeElement<
  StripeContactDetailsElementOptions,
  StripeContactDetailsElement,
  Record<never, never>,
  ContactDetailsEvents
>({
  elementType: 'contactDetails',
  componentName: 'VueStripeContactDetailsElement',
  events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderstart', 'loaderror'],
  checkout: (sdk) => sdk.createContactDetailsElement(),
  className: 'vue-stripe-contact-details-element',
  loadingText: 'Loading contact details...'
})
