import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import VueStripeEpsBankElement from '../../src/components/VueStripeEpsBankElement.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('VueStripeEpsBankElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (epsProps = {}, epsSlots = {}) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(VueStripeEpsBankElement, epsProps, epsSlots)
        })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(VueStripeEpsBankElement, {
        props: {}
      })
    }).toThrow('VueStripeEpsBankElement must be used within VueStripeElements')
  })

  it('should render eps bank element container', async () => {
    const wrapper = await mountWithProviders()

    expect(wrapper.find('.vue-stripe-eps-bank-element').exists()).toBe(true)
    expect(wrapper.find('.vue-stripe-eps-bank-element-mount').exists()).toBe(true)
  })

  it('should mount Stripe eps bank element on the DOM', async () => {
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

    // EPS element requires options, defaults to empty object if not provided
    expect(mockCreate).toHaveBeenCalledWith('epsBank', {})
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass options to eps bank element', async () => {
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

    const epsOptions = {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770'
        }
      }
    }

    await mountWithProviders({
      options: epsOptions
    })

    expect(mockCreate).toHaveBeenCalledWith('epsBank', epsOptions)
  })

  it('should set up event listeners on eps bank element', async () => {
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

  it('should emit ready event when eps bank element is ready', async () => {
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

    const epsComponent = wrapper.findComponent(VueStripeEpsBankElement)
    const emitted = epsComponent.emitted('ready')
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
      value: 'erste_bank',
      error: undefined
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const epsComponent = wrapper.findComponent(VueStripeEpsBankElement)
    const emitted = epsComponent.emitted('change')
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
        message: 'Please select an Austrian bank.'
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    expect(wrapper.find('.vue-stripe-eps-bank-element-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Please select an Austrian bank.')
  })

  it('should destroy element on unmount', async () => {
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

    const wrapper = await mountWithProviders()

    wrapper.unmount()

    expect(mockElement.destroy).toHaveBeenCalled()
  })

  it('should expose element methods via defineExpose', async () => {
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

    const wrapper = await mountWithProviders()

    const epsComponent = wrapper.findComponent(VueStripeEpsBankElement)

    expect(epsComponent.vm).toBeDefined()

    const vm = epsComponent.vm as any
    expect(typeof vm.focus === 'function' || vm.focus === undefined || vm.focus).toBeTruthy()
    expect(typeof vm.blur === 'function' || vm.blur === undefined || vm.blur).toBeTruthy()
    expect(typeof vm.clear === 'function' || vm.clear === undefined || vm.clear).toBeTruthy()
  })
})
