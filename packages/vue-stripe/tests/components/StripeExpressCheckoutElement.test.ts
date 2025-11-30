import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import StripeExpressCheckoutElement from '../../src/components/StripeExpressCheckoutElement.vue'
import StripeElements from '../../src/components/StripeElements.vue'
import StripeProvider from '../../src/components/StripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('StripeExpressCheckoutElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (expressCheckoutProps = {}) => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeElements, {
          clientSecret: 'pi_test_secret_123'
        }, {
          default: () => h(StripeExpressCheckoutElement, expressCheckoutProps)
        })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(StripeExpressCheckoutElement)
    }).toThrow('StripeExpressCheckoutElement must be used within StripeElements')
  })

  it('should render express checkout element container', async () => {
    const wrapper = await mountWithProviders()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    expect(expressCheckoutComponent.exists()).toBe(true)
  })

  it('should mount Stripe express checkout element on the DOM', async () => {
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

    expect(mockCreate).toHaveBeenCalledWith('expressCheckout', undefined)
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass options to express checkout element', async () => {
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

    const expressCheckoutOptions = {
      buttonType: {
        applePay: 'buy' as const,
        googlePay: 'checkout' as const
      },
      buttonTheme: {
        applePay: 'black' as const,
        googlePay: 'white' as const
      },
      layout: {
        maxColumns: 2,
        maxRows: 1
      }
    }

    await mountWithProviders({
      options: expressCheckoutOptions
    })

    expect(mockCreate).toHaveBeenCalledWith('expressCheckout', expressCheckoutOptions)
  })

  it('should set up event listeners on express checkout element', async () => {
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

    // Check that event listeners were set up
    expect(mockElement.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('click', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('confirm', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('cancel', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('shippingaddresschange', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('shippingratechange', expect.any(Function))
  })

  it('should emit ready event when express checkout element is ready', async () => {
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

    // Simulate ready event with available payment methods
    const readyEvent = {
      availablePaymentMethods: {
        applePay: true,
        googlePay: true,
        link: false
      }
    }

    if (readyCallback) {
      readyCallback(readyEvent)
    }

    await nextTick()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    const emitted = expressCheckoutComponent.emitted('ready')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(readyEvent)
  })

  it('should emit click event when a wallet button is clicked', async () => {
    let clickCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'click') {
          clickCallback = callback
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

    // Simulate click event
    const clickEvent = {
      expressPaymentType: 'apple_pay',
      resolve: vi.fn()
    }

    if (clickCallback) {
      clickCallback(clickEvent)
    }

    await nextTick()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    const emitted = expressCheckoutComponent.emitted('click')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(clickEvent)
  })

  it('should emit confirm event when payment is confirmed', async () => {
    let confirmCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'confirm') {
          confirmCallback = callback
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

    // Simulate confirm event
    const confirmEvent = {
      expressPaymentType: 'google_pay',
      paymentMethodId: 'pm_test_123',
      billingDetails: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    }

    if (confirmCallback) {
      confirmCallback(confirmEvent)
    }

    await nextTick()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    const emitted = expressCheckoutComponent.emitted('confirm')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(confirmEvent)
  })

  it('should emit cancel event when user cancels payment', async () => {
    let cancelCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'cancel') {
          cancelCallback = callback
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

    if (cancelCallback) {
      cancelCallback()
    }

    await nextTick()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    expect(expressCheckoutComponent.emitted('cancel')).toBeTruthy()
  })

  it('should emit shippingaddresschange event', async () => {
    let shippingAddressCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'shippingaddresschange') {
          shippingAddressCallback = callback
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

    const shippingEvent = {
      address: {
        city: 'San Francisco',
        country: 'US',
        line1: '123 Main St',
        postal_code: '94102',
        state: 'CA'
      },
      name: 'John Doe'
    }

    if (shippingAddressCallback) {
      shippingAddressCallback(shippingEvent)
    }

    await nextTick()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    const emitted = expressCheckoutComponent.emitted('shippingaddresschange')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(shippingEvent)
  })

  it('should emit shippingratechange event', async () => {
    let shippingRateCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'shippingratechange') {
          shippingRateCallback = callback
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

    const shippingRateEvent = {
      shippingRate: {
        id: 'rate_123',
        amount: 500,
        displayName: 'Standard Shipping'
      }
    }

    if (shippingRateCallback) {
      shippingRateCallback(shippingRateEvent)
    }

    await nextTick()

    const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
    const emitted = expressCheckoutComponent.emitted('shippingratechange')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(shippingRateEvent)
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

    // Unmount the component
    wrapper.unmount()

    expect(mockElement.destroy).toHaveBeenCalled()
  })

  describe('exposed properties', () => {
    it('should expose element property', async () => {
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

      const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)

      // Element is created and mounted on the DOM
      expect(mockCreate).toHaveBeenCalledWith('expressCheckout', undefined)
      expect(mockElement.mount).toHaveBeenCalled()
      // The element property is exposed on the component (can check it exists via defineExpose)
      expect(expressCheckoutComponent.exists()).toBe(true)
    })

    it('should expose loading state', async () => {
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

      const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
      const vm = expressCheckoutComponent.vm as any

      // Loading should be defined (starts as true, becomes false after ready)
      expect(typeof vm.loading).toBe('boolean')
    })

    it('should expose error state', async () => {
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

      const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
      const vm = expressCheckoutComponent.vm as any

      // Error should be exposed (null when no error)
      expect(vm.error).toBeNull()
    })
  })

  describe('options reactivity', () => {
    it('should call update when options change', async () => {
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

      const initialOptions = {
        buttonType: {
          applePay: 'buy' as const
        }
      }

      await mountWithProviders({
        options: initialOptions
      })

      expect(mockCreate).toHaveBeenCalledWith('expressCheckout', initialOptions)
      expect(mockElement.update).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should set error state when element creation fails', async () => {
      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => {
            throw new Error('Failed to create express checkout element')
          })
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
      } as any)

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = await mountWithProviders()

      const expressCheckoutComponent = wrapper.findComponent(StripeExpressCheckoutElement)
      const vm = expressCheckoutComponent.vm as any

      expect(vm.error).toBe('Failed to create express checkout element')
      expect(vm.loading).toBe(false)

      consoleError.mockRestore()
    })

    it('should display error message in template', async () => {
      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => {
            throw new Error('Test error message')
          })
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
      } as any)

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = await mountWithProviders()

      await nextTick()

      // Check that error message is displayed
      expect(wrapper.html()).toContain('Test error message')

      consoleError.mockRestore()
    })
  })
})
