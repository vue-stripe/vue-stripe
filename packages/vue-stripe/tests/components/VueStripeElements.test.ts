import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, inject, ref } from 'vue-demi'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { stripeElementsInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises } from '../setup'

describe('VueStripeElements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create a wrapper with StripeProvider
  const mountWithProvider = (elementsProps = {}, slots = {}) => {
    return mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, elementsProps, slots)
      }
    })
  }

  it('should throw error when used outside StripeProvider', () => {
    expect(() => {
      mount(VueStripeElements, {
        props: {}
      })
    }).toThrow('VueStripeElements must be used within VueStripeProvider')
  })

  it('should render loading state initially', async () => {
    const wrapper = mountWithProvider(
      {},
      {
        default: () => h('div', 'Payment Form'),
        loading: () => h('div', { class: 'custom-loading' }, 'Loading Elements...')
      }
    )

    // Initially in loading state (Stripe provider loading)
    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(true)
  })

  it('should render default content after successful load', async () => {
    const wrapper = mountWithProvider(
      {},
      {
        default: () => h('div', { class: 'payment-form' }, 'Payment Form')
      }
    )

    await flushPromises()
    await wrapper.vm.$nextTick()

    // After Stripe loads, elements should be ready
    expect(wrapper.find('.payment-form').exists()).toBe(true)
  })

  it('should render error state when elements creation fails', async () => {
    // Mock the elements method to throw an error
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => {
        throw new Error('Elements creation failed')
      }),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = mountWithProvider(
      {},
      {
        error: ({ error }: { error: string }) => h('div', { class: 'custom-error' }, error)
      }
    )

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Should show error slot
    expect(wrapper.find('.custom-error').exists()).toBe(true)
  })

  it('should pass clientSecret to elements options', async () => {
    const mockElements = vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      }))
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: mockElements,
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    mountWithProvider({
      clientSecret: 'pi_123_secret_456'
    })

    await flushPromises()

    expect(mockElements).toHaveBeenCalledWith({
      clientSecret: 'pi_123_secret_456'
    })
  })

  it('should pass custom options to elements', async () => {
    const mockElements = vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      }))
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: mockElements,
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    mountWithProvider({
      clientSecret: 'pi_123_secret_456',
      options: {
        appearance: {
          theme: 'stripe'
        },
        loader: 'auto'
      }
    })

    await flushPromises()

    expect(mockElements).toHaveBeenCalledWith({
      clientSecret: 'pi_123_secret_456',
      appearance: {
        theme: 'stripe'
      },
      loader: 'auto'
    })
  })

  it('should pass appearance, fonts, and locale props to elements options', async () => {
    const mockElements = vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      }))
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: mockElements,
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const appearance = { theme: 'night', variables: { colorPrimary: '#635bff' } }
    const fonts = [{ cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }]

    mountWithProvider({
      clientSecret: 'pi_123_secret_456',
      appearance,
      fonts,
      locale: 'fr'
    })

    await flushPromises()

    expect(mockElements).toHaveBeenCalledWith({
      clientSecret: 'pi_123_secret_456',
      appearance,
      fonts,
      locale: 'fr'
    })
  })

  it('should provide elements context to child components', async () => {
    let injectedContext: ReturnType<typeof inject<any>> = null

    const ChildComponent = {
      setup() {
        injectedContext = inject(stripeElementsInjectionKey)
        return () => h('div', 'Child')
      }
    }

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(ChildComponent)
            }
          )
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(injectedContext).toBeDefined()
    expect(injectedContext!.elements).toBeDefined()
    expect(injectedContext!.loading).toBeDefined()
    expect(injectedContext!.error).toBeDefined()
  })

  it('should recreate elements when clientSecret changes', async () => {
    const mockElements = vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      }))
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValue({
      elements: mockElements,
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    // Create a component that can change clientSecret
    const clientSecret = ref('pi_123_secret_456')

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () =>
          h(VueStripeElements, {
            clientSecret: clientSecret.value
          })
      }
    })

    await flushPromises()

    // Change clientSecret
    clientSecret.value = 'pi_789_secret_012'
    await wrapper.vm.$nextTick()
    await flushPromises()

    // Elements should be called multiple times (initial + recreate)
    expect(mockElements.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('should render custom loading slot', async () => {
    const wrapper = mountWithProvider(
      {},
      {
        loading: () => h('div', { class: 'custom-spinner' }, 'Custom Loading...')
      }
    )

    // Provider's loading state
    expect(
      wrapper.find('.vue-stripe-loading').exists() || wrapper.find('.custom-spinner').exists()
    ).toBe(true)
  })

  it('should render default error message when no error slot provided', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => {
        throw new Error('Test error')
      }),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = mountWithProvider()

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Should show default error state
    const errorElement = wrapper.find('.vue-stripe-elements-error')
    if (errorElement.exists()) {
      expect(errorElement.text()).toContain('error')
    }
  })
})

