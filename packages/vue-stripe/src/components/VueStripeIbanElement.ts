import { createStripeElement } from '../utils/element-factory'

/** IBAN input for SEPA Direct Debit. Use within `<VueStripeElements>`. */
export default createStripeElement({
  elementType: 'iban',
  componentName: 'VueStripeIbanElement',
  defaultOptions: () => ({ supportedCountries: ['SEPA'] }),
  loadingText: 'Loading IBAN form...'
})
