import { describe, it, expect } from 'vitest'
import VueStripeCardNumberElement from '../../src/components/VueStripeCardNumberElement'
import VueStripeCardExpiryElement from '../../src/components/VueStripeCardExpiryElement'
import VueStripeCardCvcElement from '../../src/components/VueStripeCardCvcElement'
import VueStripePaymentMethodMessagingElement from '../../src/components/VueStripePaymentMethodMessagingElement'
import { mountLeaf } from './checkout-session-elements.helpers'

// The generated default ("Loading <elementType>...") leaks camelCase type names.
describe('default loading text', () => {
  it.each([
    ['VueStripeCardNumberElement', VueStripeCardNumberElement, 'Loading card number...'],
    ['VueStripeCardExpiryElement', VueStripeCardExpiryElement, 'Loading card expiry...'],
    ['VueStripeCardCvcElement', VueStripeCardCvcElement, 'Loading card CVC...'],
    [
      'VueStripePaymentMethodMessagingElement',
      VueStripePaymentMethodMessagingElement,
      'Loading payment method messaging...'
    ]
  ])('%s shows readable text', async (_name, component, text) => {
    const { wrapper } = await mountLeaf(component, { context: 'elements' })
    expect(wrapper.find('.vue-stripe-element-loader').text()).toBe(text)
  })
})
