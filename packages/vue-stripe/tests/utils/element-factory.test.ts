import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, ref, shallowRef } from 'vue-demi'
import { createStripeElement, pick } from '../../src/utils/element-factory'
import {
  stripeCheckoutInjectionKey,
  stripeElementsInjectionKey
} from '../../src/utils/injection-keys'
import { VueStripeElementsError } from '../../src/utils/errors'
import { flushPromises, makeMockCheckout, makeMockElement, makeMockElements } from '../setup'

type Ctx = 'elements' | 'checkout' | 'both'

// Mount `Component` under a hand-provided Elements and/or Checkout context.
function mountUnder(
  Component: ReturnType<typeof createStripeElement>,
  { ctx = 'elements' as Ctx, props = {} as Record<string, unknown>, slots = {} } = {}
) {
  const element = makeMockElement()
  const elements = makeMockElements()
  elements.create.mockImplementation(() => element)
  const checkout = makeMockCheckout()
  checkout.createPaymentElement.mockImplementation(() => element)
  const options = ref<Record<string, unknown>>(props)
  const show = ref(true)
  const child = ref<Record<string, unknown> | null>(null)

  const Host = defineComponent({
    setup() {
      if (ctx !== 'checkout') {
        provide(stripeElementsInjectionKey, {
          elements: shallowRef(elements as never),
          loading: ref(false),
          error: ref(null)
        })
      }
      if (ctx !== 'elements') {
        provide(stripeCheckoutInjectionKey, {
          checkout: shallowRef(checkout as never),
          actions: shallowRef(null),
          session: shallowRef(null),
          loading: ref(false),
          error: ref(null)
        })
      }
      return () => (show.value ? h(Component, { ref: child, options: options.value }, slots) : null)
    }
  })
  const wrapper = mount(Host)
  const handler = (name: string) =>
    element.on.mock.calls.find((call) => call[0] === name)?.[1] as (...a: unknown[]) => void
  return { wrapper, element, elements, checkout, options, show, child, handler }
}

