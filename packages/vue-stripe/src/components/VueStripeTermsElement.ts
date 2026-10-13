import type { StripeTermsElement, StripeTermsElementOptions } from '@stripe/stripe-js'
import type { ElementTypeEvent, LoadErrorEvent, LoadStartEvent } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type TermsEvents = {
  ready: [element: StripeTermsElement]
  focus: ElementTypeEvent<'terms'>
  blur: ElementTypeEvent<'terms'>
  escape: ElementTypeEvent<'terms'>
  loaderstart: LoadStartEvent<'terms'>
  loaderror: LoadErrorEvent<'terms'>
}

/**
 * Terms Element (Stripe beta): shows the terms the customer accepts by paying.
 * Use within `<VueStripeCheckoutElementsProvider>` (`checkout.createTermsElement()`) or within
 * `<VueStripeElements>` (`elements.create('terms')`); both need Stripe beta access.
 * It has no `change` event.
 */
export default /* @__PURE__ */ createStripeElement<
  StripeTermsElementOptions,
  StripeTermsElement,
  Record<never, never>,
  TermsEvents
>({
  elementType: 'terms',
  componentName: 'VueStripeTermsElement',
  events: ['ready', 'focus', 'blur', 'escape', 'loaderstart', 'loaderror'],
  checkout: (sdk) => sdk.createTermsElement(),
  className: 'vue-stripe-terms-element',
  loadingText: 'Loading terms...'
})
