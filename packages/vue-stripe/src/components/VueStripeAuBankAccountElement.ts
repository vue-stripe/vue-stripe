import { createStripeElement } from '../utils/element-factory'

/** Australian bank account (BSB + account number) for BECS Direct Debit. Use within `<VueStripeElements>`. */
export default createStripeElement({
  elementType: 'auBankAccount',
  componentName: 'VueStripeAuBankAccountElement',
  className: 'vue-stripe-au-bank-account-element',
  loadingText: 'Loading BECS Direct Debit form...'
})