describe('createStripeElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('attaches exactly the configured events and detaches them + destroy() on unmount', async () => {
    const Comp = createStripeElement({
      elementType: 'x',
      componentName: 'X',
      events: ['ready', 'click']
    })
    const { element, show } = mountUnder(Comp)
    await flushPromises()
    expect(element.on.mock.calls.map((c) => c[0])).toEqual(['ready', 'click'])
    expect(element.mount).toHaveBeenCalledTimes(1)
    show.value = false
    await flushPromises()
    expect(element.off.mock.calls.map((c) => c[0])).toEqual(['ready', 'click'])
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })

  it('defaults to the base events', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { element } = mountUnder(Comp)
    await flushPromises()
    expect(element.on.mock.calls.map((c) => c[0])).toEqual([
      'ready',
      'change',
      'focus',
      'blur',
      'escape'
    ])
  })

  it('applies defaultOptions under user options', async () => {
    const Comp = createStripeElement({
      elementType: 'iban',
      componentName: 'X',
      defaultOptions: () => ({ supportedCountries: ['SEPA'], placeholderCountry: 'DE' })
    })
    const { elements } = mountUnder(Comp, { props: { placeholderCountry: 'FR' } })
    await flushPromises()
    expect(elements.create).toHaveBeenCalledWith('iban', {
      supportedCountries: ['SEPA'],
      placeholderCountry: 'FR'
    })
  })

  it('emits ready with the element and turns loading off', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { wrapper, element, handler } = mountUnder(Comp)
    await flushPromises()
    expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(true)
    handler('ready')({ elementType: 'x' })
    await nextTick()
    expect(wrapper.findComponent(Comp).emitted('ready')?.[0]).toEqual([element])
    expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(false)
  })

  it('sets error from change events and clears it', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { wrapper, handler } = mountUnder(Comp)
    await flushPromises()
    handler('change')({ error: { message: 'Invalid' } })
    await nextTick()
    expect(wrapper.find('.vue-stripe-element-error').text()).toBe('Invalid')
    handler('change')({ complete: true })
    await nextTick()
    expect(wrapper.find('.vue-stripe-element-error').exists()).toBe(false)
    expect(wrapper.findComponent(Comp).emitted('change')).toHaveLength(2)
  })

  it('sets error from loaderror events and stops loading', async () => {
    const Comp = createStripeElement({
      elementType: 'x',
      componentName: 'X',
      events: ['ready', 'loaderror']
    })
    const { wrapper, handler } = mountUnder(Comp)
    await flushPromises()
    handler('loaderror')({ error: { message: 'Could not load' } })
    await nextTick()
    expect(wrapper.text()).toContain('Could not load')
    expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(false)
  })

  it('calls element.update(options) when options change (deep)', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { element, options } = mountUnder(Comp, { props: { style: { base: { color: 'red' } } } })
    await flushPromises()
    options.value = { style: { base: { color: 'blue' } } }
    await flushPromises()
    expect(element.update).toHaveBeenCalledWith({ style: { base: { color: 'blue' } } })
  })

  it('exposes element/loading/error/focus/blur/clear plus expose() extras', async () => {
    const Comp = createStripeElement({
      elementType: 'x',
      componentName: 'X',
      expose: (el) => ({ getValue: () => el.value?.getValue?.() })
    })
    const { child, element } = mountUnder(Comp)
    await flushPromises()
    const api = child.value as unknown as Record<string, () => unknown>
    expect(api['element']).toBe(element)
    expect(api['loading']).toBe(true)
    expect(api['error']).toBe(null)
    api['focus']?.()
    api['blur']?.()
    api['clear']?.()
    await api['getValue']?.()
    expect(element.focus).toHaveBeenCalled()
    expect(element.blur).toHaveBeenCalled()
    expect(element.clear).toHaveBeenCalled()
    expect(element.getValue).toHaveBeenCalled()
  })

  it('renders #error and #loading slots', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { wrapper, handler } = mountUnder(Comp, {
      slots: {
        loading: () => h('span', { class: 'my-loader' }, 'wait'),
        error: ({ error }: { error: string }) => h('span', { class: 'my-error' }, error)
      }
    })
    await flushPromises()
    expect(wrapper.find('.my-loader').exists()).toBe(true)
    handler('change')({ error: { message: 'Bad' } })
    await nextTick()
    expect(wrapper.find('.my-error').text()).toBe('Bad')
  })

  it('keeps a custom root class and derives the part classes from it', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X', className: 'my-el' })
    const { wrapper } = mountUnder(Comp)
    await flushPromises()
    expect(wrapper.find('.my-el.vue-stripe-element').exists()).toBe(true)
    expect(wrapper.find('.my-el-mount.vue-stripe-element-mount').exists()).toBe(true)
    expect(wrapper.find('.my-el-loader').exists()).toBe(true)
  })

  it('uses the Checkout creator when only the checkout context is present', async () => {
    const creator = vi.fn(
      (sdk: { createPaymentElement: (o: unknown) => unknown }, o: Record<string, unknown>) =>
        sdk.createPaymentElement(pick(o, ['layout'])) as never
    )
    const Comp = createStripeElement({
      elementType: 'payment',
      componentName: 'X',
      checkout: creator
    })
    const { checkout, elements } = mountUnder(Comp, {
      ctx: 'checkout',
      props: { layout: 'tabs', mode: 'x' }
    })
    await flushPromises()
    expect(checkout.createPaymentElement).toHaveBeenCalledWith({ layout: 'tabs' })
    expect(elements.create).not.toHaveBeenCalled()
  })

  it('prefers the Elements context when both are present', async () => {
    const creator = vi.fn()
    const Comp = createStripeElement({
      elementType: 'payment',
      componentName: 'X',
      checkout: creator
    })
    const { elements } = mountUnder(Comp, { ctx: 'both' })
    await flushPromises()
    expect(elements.create).toHaveBeenCalledWith('payment', {})
    expect(creator).not.toHaveBeenCalled()
  })

  it('reports elements without a Checkout creator as unavailable in Checkout Sessions', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Comp = createStripeElement({ elementType: 'card', componentName: 'VueStripeCardElement' })
    const { wrapper } = mountUnder(Comp, { ctx: 'checkout' })
    await flushPromises()
    expect(wrapper.text()).toContain('not available inside Checkout Sessions')
    expect(errorSpy).toHaveBeenCalledWith(
      '[Vue Stripe] VueStripeCardElement creation error:',
      expect.stringContaining('not available inside Checkout Sessions')
    )
    errorSpy.mockRestore()
  })

  it('throws VueStripeElementsError when no context is present', () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    expect(() => mount(Comp)).toThrow(VueStripeElementsError)
  })

  it('pick() keeps only the listed keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })
})
