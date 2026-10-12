import { createStripeElement } from '../utils/element-factory'

/** Split card cardCvc input. Use within `<VueStripeElements>` next to the other split card elements. */
export default createStripeElement({
  elementType: 'cardCvc',
  componentName: 'VueStripeCardCvcElement'
})
