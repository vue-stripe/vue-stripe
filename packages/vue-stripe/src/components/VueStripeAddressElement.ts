import type {
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions
} from '@stripe/stripe-js'
import type { BaseElementEvents, LoadStartEvent, LoadErrorEvent } from '../utils/element-factory'
import { BASE_EVENTS, createStripeElement, pick } from '../utils/element-factory'

type AddressEvents = BaseElementEvents<StripeAddressElement, StripeAddressElementChangeEvent> & {
  loaderstart: LoadStartEvent<'address'>
  loaderror: LoadErrorEvent<'address'>
}

/**
 * Shipping or billing address form (`options.mode`, default `'shipping'`).
 * Works within `<VueStripeElements>` and `<VueStripeCheckoutElementsProvider>`; Checkout
 * Sessions accept only `contacts`, `display` and `fields`, and `mode` picks the billing or
 * shipping element.
 */
export default createStripeElement<
  StripeAddressElementOptions,
  StripeAddressElement,
  { getValue: StripeAddressElement['getValue'] },
  AddressEvents
>({
  elementType: 'address',
  componentName: 'VueStripeAddressElement',
  events: [...BASE_EVENTS, 'loaderstart', 'loaderror'],
  defaultOptions: () => ({ mode: 'shipping' }),
  checkout: (sdk, options) => {
    const checkoutOptions = pick(options, ['contacts', 'display', 'fields'])
    const element =
      options['mode'] === 'billing'
        ? sdk.createBillingAddressElement(checkoutOptions)
        : sdk.createShippingAddressElement(checkoutOptions)
    return element
  },
  // Since Stripe.js Dahlia `state` is Latin by default; pass { format: 'localized' } for the old form.
  expose: (element) => ({
    getValue: (options?: { format?: 'localized' | 'latin' }) =>
      options ? element.value?.getValue?.(options) : element.value?.getValue?.()
  }),
  loadingText: 'Loading address form...'
})
