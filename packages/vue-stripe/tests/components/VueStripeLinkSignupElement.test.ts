import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue-demi'
import VueStripeLinkSignupElement from '../../src/components/VueStripeLinkSignupElement'
import { flushPromises } from '../setup'
import { mountLeaf } from './checkout-session-elements.helpers'

describe('VueStripeLinkSignupElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates via checkout.createLinkSignupElement(options) inside the Checkout provider', async () => {
    const options = { defaultValues: { email: 'jenny@example.com', name: 'Jenny Rosen' } }
    const { checkout, element, wrapper } = await mountLeaf(VueStripeLinkSignupElement, {
      options
    })
    expect(checkout.createLinkSignupElement).toHaveBeenCalledWith(options)
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect(
      wrapper.find('.vue-stripe-link-signup-element .vue-stripe-link-signup-element-mount').exists()
    ).toBe(true)
  })

  it('creates via elements.create("linkSignup") inside VueStripeElements (Stripe beta)', async () => {
    const options = { defaultValues: { phone: '+15555550100' } }
    const { elements, checkout } = await mountLeaf(VueStripeLinkSignupElement, {
      context: 'elements',
      options
    })
    expect(elements.create).toHaveBeenCalledWith('linkSignup', options)
    expect(checkout.createLinkSignupElement).not.toHaveBeenCalled()
  })

  it('attaches the Stripe.js 10 Link Signup events (no change event)', async () => {
    const { element } = await mountLeaf(VueStripeLinkSignupElement)
    expect(element.on.mock.calls.map((call) => call[0])).toEqual([
      'ready',
      'focus',
      'blur',
      'escape',
      'loaderstart',
      'loaderror'
    ])
  })

  it('emits ready with the element and tracks loading', async () => {
    const { wrapper, element, handler } = await mountLeaf(VueStripeLinkSignupElement)
    handler('loaderstart')({ elementType: 'linkSignup' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-link-signup-element-loader').exists()).toBe(true)
    handler('ready')({ elementType: 'linkSignup' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-link-signup-element-loader').exists()).toBe(false)
    expect(wrapper.findComponent(VueStripeLinkSignupElement).emitted('ready')).toEqual([[element]])
  })

  it('emits loaderror and shows its message', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeLinkSignupElement)
    const event = { elementType: 'linkSignup', error: { message: 'Link Signup beta not enabled' } }
    handler('loaderror')(event)
    await nextTick()
    expect(wrapper.text()).toContain('Link Signup beta not enabled')
    expect(wrapper.findComponent(VueStripeLinkSignupElement).emitted('loaderror')).toEqual([
      [event]
    ])
  })

  it('detaches handlers and destroys on unmount', async () => {
    const { element, show } = await mountLeaf(VueStripeLinkSignupElement)
    show.value = false
    await flushPromises()
    expect(element.off).toHaveBeenCalledTimes(6)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })
})
