import type { StripeCurrencySelectorElement } from '@stripe/stripe-js'
import type { LoadErrorEvent } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type CurrencySelectorEvents = {
  ready: [element: StripeCurrencySelectorElement]
  focus: []
  blur: []
  escape: []
  loaderror: LoadErrorEvent<'currencySelector'>
}

/**
 * Currency Selector Element: lets customers pay in their local currency (Adaptive Pricing).
 * Use within `<VueStripeCheckoutElementsProvider>` or `<VueStripeCheckoutFormProvider>`.
 * Stripe.js only creates it on the Checkout SDKs; inside `<VueStripeElements>` alone it
 * reports that through `@loaderror` and `#error`. It has no `change` event: the chosen
 * currency arrives on the session (`useCheckoutSession().session.value.currency`).
 */
export default /* @__PURE__ */ createStripeElement<
  Record<string, never>,
  StripeCurrencySelectorElement,
  Record<never, never>,
  CurrencySelectorEvents
>({
  elementType: 'currencySelector',
  componentName: 'VueStripeCurrencySelectorElement',
  events: ['ready', 'focus', 'blur', 'escape', 'loaderror'],
  // elements.create('currencySelector') fails asynchronously in Stripe.js ("cannot be
  // created without using Custom Checkout"), leaving the loader up; never call it.
  elements: false,
  checkout: (sdk) => sdk.createCurrencySelectorElement(),
  checkoutForm: (sdk) => sdk.createCurrencySelectorElement(),
  className: 'vue-stripe-currency-selector-element',
  loadingText: 'Loading currency selector...'
})
