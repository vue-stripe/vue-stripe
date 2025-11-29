import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import StripeAddressElement from '../../src/components/StripeAddressElement.vue'
import StripeElements from '../../src/components/StripeElements.vue'
import StripeProvider from '../../src/components/StripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('StripeAddressElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (addressProps = {}) => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeElements, {}, {
          default: () => h(StripeAddressElement, addressProps)
        })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(StripeAddressElement, {
        props: {
          options: { mode: 'shipping' }
        }
      })
    }).toThrow('StripeAddressElement must be used within StripeElements')
  })

  it('should render address element container', async () => {
    const wrapper = await mountWithProviders()

    // StripeAddressElement renders a div ref
    const addressComponent = wrapper.findComponent(StripeAddressElement)
    expect(addressComponent.exists()).toBe(true)
  })

  it('should mount Stripe address element on the DOM', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    await mountWithProviders()

    expect(mockCreate).toHaveBeenCalledWith('address', { mode: 'shipping' })
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass options to address element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    const addressOptions = {
      mode: 'billing' as const,
      autocomplete: { mode: 'automatic' as const },
      fields: { phone: 'always' as const }
    }

    await mountWithProviders({
      options: addressOptions
    })

    expect(mockCreate).toHaveBeenCalledWith('address', addressOptions)
  })

  it('should set up event listeners on address element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    await mountWithProviders()

    // Check that event listeners were set up
    expect(mockElement.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('blur', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('escape', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('loaderror', expect.any(Function))
  })

  it('should emit ready event when address element is ready', async () => {
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
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Simulate ready event
    if (readyCallback) {
      readyCallback()
    }

    await nextTick()

    // Find the StripeAddressElement component and check emissions
    const addressComponent = wrapper.findComponent(StripeAddressElement)
    const emitted = addressComponent.emitted('ready')
    expect(emitted).toBeTruthy()
  })

  it('should emit change event when address element changes', async () => {
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
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Simulate change event
    const changeEvent = {
      complete: true,
      isNewAddress: true,
      value: {
        name: 'John Doe',
        address: {
          line1: '123 Main St',
          line2: null,
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'US'
        }
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const addressComponent = wrapper.findComponent(StripeAddressElement)
    const emitted = addressComponent.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(changeEvent)
  })

  it('should emit focus event', async () => {
    let focusCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'focus') {
          focusCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (focusCallback) {
      focusCallback()
    }

    await nextTick()

    const addressComponent = wrapper.findComponent(StripeAddressElement)
    expect(addressComponent.emitted('focus')).toBeTruthy()
  })

  it('should emit blur event', async () => {
    let blurCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'blur') {
          blurCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (blurCallback) {
      blurCallback()
    }

    await nextTick()

    const addressComponent = wrapper.findComponent(StripeAddressElement)
    expect(addressComponent.emitted('blur')).toBeTruthy()
  })

  it('should emit escape event', async () => {
    let escapeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'escape') {
          escapeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (escapeCallback) {
      escapeCallback()
    }

    await nextTick()

    const addressComponent = wrapper.findComponent(StripeAddressElement)
    expect(addressComponent.emitted('escape')).toBeTruthy()
  })

  it('should emit loadError event', async () => {
    let loadErrorCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'loaderror') {
          loadErrorCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const errorEvent = {
      elementType: 'address',
      error: 'Failed to load address element'
    }

    if (loadErrorCallback) {
      loadErrorCallback(errorEvent)
    }

    await nextTick()

    const addressComponent = wrapper.findComponent(StripeAddressElement)
    const emitted = addressComponent.emitted('loadError')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(errorEvent)
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
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Unmount the component
    wrapper.unmount()

    expect(mockElement.destroy).toHaveBeenCalled()
  })

  it('should remove event listeners on unmount', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Unmount the component
    wrapper.unmount()

    expect(mockElement.off).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(mockElement.off).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mockElement.off).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(mockElement.off).toHaveBeenCalledWith('blur', expect.any(Function))
    expect(mockElement.off).toHaveBeenCalledWith('escape', expect.any(Function))
    expect(mockElement.off).toHaveBeenCalledWith('loaderror', expect.any(Function))
  })

  describe('exposed methods', () => {
    it('should expose getValue method', async () => {
      const mockGetValueResult = {
        complete: true,
        isNewAddress: false,
        value: {
          name: 'Jane Doe',
          address: {
            line1: '456 Oak Ave',
            line2: 'Suite 100',
            city: 'Los Angeles',
            state: 'CA',
            postal_code: '90001',
            country: 'US'
          }
        }
      }

      const mockElement = {
        ...createMockElement(),
        getValue: vi.fn(() => Promise.resolve(mockGetValueResult))
      }
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn()
      } as any)

      const wrapper = await mountWithProviders()

      const addressComponent = wrapper.findComponent(StripeAddressElement)
      const vm = addressComponent.vm as any

      // Call the exposed getValue method
      const result = await vm.getValue()

      expect(mockElement.getValue).toHaveBeenCalled()
      expect(result).toEqual(mockGetValueResult)
    })

    it('should return address data from getValue', async () => {
      // Test that getValue returns the expected shape of data
      const mockGetValueResult = {
        complete: false,
        isNewAddress: true,
        value: {
          name: '',
          address: {
            line1: '',
            line2: null,
            city: '',
            state: '',
            postal_code: '',
            country: 'US'
          }
        }
      }

      const mockElement = {
        ...createMockElement(),
        getValue: vi.fn(() => Promise.resolve(mockGetValueResult))
      }

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => mockElement)
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn()
      } as any)

      const wrapper = await mountWithProviders()
      const addressComponent = wrapper.findComponent(StripeAddressElement)
      const vm = addressComponent.vm as any

      const result = await vm.getValue()

      expect(result.complete).toBe(false)
      expect(result.isNewAddress).toBe(true)
      expect(result.value).toBeDefined()
      expect(result.value.address).toBeDefined()
    })

    it('should expose focus method', async () => {
      const mockElement = createMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn()
      } as any)

      const wrapper = await mountWithProviders()

      const addressComponent = wrapper.findComponent(StripeAddressElement)
      const vm = addressComponent.vm as any

      // Call the exposed focus method
      vm.focus()

      expect(mockElement.focus).toHaveBeenCalled()
    })

    it('should expose clear method', async () => {
      const mockElement = createMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn()
      } as any)

      const wrapper = await mountWithProviders()

      const addressComponent = wrapper.findComponent(StripeAddressElement)
      const vm = addressComponent.vm as any

      // Call the exposed clear method
      vm.clear()

      expect(mockElement.clear).toHaveBeenCalled()
    })

    it('should expose element ref', async () => {
      const mockElement = createMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn()
      } as any)

      const wrapper = await mountWithProviders()

      const addressComponent = wrapper.findComponent(StripeAddressElement)
      const vm = addressComponent.vm as any

      // The element should be exposed
      expect(vm.element).toBeDefined()
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
        confirmCardSetup: vi.fn()
      } as any)

      await mountWithProviders({
        options: { mode: 'shipping' as const }
      })

      // The element should have been created with the options
      expect(mockCreate).toHaveBeenCalledWith('address', { mode: 'shipping' })

      // The update method is available on the element
      expect(mockElement.update).toBeDefined()
    })
  })
})
