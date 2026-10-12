import { createStripeElement } from '../utils/element-factory'

/** Split card cardExpiry input. Use within `<VueStripeElements>` next to the other split card elements. */
export default createStripeElement({
  elementType: 'cardExpiry',
  componentName: 'VueStripeCardExpiryElement'
})
