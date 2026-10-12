import { createStripeElement } from '../utils/element-factory'

/** Split card cardNumber input. Use within `<VueStripeElements>` next to the other split card elements. */
export default createStripeElement({
  elementType: 'cardNumber',
  componentName: 'VueStripeCardNumberElement'
})