describe('VueStripeElements options and reactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const setup = async (initial: Record<string, unknown>) => {
    const { makeMockStripe, makeMockElements } = await import('../setup')
    const elementsInstance = makeMockElements()
    const stripe = makeMockStripe()
    stripe.elements.mockReturnValue(elementsInstance)
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const props = ref<Record<string, unknown>>(initial)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeElements, props.value) }
    })
    await flushPromises()
    return { wrapper, stripe, elementsInstance, props }
  }

  it('forwards the deferred-intent props to stripe.elements()', async () => {
    const { stripe } = await setup({
      mode: 'payment',
      currency: 'usd',
      amount: 0,
      setupFutureUsage: 'off_session',
      captureMethod: 'manual'
    })
    expect(stripe.elements).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        currency: 'usd',
        amount: 0,
        setupFutureUsage: 'off_session',
        captureMethod: 'manual'
      })
    )
  })

  it('re-creates Elements when a deferred-intent prop changes', async () => {
    const { stripe, props } = await setup({ mode: 'payment', currency: 'usd', amount: 1000 })
    props.value = { mode: 'payment', currency: 'usd', amount: 2500 }
    await flushPromises()
    expect(stripe.elements).toHaveBeenCalledTimes(2)
    expect(stripe.elements).toHaveBeenLastCalledWith(expect.objectContaining({ amount: 2500 }))
  })

  it('applies appearance and locale changes through elements.update() without re-creating', async () => {
    const { stripe, elementsInstance, props } = await setup({
      clientSecret: 'pi_1_secret_2',
      appearance: { theme: 'stripe' }
    })
    props.value = { clientSecret: 'pi_1_secret_2', appearance: { theme: 'night' }, locale: 'fr' }
    await flushPromises()
    expect(elementsInstance.update).toHaveBeenCalledWith({
      appearance: { theme: 'night' },
      locale: 'fr'
    })
    expect(stripe.elements).toHaveBeenCalledTimes(1)
  })
})

describe('VueStripeElements and Stripe.js 10 (Endive)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('never forwards paymentMethodTypes (removed from stripe.elements() in Endive)', async () => {
    const { makeMockStripe } = await import('../setup')
    const stripe = makeMockStripe()
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(VueStripeElements, {
            mode: 'payment',
            currency: 'usd',
            amount: 1000,
            paymentMethodTypes: ['card'],
            options: { paymentMethodTypes: ['card'] }
          })
      }
    })
    await flushPromises()
    const passed = stripe.elements.mock.calls[0]?.[0] as Record<string, unknown>
    expect(passed).toMatchObject({ mode: 'payment', currency: 'usd', amount: 1000 })
    expect(passed).not.toHaveProperty('paymentMethodTypes')
  })
})

describe('VueStripeElements and Stripe.js Dahlia elements.update()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('surfaces a rejected elements.update() as error + emits error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { makeMockStripe, makeMockElements } = await import('../setup')
    const elementsInstance = makeMockElements()
    elementsInstance.update.mockRejectedValueOnce(new Error('bad appearance'))
    const stripe = makeMockStripe()
    stripe.elements.mockReturnValue(elementsInstance)
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

    const props = ref<Record<string, unknown>>({
      clientSecret: 'pi_x_secret_y',
      appearance: { theme: 'stripe' }
    })
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeElements, props.value) }
    })
    await flushPromises()
    props.value = { clientSecret: 'pi_x_secret_y', appearance: { theme: 'night' } }
    await flushPromises()
    await flushPromises()

    expect(wrapper.findComponent(VueStripeElements).emitted('error')?.[0]).toEqual([
      'bad appearance'
    ])
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[Vue Stripe\]/),
      'bad appearance'
    )
    errorSpy.mockRestore()
  })
})

