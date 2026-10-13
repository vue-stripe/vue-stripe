import { describe, it, expect, beforeEach, vi } from 'vitest'
import VueStripeCurrencySelectorElement from '../../src/components/VueStripeCurrencySelectorElement'
import { flushPromises } from '../setup'
import { mountLeaf } from './checkout-session-elements.helpers'

describe('VueStripeCurrencySelectorElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates via checkout.createCurrencySelectorElement() with no options inside the Checkout provider', async () => {
    const { checkout, element, wrapper } = await mountLeaf(VueStripeCurrencySelectorElement, {
      options: { ignored: true }
    })
    expect(checkout.createCurrencySelectorElement).toHaveBeenCalledWith()
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.vue-stripe-currency-selector-element-mount').exists()).toBe(true)
  })

  it('creates via checkoutForm.createCurrencySelectorElement() inside VueStripeCheckoutFormProvider', async () => {
    const { checkout, checkoutForm, element } = await mountLeaf(VueStripeCurrencySelectorElement, {
      context: 'form',
      options: { ignored: true }
    })
    expect(checkoutForm.createCurrencySelectorElement).toHaveBeenCalledWith()
    expect(checkout.createCurrencySelectorElement).not.toHaveBeenCalled()
    expect(element.mount).toHaveBeenCalledTimes(1)
  })

  it('reports through @loaderror and #error inside VueStripeElements, without elements.create() (#573)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { elements, wrapper } = await mountLeaf(VueStripeCurrencySelectorElement, {
      context: 'elements'
    })
    const message =
      'VueStripeCurrencySelectorElement is not available inside VueStripeElements; use it within VueStripeCheckoutElementsProvider or VueStripeCheckoutFormProvider'
    expect(elements.create).not.toHaveBeenCalled()
    expect(wrapper.find('.vue-stripe-currency-selector-element-error').text()).toBe(message)
    expect(wrapper.find('.vue-stripe-currency-selector-element-loader').exists()).toBe(false)
    expect(
      wrapper.findComponent(VueStripeCurrencySelectorElement).emitted('loaderror')?.[0]
    ).toEqual([{ elementType: 'currencySelector', error: { message } }])
    errorSpy.mockRestore()
  })

  it('uses the Checkout SDK when a VueStripeElements sits inside the Checkout provider', async () => {
    const { checkout, elements } = await mountLeaf(VueStripeCurrencySelectorElement, {
      context: 'both'
    })
    expect(checkout.createCurrencySelectorElement).toHaveBeenCalledWith()
    expect(elements.create).not.toHaveBeenCalled()
  })

  it('attaches exactly ready/focus/blur/escape/loaderror (no change event in Stripe.js 10)', async () => {
    const { element } = await mountLeaf(VueStripeCurrencySelectorElement)
    expect(element.on.mock.calls.map((call) => call[0])).toEqual([
      'ready',
      'focus',
      'blur',
      'escape',
      'loaderror'
    ])
  })

  it('emits ready with the element', async () => {
    const { wrapper, element, handler } = await mountLeaf(VueStripeCurrencySelectorElement)
    handler('ready')({ elementType: 'currencySelector' })
    await flushPromises()
    expect(wrapper.findComponent(VueStripeCurrencySelectorElement).emitted('ready')?.[0]).toEqual([
      element
    ])
  })

  it('detaches handlers and destroys on unmount', async () => {
    const { element, show } = await mountLeaf(VueStripeCurrencySelectorElement)
    show.value = false
    await flushPromises()
    expect(element.off).toHaveBeenCalledTimes(5)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })
})
