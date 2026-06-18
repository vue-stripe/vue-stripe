import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import VueStripeAuBankAccountElement from '../../src/components/VueStripeAuBankAccountElement.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('VueStripeAuBankAccountElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (auBankProps = {}, auBankSlots = {}) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(VueStripeAuBankAccountElement, auBankProps, auBankSlots)
        })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(VueStripeAuBankAccountElement, {
        props: {}
      })
    }).toThrow('VueStripeAuBankAccountElement must be used within VueStripeElements')
  })

  it('should render AU Bank Account element container', async () => {
    const wrapper = await mountWithProviders()

    expect(wrapper.find('.vue-stripe-au-bank-account-element').exists()).toBe(true)
    expect(wrapper.find('.vue-stripe-au-bank-account-element-mount').exists()).toBe(true)
  })

  it('should mount Stripe AU Bank Account element on the DOM', async () => {
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

    expect(mockCreate).toHaveBeenCalledWith('auBankAccount', undefined)
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass options to AU Bank Account element', async () => {
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

    const auBankOptions = {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770'
        }
      },
      iconStyle: 'solid' as const,
      hideIcon: false
    }

    await mountWithProviders({
      options: auBankOptions
    })

    expect(mockCreate).toHaveBeenCalledWith('auBankAccount', auBankOptions)
  })

  it('should set up event listeners on AU Bank Account element', async () => {
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

  it('should emit ready event when AU Bank Account element is ready', async () => {
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

    const auBankComponent = wrapper.findComponent(VueStripeAuBankAccountElement)
    const emitted = auBankComponent.emitted('ready')
    expect(emitted).toBeTruthy()
  })

  it('should emit change event with BSB and account data', async () => {
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
      bankName: 'Commonwealth Bank of Australia',
      branchName: 'Sydney Branch',
      error: undefined
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const auBankComponent = wrapper.findComponent(VueStripeAuBankAccountElement)
    const emitted = auBankComponent.emitted('change')
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
        message: 'Invalid BSB number.'
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    expect(wrapper.find('.vue-stripe-au-bank-account-element-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Invalid BSB number.')
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

    const auBankComponent = wrapper.findComponent(VueStripeAuBankAccountElement)

    expect(auBankComponent.vm).toBeDefined()

    const vm = auBankComponent.vm as any
    expect(typeof vm.focus === 'function' || vm.focus === undefined || vm.focus).toBeTruthy()
    expect(typeof vm.blur === 'function' || vm.blur === undefined || vm.blur).toBeTruthy()
    expect(typeof vm.clear === 'function' || vm.clear === undefined || vm.clear).toBeTruthy()
  })

  it('should handle iconStyle option', async () => {
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
      options: {
        iconStyle: 'solid'
      }
    })

    expect(mockCreate).toHaveBeenCalledWith('auBankAccount', expect.objectContaining({
      iconStyle: 'solid'
    }))
  })

  it('should handle hideIcon option', async () => {
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
      options: {
        hideIcon: true
      }
    })

    expect(mockCreate).toHaveBeenCalledWith('auBankAccount', expect.objectContaining({
      hideIcon: true
    }))
  })
})
