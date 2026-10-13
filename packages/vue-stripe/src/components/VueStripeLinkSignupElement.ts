import type { StripeLinkSignupElement, StripeLinkSignupElementOptions } from '@stripe/stripe-js'
import type { ElementTypeEvent, LoadErrorEvent, LoadStartEvent } from '../utils/element-factory'
import { createStripeElement, pick } from '../utils/element-factory'

type LinkSignupEvents = {
  ready: [element: StripeLinkSignupElement]
  focus: ElementTypeEvent<'linkSignup'>
  blur: ElementTypeEvent<'linkSignup'>
  escape: ElementTypeEvent<'linkSignup'>
  loaderstart: LoadStartEvent<'linkSignup'>
  loaderror: LoadErrorEvent<'linkSignup'>
}

/**
 * Link Signup Element (Stripe beta): offers to save the customer's details to Link.
 * Use within `<VueStripeCheckoutElementsProvider>` (`checkout.createLinkSignupElement()`) or
 * within `<VueStripeElements>` (`elements.create('linkSignup')`); both need Stripe beta access.
 * It has no `change` event.
 */
export default /* @__PURE__ */ createStripeElement<
  StripeLinkSignupElementOptions,
  StripeLinkSignupElement,
  Record<never, never>,
  LinkSignupEvents
>({
  elementType: 'linkSignup',
  componentName: 'VueStripeLinkSignupElement',
  events: ['ready', 'focus', 'blur', 'escape', 'loaderstart', 'loaderror'],
  checkout: (sdk, options) => sdk.createLinkSignupElement(pick(options, ['defaultValues'])),
  className: 'vue-stripe-link-signup-element',
  loadingText: 'Loading Link signup...'
})
