import { BASE_EVENTS, createStripeElement } from '../utils/element-factory'

/** Single-line card input (number, expiry, CVC, postal code). Use within `<VueStripeElements>`. */
export default createStripeElement({
  elementType: 'card',
  componentName: 'VueStripeCardElement',
  events: [...BASE_EVENTS, 'networkschange', 'loaderror'],
  loadingText: 'Loading card form...'
})
