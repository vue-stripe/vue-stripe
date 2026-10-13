import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide, ref, shallowRef } from 'vue-demi'
import { createStripeElement, pick } from '../../src/utils/element-factory'
import {
  stripeCheckoutFormInjectionKey,
  stripeCheckoutInjectionKey,
  stripeElementsInjectionKey
} from '../../src/utils/injection-keys'
import { VueStripeElementsError } from '../../src/utils/errors'
import {
  flushPromises,
  makeMockCheckout,
  makeMockCheckoutForm,
  makeMockElement,
  makeMockElements
} from '../setup'

type Ctx = 'elements' | 'checkout' | 'both' | 'form' | 'elements+form'

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
  const checkoutForm = makeMockCheckoutForm()
  checkoutForm.createForm.mockImplementation(() => element)
  const formSdk = shallowRef<unknown>(checkoutForm)
  const options = ref<Record<string, unknown>>(props)
  const show = ref(true)
  const child = ref<Record<string, unknown> | null>(null)

  const Host = defineComponent({
    setup() {
      if (ctx === 'elements' || ctx === 'both' || ctx === 'elements+form') {
        provide(stripeElementsInjectionKey, {
          elements: shallowRef(elements as never),
          loading: ref(false),
          error: ref(null)
        })
      }
      if (ctx === 'form' || ctx === 'elements+form') {
        provide(stripeCheckoutFormInjectionKey, {
          checkout: formSdk as never,
          actions: shallowRef(null),
          session: shallowRef(null),
          loading: ref(false),
          error: ref(null)
        })
      }
      if (ctx === 'checkout' || ctx === 'both') {
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
  return {
    wrapper,
    element,
    elements,
    checkout,
    checkoutForm,
    formSdk,
    options,
    show,
    child,
    handler
  }
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

  it('keeps the classes Stripe.js added to the mount node when loading ends (#563)', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { wrapper, element, handler } = mountUnder(Comp)
    await flushPromises()
    const host = element.mount.mock.calls[0]![0] as HTMLElement
    host.classList.add('StripeElement', 'StripeElement--empty')
    handler('ready')({ elementType: 'x' })
    await nextTick()
    expect(wrapper.find('.vue-stripe-element-loading').exists()).toBe(false)
    expect(host.classList.contains('vue-stripe-element-mount')).toBe(true)
    expect(host.classList.contains('StripeElement--empty')).toBe(true)
    handler('change')({ error: { message: 'Invalid' } })
    await nextTick()
    expect(wrapper.find('.vue-stripe-element-error').element.nextElementSibling).toBe(host)
  })

  it('turns loading off after mount when the element has no ready event', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X', events: ['click'] })
    const { wrapper, element, child } = mountUnder(Comp)
    await flushPromises()
    expect(element.mount).toHaveBeenCalledTimes(1)
    expect((child.value as unknown as Record<string, unknown>)['loading']).toBe(false)
    expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(false)
    expect(wrapper.find('.vue-stripe-element-loading').exists()).toBe(false)
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

  it('does not call update() when the parent re-renders with equal options', async () => {
    const Comp = createStripeElement({ elementType: 'x', componentName: 'X' })
    const { element, options } = mountUnder(Comp, { props: { layout: 'tabs' } })
    await flushPromises()
    options.value = { layout: 'tabs' }
    await flushPromises()
    options.value = { layout: 'tabs' }
    await flushPromises()
    expect(element.update).not.toHaveBeenCalled()
    options.value = { layout: 'accordion' }
    await flushPromises()
    expect(element.update).toHaveBeenCalledTimes(1)
  })

  it('keeps the createOnly keys out of update() (#616)', async () => {
    const Comp = createStripeElement({
      elementType: 'address',
      componentName: 'X',
      createOnly: { mode: true }
    })
    const { element, options } = mountUnder(Comp, { props: { mode: 'billing' } })
    await flushPromises()
    options.value = { mode: 'billing', display: { name: 'split' } }
    await flushPromises()
    expect(element.update).toHaveBeenCalledWith({ display: { name: 'split' } })
  })

  it('logs an update() failure instead of throwing from the watcher', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Comp = createStripeElement({ elementType: 'x', componentName: 'VueStripeX' })
    const { element, options } = mountUnder(Comp, { props: { a: 1 } })
    await flushPromises()
    element.update.mockImplementation(() => {
      throw new Error('Mode cannot be updated.')
    })
    options.value = { a: 2 }
    await flushPromises()
    expect(errorSpy).toHaveBeenCalledWith(
      '[Vue Stripe] VueStripeX update error:',
      'Mode cannot be updated.'
    )
    errorSpy.mockRestore()
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

  it('uses the Checkout Form creator when only the Form context is present', async () => {
    const Comp = createStripeElement({
      elementType: 'checkoutForm',
      componentName: 'X',
      elements: false,
      checkoutForm: (sdk, o) => sdk.createForm(o) as never
    })
    const { checkoutForm, element } = mountUnder(Comp, {
      ctx: 'form',
      props: { layout: 'compact' }
    })
    await flushPromises()
    expect(checkoutForm.createForm).toHaveBeenCalledWith({ layout: 'compact' })
    expect(element.mount).toHaveBeenCalledTimes(1)
  })

  it('skips the Elements context for definitions without an Elements type', async () => {
    const Comp = createStripeElement({
      elementType: 'checkoutForm',
      componentName: 'X',
      elements: false,
      checkoutForm: (sdk, o) => sdk.createForm(o) as never
    })
    const { checkoutForm, elements } = mountUnder(Comp, { ctx: 'elements+form' })
    await flushPromises()
    expect(elements.create).not.toHaveBeenCalled()
    expect(checkoutForm.createForm).toHaveBeenCalledTimes(1)
  })

  it('reports elements without a Form creator as unavailable in the Checkout Form', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Comp = createStripeElement({ elementType: 'payment', componentName: 'X' })
    const { wrapper } = mountUnder(Comp, { ctx: 'form' })
    await flushPromises()
    expect(wrapper.text()).toContain('X is not available inside VueStripeCheckoutFormProvider')
    errorSpy.mockRestore()
  })

  it('reports Form-only definitions as unavailable in Checkout Sessions with Elements', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Comp = createStripeElement({
      elementType: 'checkoutForm',
      componentName: 'X',
      elements: false,
      checkoutForm: (sdk, o) => sdk.createForm(o) as never
    })
    const { wrapper } = mountUnder(Comp, { ctx: 'checkout' })
    await flushPromises()
    expect(wrapper.text()).toContain('X is not available inside VueStripeCheckoutElementsProvider')
    errorSpy.mockRestore()
  })

  it('moves to a new Checkout Form SDK: destroys the old element, creates from the new one', async () => {
    const Comp = createStripeElement({
      elementType: 'checkoutForm',
      componentName: 'X',
      elements: false,
      checkoutForm: (sdk, o) => sdk.createForm(o) as never
    })
    const { element, formSdk } = mountUnder(Comp, { ctx: 'form' })
    await flushPromises()
    const next = makeMockCheckoutForm()
    const second = makeMockElement()
    next.createForm.mockImplementation(() => second)
    formSdk.value = next
    await flushPromises()
    expect(element.destroy).toHaveBeenCalledTimes(1)
    expect(second.mount).toHaveBeenCalledTimes(1)
  })

  it('names every supported parent when no context is present', () => {
    const both = createStripeElement({
      elementType: 'currencySelector',
      componentName: 'X',
      checkoutForm: (sdk) => sdk.createCurrencySelectorElement() as never
    })
    expect(() => mount(both)).toThrow(
      'X must be used within VueStripeElements or VueStripeCheckoutElementsProvider or VueStripeCheckoutFormProvider'
    )
    const formOnly = createStripeElement({
      elementType: 'checkoutForm',
      componentName: 'Y',
      elements: false,
      checkoutForm: (sdk, o) => sdk.createForm(o) as never
    })
    expect(() => mount(formOnly)).toThrow('Y must be used within VueStripeCheckoutFormProvider')
  })

  it('pick() keeps only the listed keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })
})
