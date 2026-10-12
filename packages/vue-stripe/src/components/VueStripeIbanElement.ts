import type {
  StripeIbanElement,
  StripeIbanElementChangeEvent,
  StripeIbanElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type IbanEvents = BaseElementEvents<StripeIbanElement, StripeIbanElementChangeEvent>

/** IBAN input for SEPA Direct Debit. Use within `<VueStripeElements>`. */
export default createStripeElement<
  StripeIbanElementOptions,
  StripeIbanElement,
  Record<never, never>,
  IbanEvents
>({
  elementType: 'iban',
  componentName: 'VueStripeIbanElement',
  defaultOptions: () => ({ supportedCountries: ['SEPA'] }),
  loadingText: 'Loading IBAN form...'
})
