import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import VueStripeCheckoutForm from '../../src/components/VueStripeCheckoutForm'
import { VueStripeElementsError } from '../../src/utils/errors'
import { stripeElementsInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockElements } from '../setup'
import { mountLeaf } from './checkout-session-elements.helpers'

const FORM_EVENTS = [
  'ready',
  'change',
  'confirm',
  'cancel',
  'focus',
  'blur',
  'escape',
  'loaderstart',
  'loaderror'
]

describe('VueStripeCheckoutForm (Checkout Form SDK, beta)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates via checkoutForm.createForm(options) and mounts it', async () => {
    const options = { layout: 'compact', features: { promotionCodeCollection: 'never' } }
    const { checkoutForm, element, wrapper } = await mountLeaf(VueStripeCheckoutForm, {
      context: 'form',
      options
    })
    expect(checkoutForm.createForm).toHaveBeenCalledWith(options)
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.vue-stripe-checkout-form-mount').exists()).toBe(true)
  })

  it('attaches exactly the StripeCheckoutForm event union', async () => {
    const { element } = await mountLeaf(VueStripeCheckoutForm, { context: 'form' })
    expect(element.on.mock.calls.map((call) => call[0])).toEqual(FORM_EVENTS)
  })

  it('emits ready with the form and re-emits change, confirm and cancel payloads', async () => {
    const { wrapper, element, handler } = await mountLeaf(VueStripeCheckoutForm, {
      context: 'form'
    })
    const form = wrapper.findComponent(VueStripeCheckoutForm)
    handler('ready')({ elementType: 'checkoutForm' })
    const change = { elementType: 'checkoutForm', complete: true, empty: false, value: {} }
    handler('change')(change)
    const confirm = { source: 'checkout-form-pay-button', paymentMethodType: 'card' }
    handler('confirm')(confirm)
    handler('cancel')({ elementType: 'checkoutForm' })
    await flushPromises()
    expect(form.emitted('ready')?.[0]).toEqual([element])
    expect(form.emitted('change')?.[0]).toEqual([change])
    expect(form.emitted('confirm')?.[0]).toEqual([confirm])
    expect(form.emitted('cancel')?.[0]).toEqual([{ elementType: 'checkoutForm' }])
  })

  it('exposes getValue() and setView() forwarding to the Stripe form', async () => {
    const { wrapper, element } = await mountLeaf(VueStripeCheckoutForm, { context: 'form' })
    const value = { complete: true, empty: false, value: {}, status: {} }
    element.getValue.mockResolvedValue(value)
    const setView = vi.fn(() => Promise.resolve())
    Object.assign(element, { setView })
    const vm = wrapper.findComponent(VueStripeCheckoutForm).vm as unknown as {
      getValue: () => Promise<unknown>
      setView: (index: number) => Promise<void>
    }
    await expect(vm.getValue()).resolves.toBe(value)
    await vm.setView(1)
    expect(setView).toHaveBeenCalledWith(1)
  })

  it('getValue() and setView() resolve to undefined before the form exists', async () => {
    const { wrapper, show } = await mountLeaf(VueStripeCheckoutForm, { context: 'form' })
    const vm = wrapper.findComponent(VueStripeCheckoutForm).vm as unknown as {
      getValue: () => Promise<unknown>
      setView: (index: number) => Promise<void>
    }
    show.value = false
    await flushPromises()
    await expect(vm.getValue()).resolves.toBeUndefined()
    await expect(vm.setView(0)).resolves.toBeUndefined()
  })

  it('stops loading and shows the message on loaderror', async () => {
    const { wrapper, handler } = await mountLeaf(VueStripeCheckoutForm, { context: 'form' })
    handler('loaderror')({ elementType: 'checkoutForm', error: { message: 'No beta access' } })
    await flushPromises()
    expect(wrapper.find('.vue-stripe-checkout-form-error').text()).toContain('No beta access')
    expect(wrapper.find('.vue-stripe-checkout-form-loader').exists()).toBe(false)
  })

  it('detaches its handlers and destroys the form on unmount', async () => {
    const { element, show } = await mountLeaf(VueStripeCheckoutForm, { context: 'form' })
    show.value = false
    await flushPromises()
    expect(element.off).toHaveBeenCalledTimes(FORM_EVENTS.length)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })

  it('throws a typed error outside VueStripeCheckoutFormProvider', () => {
    expect(() => mount(VueStripeCheckoutForm)).toThrow(VueStripeElementsError)
    expect(() => mount(VueStripeCheckoutForm)).toThrow(
      'VueStripeCheckoutForm must be used within VueStripeCheckoutFormProvider'
    )
  })

  it('ignores an Elements context: elements.create() has no Checkout Form', () => {
    const elements = makeMockElements()
    const Host = defineComponent({
      setup() {
        provide(stripeElementsInjectionKey, {
          elements: shallowRef(elements as never),
          loading: ref(false),
          error: ref(null)
        })
        return () => h(VueStripeCheckoutForm)
      }
    })
    expect(() => mount(Host)).toThrow(
      'VueStripeCheckoutForm must be used within VueStripeCheckoutFormProvider'
    )
    expect(elements.create).not.toHaveBeenCalled()
  })

  it('reports that it is not available inside VueStripeCheckoutElementsProvider', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper, checkout, element } = await mountLeaf(VueStripeCheckoutForm, {
      context: 'checkout'
    })
    expect(element.mount).not.toHaveBeenCalled()
    expect(checkout.createPaymentElement).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      'VueStripeCheckoutForm is not available inside VueStripeCheckoutElementsProvider'
    )
    errorSpy.mockRestore()
  })
})