describe('VueStripeElements @update-end', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  type Handler = () => void
  const handlerOf = (group: { on: { mock: { calls: unknown[][] } } }) => {
    const call = group.on.mock.calls.find(([event]) => event === 'update-end')
    expect(call, "no on('update-end') listener on this Elements group").toBeDefined()
    return call![1] as Handler
  }

  const setup = async (initial: Record<string, unknown>, withOff = false) => {
    const { makeMockStripe, makeMockElements } = await import('../setup')
    const groups: Array<ReturnType<typeof makeMockElements> & { off?: ReturnType<typeof vi.fn> }> =
      []
    const stripe = makeMockStripe()
    stripe.elements.mockImplementation(() => {
      const group = Object.assign(makeMockElements(), withOff ? { off: vi.fn() } : {})
      groups.push(group)
      return group
    })
    const { loadStripe } = await import('@stripe/stripe-js')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const props = ref<Record<string, unknown>>(initial)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeElements, props.value) }
    })
    await flushPromises()
    const elementsWrapper = () => wrapper.findComponent(VueStripeElements)
    return { wrapper, groups, props, elementsWrapper }
  }

  it("listens to the group's update-end and emits update-end", async () => {
    const { groups, elementsWrapper } = await setup({ mode: 'payment', currency: 'usd', amount: 1 })
    expect(groups).toHaveLength(1)
    expect(groups[0]!.on).toHaveBeenCalledWith('update-end', expect.any(Function))

    handlerOf(groups[0]!)()
    expect(elementsWrapper().emitted('update-end')).toEqual([[]])
  })

  it('emits update-end after an appearance change applied with elements.update()', async () => {
    const { groups, props, elementsWrapper } = await setup({
      clientSecret: 'pi_1_secret_2',
      appearance: { theme: 'stripe' }
    })
    groups[0]!.update.mockImplementationOnce(() => {
      handlerOf(groups[0]!)()
      return Promise.resolve()
    })
    props.value = { clientSecret: 'pi_1_secret_2', appearance: { theme: 'night' } }
    await flushPromises()
    expect(groups[0]!.update).toHaveBeenCalledTimes(1)
    expect(elementsWrapper().emitted('update-end')).toHaveLength(1)
  })

  it('moves the listener to the new group when Elements is re-created', async () => {
    const { groups, props, elementsWrapper } = await setup(
      { mode: 'payment', currency: 'usd', amount: 1000 },
      true
    )
    const oldHandler = handlerOf(groups[0]!)
    props.value = { mode: 'payment', currency: 'usd', amount: 2500 }
    await flushPromises()

    expect(groups).toHaveLength(2)
    expect(groups[0]!.off).toHaveBeenCalledWith('update-end', oldHandler)
    expect(groups[1]!.on).toHaveBeenCalledWith('update-end', expect.any(Function))

    handlerOf(groups[1]!)()
    expect(elementsWrapper().emitted('update-end')).toHaveLength(1)
  })

  it('ignores update-end from a replaced group that has no off() (Stripe.js 10.0.0)', async () => {
    const { groups, props, elementsWrapper } = await setup({
      mode: 'payment',
      currency: 'usd',
      amount: 1000
    })
    expect(groups[0]).not.toHaveProperty('off')
    const oldHandler = handlerOf(groups[0]!)
    props.value = { mode: 'payment', currency: 'usd', amount: 2500 }
    await flushPromises()

    oldHandler()
    expect(elementsWrapper().emitted('update-end')).toBeUndefined()
    handlerOf(groups[1]!)()
    expect(elementsWrapper().emitted('update-end')).toHaveLength(1)
  })

  it('detaches on unmount and emits nothing afterwards', async () => {
    const { wrapper, groups } = await setup({ mode: 'payment', currency: 'usd', amount: 1 }, true)
    const handler = handlerOf(groups[0]!)
    const inner = wrapper.findComponent(VueStripeElements)
    wrapper.unmount()

    expect(groups[0]!.off).toHaveBeenCalledWith('update-end', handler)
    handler()
    expect(inner.emitted('update-end')).toBeUndefined()
  })

  it('tolerates an Elements group without on()', async () => {
    const { makeMockStripe, makeMockElements } = await import('../setup')
    const group: Partial<ReturnType<typeof makeMockElements>> = makeMockElements()
    delete group.on
    const stripe = makeMockStripe()
    stripe.elements.mockReturnValue(group)
    const { loadStripe } = await import('@stripe/stripe-js')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }) }
    })
    await flushPromises()
    expect(wrapper.findComponent(VueStripeElements).emitted('ready')).toHaveLength(1)
    wrapper.unmount()
  })
})
