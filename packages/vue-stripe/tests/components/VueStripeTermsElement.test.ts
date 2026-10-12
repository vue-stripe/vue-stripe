import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue-demi'
import VueStripeTermsElement from '../../src/components/VueStripeTermsElement'
import { flushPromises } from '../setup'
import { mountLeaf } from './checkout-session-elements.helpers'

describe('VueStripeTermsElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates via checkout.createTermsElement() inside the Checkout provider', async () => {
    const { checkout, element, wrapper } = await mountLeaf(VueStripeTermsElement)
    expect(checkout.createTermsElement).toHaveBeenCalledWith()
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.vue-stripe-terms-element .vue-stripe-terms-element-mount').exists()).toBe(
      true
    )
  })

  it('creates via elements.create("terms") inside VueStripeElements (Stripe beta)', async () => {
    const { elements, checkout } = await mountLeaf(VueStripeTermsElement, { context: 'elements' })
    expect(elements.create).toHaveBeenCalledWith('terms', {})
    expect(checkout.createTermsElement).not.toHaveBeenCalled()
  })

  it('attaches the Stripe.js 10 Terms events (no change event)', async () => {
    const { element } = await mountLeaf(VueStripeTermsElement)
    expect(element.on.mock.calls.map((call) => call[0])).toEqual([
      'ready',
      'focus',
      'blur',
      'escape',
      'loaderstart',
      'loaderror'
    ])
  })

  it('emits ready with the element and re-emits focus/blur/escape', async () => {
    const { wrapper, element, handler } = await mountLeaf(VueStripeTermsElement)
    handler('ready')({ elementType: 'terms' })
    handler('focus')({ elementType: 'terms' })
    handler('blur')({ elementType: 'terms' })
    handler('escape')({ elementType: 'terms' })
    await nextTick()
    const emitted = wrapper.findComponent(VueStripeTermsElement).emitted()
    expect(emitted['ready']).toEqual([[element]])
    expect(emitted['focus']).toHaveLength(1)
    expect(emitted['blur']).toHaveLength(1)
    expect(emitted['escape']).toHaveLength(1)
    expect(emitted['change']).toBeUndefined()
  })

  it('shows the loaderror message (e.g. beta not enabled)', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeTermsElement)
    handler('loaderror')({ elementType: 'terms', error: { message: 'Terms beta not enabled' } })
    await nextTick()
    expect(wrapper.find('.vue-stripe-terms-element-error').text()).toContain(
      'Terms beta not enabled'
    )
  })

  it('detaches handlers and destroys on unmount', async () => {
    const { element, show } = await mountLeaf(VueStripeTermsElement)
    show.value = false
    await flushPromises()
    expect(element.off).toHaveBeenCalledTimes(6)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })
})
