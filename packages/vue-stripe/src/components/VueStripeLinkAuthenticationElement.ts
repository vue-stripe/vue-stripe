import { BASE_EVENTS, createStripeElement } from '../utils/element-factory'

/** Email input that authenticates returning Link customers. Use within `<VueStripeElements>`. */
export default createStripeElement({
  elementType: 'linkAuthentication',
  componentName: 'VueStripeLinkAuthenticationElement',
  events: [...BASE_EVENTS, 'loaderstart', 'loaderror'],
  className: 'vue-stripe-link-auth',
  loadingText: 'Loading...'
})
