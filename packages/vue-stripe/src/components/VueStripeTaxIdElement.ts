import type {
  StripeTaxIdElement,
  StripeTaxIdElementChangeEvent,
  StripeTaxIdElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents, LoadStartEvent, LoadErrorEvent } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type TaxIdEvents = BaseElementEvents<StripeTaxIdElement, StripeTaxIdElementChangeEvent> & {
  loaderstart: LoadStartEvent<'taxId'>
  loaderror: LoadErrorEvent<'taxId'>
}

/**
 * Tax ID Element: collects a business name and tax ID for Checkout Sessions.
 * Use within `<VueStripeCheckoutElementsProvider>` (needs the Tax ID beta header:
 * pass `betas` on `<VueStripeProvider>`), or within `<VueStripeElements>` with Stripe beta access.
 * @see https://docs.stripe.com/tax/advanced/tax-ids?payment-ui=embedded-components
 */
export default /* @__PURE__ */ createStripeElement<
  StripeTaxIdElementOptions,
  StripeTaxIdElement,
  { getValue: StripeTaxIdElement['getValue'] },
  TaxIdEvents
>({
  elementType: 'taxId',
  componentName: 'VueStripeTaxIdElement',
  events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderstart', 'loaderror'],
  checkout: (sdk, options) => sdk.createTaxIdElement(options),
  expose: (element) => ({ getValue: () => element.value?.getValue?.() }),
  className: 'vue-stripe-tax-id-element',
  loadingText: 'Loading tax ID form...'
})
