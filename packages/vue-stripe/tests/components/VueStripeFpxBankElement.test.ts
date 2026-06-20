import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, defineComponent, ref } from 'vue-demi'
import VueStripeFpxBankElement from '../../src/components/VueStripeFpxBankElement.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('VueStripeFpxBankElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (fpxProps = {}, fpxSlots = {}) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(VueStripeFpxBankElement, fpxProps, fpxSlots)
        })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(VueStripeFpxBankElement, {
        props: {}
      })
    }).toThrow('VueStripeFpxBankElement must be used within VueStripeElements')
  })

  it('should render FPX bank element container', async () => {
    const wrapper = await mountWithProviders()

    expect(wrapper.find('.vue-stripe-fpx-bank-element').exists()).toBe(true)
    expect(wrapper.find('.vue-stripe-fpx-bank-element-mount').exists()).toBe(true)
  })

  it('should mount Stripe FPX bank element on the DOM with default accountHolderType', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    await mountWithProviders()

    // FPX requires accountHolderType, default is 'individual'
    expect(mockCreate).toHaveBeenCalledWith('fpxBank', expect.objectContaining({
      accountHolderType: 'individual'
    }))
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass accountHolderType prop to FPX element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    await mountWithProviders({
      accountHolderType: 'company'
    })

    expect(mockCreate).toHaveBeenCalledWith('fpxBank', expect.objectContaining({
      accountHolderType: 'company'
    }))
  })

  it('should pass options to FPX bank element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const fpxOptions = {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770'
        }
      }
    }

    await mountWithProviders({
      accountHolderType: 'individual',
      options: fpxOptions
    })

    expect(mockCreate).toHaveBeenCalledWith('fpxBank', expect.objectContaining({
      ...fpxOptions,
      accountHolderType: 'individual'
    }))
  })

  it('should set up event listeners on FPX bank element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    await mountWithProviders()

    expect(mockElement.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('blur', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('escape', expect.any(Function))
  })

  it('should emit ready event when FPX bank element is ready', async () => {
    let readyCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'ready') {
          readyCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (readyCallback) {
      readyCallback()
    }

    await nextTick()

    const fpxComponent = wrapper.findComponent(VueStripeFpxBankElement)
    const emitted = fpxComponent.emitted('ready')
    expect(emitted).toBeTruthy()
  })

  it('should emit change event with bank selection data', async () => {
    let changeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'change') {
          changeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const changeEvent = {
      complete: true,
      empty: false,
      value: 'affin_bank',
      error: undefined
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const fpxComponent = wrapper.findComponent(VueStripeFpxBankElement)
    const emitted = fpxComponent.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(changeEvent)
  })

  it('should update error state from change event', async () => {
    let changeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'change') {
          changeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const changeEvent = {
      complete: false,
      empty: false,
      error: {
        message: 'Please select a bank.'
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    expect(wrapper.find('.vue-stripe-fpx-bank-element-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Please select a bank.')
  })

  it('detaches listeners with .off() before destroy on unmount (#376)', async () => {
    const mockElement = createMockElement()

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    wrapper.unmount()

    // Every registered event is detached before destroy (named-handler cleanup).
    for (const event of ['ready', 'change', 'focus', 'blur', 'escape']) {
      expect(mockElement.off).toHaveBeenCalledWith(event, expect.any(Function))
    }
    expect(mockElement.destroy).toHaveBeenCalled()
  })

  it('re-merges options + accountHolderType into update() when props change', async () => {
    const mockElement = createMockElement()

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    // Harness owns reactive props so we can mutate them after mount.
    const Harness = defineComponent({
      setup() {
        return { accountHolderType: ref<'individual' | 'company'>('individual'), options: ref<Record<string, unknown>>({}) }
      },
      render() {
        return h(VueStripeProvider, { publishableKey: 'pk_test_123' }, {
          default: () => h(VueStripeElements, {}, {
            default: () => h(VueStripeFpxBankElement, { accountHolderType: this.accountHolderType, options: this.options })
          })
        })
      }
    })

    const wrapper = mount(Harness)
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Flip both the options and the account holder type.
    ;(wrapper.vm as any).accountHolderType = 'company'
    ;(wrapper.vm as any).options = { setupFutureUsage: 'off_session' }
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(mockElement.update).toHaveBeenCalledWith(
      expect.objectContaining({ setupFutureUsage: 'off_session', accountHolderType: 'company' })
    )
  })

  it('should expose element and methods via defineExpose', async () => {
    const mockElement = createMockElement()

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    // Capture the component's exposeProxy via a template ref (defineExpose
    // members aren't on the render proxy that findComponent().vm returns).
    const exposed = ref<any>(null)
    const Harness = defineComponent({
      setup() { return { exposed } },
      render() {
        return h(VueStripeProvider, { publishableKey: 'pk_test_123' }, {
          default: () => h(VueStripeElements, {}, {
            default: () => h(VueStripeFpxBankElement, { ref: (el: any) => { exposed.value = el } })
          })
        })
      }
    })
    mount(Harness)
    await flushPromises()
    await nextTick()

    const api = exposed.value
    expect(typeof api.focus).toBe('function')
    expect(typeof api.blur).toBe('function')
    expect(typeof api.clear).toBe('function')
    expect(api.element).toBeTruthy()
    expect(typeof api.element.mount).toBe('function')
    expect(typeof api.loading).toBe('boolean')
    expect(api.error).toBeNull()
  })
})
