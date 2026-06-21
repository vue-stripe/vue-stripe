import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue-demi'
import VueStripeCurrencySelectorElement from '../../src/components/VueStripeCurrencySelectorElement.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeCheckoutProvider from '../../src/components/VueStripeCheckoutProvider.vue'
import { flushPromises, makeMockStripe, makeMockCheckout, makeMockElement } from '../setup'

// Mount Provider > CheckoutProvider > CurrencySelectorElement; returns wrapper + the checkout mock.
async function mountElement(checkout = makeMockCheckout(), elProps = {}, elSlots = {}) {
  const stripe = { ...makeMockStripe(), initCheckout: vi.fn(() => Promise.resolve(checkout)) }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () => h(VueStripeCheckoutProvider, { clientSecret: 'cs_test_123_secret' }, {
        default: () => h(VueStripeCurrencySelectorElement, elProps, elSlots)
      })
    }
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return { wrapper, checkout }
}

describe('VueStripeCurrencySelectorElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside VueStripeCheckoutProvider', () => {
    expect(() => mount(VueStripeCurrencySelectorElement)).toThrow(
      'VueStripeCurrencySelectorElement must be used within VueStripeCheckoutProvider'
    )
  })

  it('renders the element container', async () => {
    const { wrapper } = await mountElement()
    expect(wrapper.find('.vue-stripe-currency-selector-element').exists()).toBe(true)
    expect(wrapper.find('.vue-stripe-currency-selector-element-mount').exists()).toBe(true)
  })

  it('creates and mounts the element from the checkout instance', async () => {
    const { checkout } = await mountElement()
    expect(checkout.createCurrencySelectorElement).toHaveBeenCalledTimes(1)
    const created = checkout.createCurrencySelectorElement.mock.results[0].value
    expect(created.mount).toHaveBeenCalledTimes(1)
  })

  it('reuses an existing element instead of creating a second one', async () => {
    const checkout = makeMockCheckout()
    const existing = makeMockElement()
    checkout.getCurrencySelectorElement = vi.fn(() => existing)
    await mountElement(checkout)
    expect(checkout.getCurrencySelectorElement).toHaveBeenCalled()
    expect(checkout.createCurrencySelectorElement).not.toHaveBeenCalled()
    expect(existing.mount).toHaveBeenCalledTimes(1)
  })

  it('attaches named listeners and emits ready with the element', async () => {
    const { wrapper, checkout } = await mountElement()
    const created = checkout.createCurrencySelectorElement.mock.results[0].value
    const events = created.on.mock.calls.map((c: any[]) => c[0])
    expect(events).toEqual(expect.arrayContaining(['ready', 'focus', 'blur', 'escape', 'loaderror']))
    // 'change' is not emitted by the currency selector
    expect(events).not.toContain('change')

    // Fire the ready handler captured from .on('ready', handler)
    const readyHandler = created.on.mock.calls.find((c: any[]) => c[0] === 'ready')![1]
    readyHandler()
    const el = wrapper.findComponent(VueStripeCurrencySelectorElement)
    expect(el.emitted('ready')).toBeTruthy()
  })

  it('detaches every listener and destroys the element on unmount', async () => {
    const { wrapper, checkout } = await mountElement()
    const created = checkout.createCurrencySelectorElement.mock.results[0].value
    wrapper.unmount()
    expect(created.off).toHaveBeenCalledTimes(created.on.mock.calls.length)
    expect(created.destroy).toHaveBeenCalledTimes(1)
  })
})
