import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue-demi'
import VueStripeContactDetailsElement from '../../src/components/VueStripeContactDetailsElement'
import { flushPromises } from '../setup'
import { mountLeaf } from './checkout-session-elements.helpers'

describe('VueStripeContactDetailsElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates via checkout.createContactDetailsElement() inside the Checkout provider', async () => {
    const { checkout, element, wrapper } = await mountLeaf(VueStripeContactDetailsElement, {
      options: { defaultValues: { email: 'jenny@example.com' } }
    })
    // The Checkout SDK creator takes no options (StripeCheckoutContactDetailsElementOptions).
    expect(checkout.createContactDetailsElement).toHaveBeenCalledWith()
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect(
      wrapper
        .find('.vue-stripe-contact-details-element .vue-stripe-contact-details-element-mount')
        .exists()
    ).toBe(true)
  })

  it('creates via elements.create("contactDetails") inside VueStripeElements', async () => {
    const options = { defaultValues: { email: 'jenny@example.com' } }
    const { elements, checkout } = await mountLeaf(VueStripeContactDetailsElement, {
      context: 'elements',
      options
    })
    expect(elements.create).toHaveBeenCalledWith('contactDetails', options)
    expect(checkout.createContactDetailsElement).not.toHaveBeenCalled()
  })

  it('attaches the Stripe.js 10 Contact Details events', async () => {
    const { element } = await mountLeaf(VueStripeContactDetailsElement)
    expect(element.on.mock.calls.map((call) => call[0])).toEqual([
      'ready',
      'change',
      'focus',
      'blur',
      'escape',
      'loaderstart',
      'loaderror'
    ])
  })

  it('re-emits change with the Stripe event', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeContactDetailsElement)
    const event = {
      elementType: 'contactDetails',
      empty: false,
      complete: true,
      value: { email: 'jenny@example.com' }
    }
    handler('change')(event)
    await nextTick()
    expect(wrapper.findComponent(VueStripeContactDetailsElement).emitted('change')).toEqual([
      [event]
    ])
  })

  it('sets loading from loaderstart/ready and error from loaderror', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeContactDetailsElement)
    handler('loaderstart')({ elementType: 'contactDetails' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-contact-details-element-loader').exists()).toBe(true)
    handler('ready')({ elementType: 'contactDetails' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-contact-details-element-loader').exists()).toBe(false)
    handler('loaderror')({ elementType: 'contactDetails', error: { message: 'Failed to load' } })
    await nextTick()
    expect(wrapper.text()).toContain('Failed to load')
  })

  it('detaches handlers and destroys on unmount', async () => {
    const { element, show } = await mountLeaf(VueStripeContactDetailsElement)
    show.value = false
    await flushPromises()
    expect(element.off).toHaveBeenCalledTimes(7)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })
})
