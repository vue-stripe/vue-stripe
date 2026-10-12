import { createStripeElement } from '../utils/element-factory'

/**
 * Currency Selector Element: lets customers pay in their local currency (Adaptive Pricing).
 * Use within `<VueStripeCheckoutElementsProvider>`, or within `<VueStripeElements>` with
 * Stripe beta access. It has no `change` event: the chosen currency arrives on the session
 * (`useCheckoutSession().session.value.currency`).
 */
export default createStripeElement({
  elementType: 'currencySelector',
  componentName: 'VueStripeCurrencySelectorElement',
  events: ['ready', 'focus', 'blur', 'escape', 'loaderror'],
  checkout: (sdk) => sdk.createCurrencySelectorElement(),
  className: 'vue-stripe-currency-selector-element',
  loadingText: 'Loading currency selector...'
})
