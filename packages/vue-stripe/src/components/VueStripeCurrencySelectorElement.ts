import type { StripeCurrencySelectorElement } from '@stripe/stripe-js'
import type { ElementTypeEvent, LoadErrorEvent } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type CurrencySelectorEvents = {
  ready: [element: StripeCurrencySelectorElement]
  focus: ElementTypeEvent<'currencySelector'>
  blur: ElementTypeEvent<'currencySelector'>
  escape: ElementTypeEvent<'currencySelector'>
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
  // Stripe.js logs an uncaught TypeError when the selector is created before the Checkout
  // Form; a selector placed above VueStripeCheckoutForm waits for it (#667).
  createLast: true,
  className: 'vue-stripe-currency-selector-element',
  loadingText: 'Loading currency selector...'
})
