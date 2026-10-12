import { BASE_EVENTS, createStripeElement } from '../utils/element-factory'

/**
 * Tax ID Element: collects a business name and tax ID for Checkout Sessions.
 * Use within `<VueStripeCheckoutElementsProvider>` (needs the Tax ID beta header:
 * pass `betas` on `<VueStripeProvider>`), or within `<VueStripeElements>` with Stripe beta access.
 * @see https://docs.stripe.com/tax/advanced/tax-ids?payment-ui=embedded-components
 */
export default createStripeElement({
  elementType: 'taxId',
  componentName: 'VueStripeTaxIdElement',
  events: [...BASE_EVENTS, 'loaderstart', 'loaderror'],
  checkout: (sdk, options) => sdk.createTaxIdElement(options),
  expose: (element) => ({ getValue: () => element.value?.getValue?.() }),
  className: 'vue-stripe-tax-id-element',
  loadingText: 'Loading tax ID form...'
})
