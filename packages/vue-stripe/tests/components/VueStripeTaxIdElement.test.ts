import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue-demi'
import VueStripeTaxIdElement from '../../src/components/VueStripeTaxIdElement'
import { flushPromises } from '../setup'
import { mountLeaf } from './checkout-session-elements.helpers'

describe('VueStripeTaxIdElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates via checkout.createTaxIdElement inside the Checkout provider', async () => {
    const options = { verification: { taxId: { mode: 'if_supported' } } }
    const { checkout, element, wrapper } = await mountLeaf(VueStripeTaxIdElement, { options })
    expect(checkout.createTaxIdElement).toHaveBeenCalledWith(options)
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect(
      wrapper.find('.vue-stripe-tax-id-element .vue-stripe-tax-id-element-mount').exists()
    ).toBe(true)
  })

  it('creates via elements.create("taxId") inside VueStripeElements (Stripe beta)', async () => {
    const { elements, checkout } = await mountLeaf(VueStripeTaxIdElement, {
      context: 'elements',
      options: { fields: { businessName: 'always' } }
    })
    expect(elements.create).toHaveBeenCalledWith('taxId', { fields: { businessName: 'always' } })
    expect(checkout.createTaxIdElement).not.toHaveBeenCalled()
  })

  it('attaches the Stripe.js 10 Tax ID events', async () => {
    const { element } = await mountLeaf(VueStripeTaxIdElement)
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

  it('emits change with the Stripe event and tracks error state', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeTaxIdElement)
    handler('change')({
      elementType: 'taxId',
      complete: false,
      error: { message: 'Invalid VAT number' }
    })
    await nextTick()
    expect(wrapper.text()).toContain('Invalid VAT number')
    handler('change')({ elementType: 'taxId', complete: true })
    await nextTick()
    expect(wrapper.text()).not.toContain('Invalid VAT number')
    expect(wrapper.findComponent(VueStripeTaxIdElement).emitted('change')).toHaveLength(2)
  })

  it('sets loading from loaderstart/ready and error from loaderror', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeTaxIdElement)
    handler('loaderstart')({ elementType: 'taxId' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-tax-id-element-loader').exists()).toBe(true)
    handler('ready')({ elementType: 'taxId' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-tax-id-element-loader').exists()).toBe(false)
    handler('loaderror')({ elementType: 'taxId', error: { message: 'Tax ID beta not enabled' } })
    await nextTick()
    expect(wrapper.text()).toContain('Tax ID beta not enabled')
  })

  it('exposes getValue() which proxies element.getValue()', async () => {
    const { wrapper, element } = await mountLeaf(VueStripeTaxIdElement)
    const vm = wrapper.findComponent(VueStripeTaxIdElement).vm as unknown as {
      getValue: () => Promise<unknown>
    }
    await vm.getValue()
    expect(element.getValue).toHaveBeenCalled()
  })

  it('detaches handlers and destroys on unmount', async () => {
    const { element, show } = await mountLeaf(VueStripeTaxIdElement)
    show.value = false
    await flushPromises()
    expect(element.off).toHaveBeenCalledTimes(7)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })
})
