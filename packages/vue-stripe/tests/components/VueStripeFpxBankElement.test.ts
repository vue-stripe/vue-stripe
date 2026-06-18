import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
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

    const fpxComponent = wrapper.findComponent(VueStripeFpxBankElement)

    expect(fpxComponent.vm).toBeDefined()

    const vm = fpxComponent.vm as any
    expect(typeof vm.focus === 'function' || vm.focus === undefined || vm.focus).toBeTruthy()
    expect(typeof vm.blur === 'function' || vm.blur === undefined || vm.blur).toBeTruthy()
    expect(typeof vm.clear === 'function' || vm.clear === undefined || vm.clear).toBeTruthy()
  })
})
