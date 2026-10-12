import type {
  StripeAuBankAccountElement,
  StripeAuBankAccountElementChangeEvent,
  StripeAuBankAccountElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type AuBankAccountEvents = BaseElementEvents<
  StripeAuBankAccountElement,
  StripeAuBankAccountElementChangeEvent
>

/** Australian bank account (BSB + account number) for BECS Direct Debit. Use within `<VueStripeElements>`. */
export default /* @__PURE__ */ createStripeElement<
  StripeAuBankAccountElementOptions,
  StripeAuBankAccountElement,
  Record<never, never>,
  AuBankAccountEvents
>({
  elementType: 'auBankAccount',
  componentName: 'VueStripeAuBankAccountElement',
  className: 'vue-stripe-au-bank-account-element',
  loadingText: 'Loading BECS Direct Debit form...'
})
