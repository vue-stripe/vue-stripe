import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeCurrencySelectorElement from '../../src/components/VueStripeCurrencySelectorElement'
import VueStripeCheckoutForm from '../../src/components/VueStripeCheckoutForm'
import VueStripeCheckoutFormProvider from '../../src/components/VueStripeCheckoutFormProvider'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { flushPromises, makeMockCheckoutForm, makeMockStripe } from '../setup'
import { stripeCheckoutFormInjectionKey } from '../../src/utils/injection-keys'
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

  // #667: Stripe.js throws an uncaught TypeError when the currency selector is created
  // before the form, so a selector placed above VueStripeCheckoutForm is created after it.
  it('is created after a VueStripeCheckoutForm rendered after it', async () => {
    const form = makeMockCheckoutForm()
    const stripe = makeMockStripe()
    stripe.initCheckoutFormSdk.mockReturnValue(form)
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(VueStripeCheckoutFormProvider, { clientSecret: 'cs_test_1_secret_2' }, () => [
            h(VueStripeCurrencySelectorElement),
            h(VueStripeCheckoutForm)
          ])
      }
    })
    for (let i = 0; i < 4; i++) await flushPromises()

    expect(form.createForm).toHaveBeenCalledTimes(1)
    expect(form.createCurrencySelectorElement).toHaveBeenCalledTimes(1)
    expect(form.createForm.mock.invocationCallOrder[0]).toBeLessThan(
      form.createCurrencySelectorElement.mock.invocationCallOrder[0]!
    )
  })

  it('is not created when unmounted before its deferred creation', async () => {
    const form = makeMockCheckoutForm()
    const wrapper = mount(
      defineComponent({
        setup() {
          provide(stripeCheckoutFormInjectionKey, {
            checkout: shallowRef(form as never),
            actions: shallowRef(null),
            session: shallowRef(null),
            loading: ref(true),
            error: ref(null)
          })
          return () => h(VueStripeCurrencySelectorElement)
        }
      })
    )
    wrapper.unmount()
    await flushPromises()
    expect(form.createCurrencySelectorElement).not.toHaveBeenCalled()
  })
})
