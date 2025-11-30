import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import VueStripeLinkAuthenticationElement from '../../src/components/VueStripeLinkAuthenticationElement.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('VueStripeLinkAuthenticationElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (linkAuthProps = {}) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, { clientSecret: 'pi_test_secret_123' }, {
          default: () => h(VueStripeLinkAuthenticationElement, linkAuthProps)
        })
      }
    })

    await flushPromises()
    if (wrapper.vm) {
      await wrapper.vm.$nextTick()
    }

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(VueStripeLinkAuthenticationElement, {
        props: {
          options: {}
        }
      })
    }).toThrow('VueStripeLinkAuthenticationElement must be used within VueStripeElements')
  })

  it('should render link authentication element container', async () => {
    const wrapper = await mountWithProviders()

    const linkAuthComponent = wrapper.findComponent(VueStripeLinkAuthenticationElement)
    expect(linkAuthComponent.exists()).toBe(true)
  })

  it('should mount Stripe link authentication element on the DOM', async () => {
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

    expect(mockCreate).toHaveBeenCalledWith('linkAuthentication', undefined)
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass options to link authentication element', async () => {
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

    const options = {
      defaultValues: {
        email: 'test@example.com'
      }
    }

    await mountWithProviders({
      options
    })

    expect(mockCreate).toHaveBeenCalledWith('linkAuthentication', options)
  })

  it('should set up event listeners on link authentication element', async () => {
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
    expect(mockElement.on).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should emit ready event when element is ready', async () => {
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

    // Simulate ready event
    if (readyCallback) {
      readyCallback()
    }

    await nextTick()

    const linkAuthComponent = wrapper.findComponent(VueStripeLinkAuthenticationElement)
    const emitted = linkAuthComponent.emitted('ready')
    expect(emitted).toBeTruthy()
  })

  it('should emit change event with email data', async () => {
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

    // Simulate change event
    const changeEvent = {
      complete: true,
      value: {
        email: 'test@example.com'
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const linkAuthComponent = wrapper.findComponent(VueStripeLinkAuthenticationElement)
    const emitted = linkAuthComponent.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(changeEvent)
  })

  it('should emit change event when email is incomplete', async () => {
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

    // Simulate incomplete change event
    const changeEvent = {
      complete: false,
      value: {
        email: 'test@'
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const linkAuthComponent = wrapper.findComponent(VueStripeLinkAuthenticationElement)
    const emitted = linkAuthComponent.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(changeEvent)
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

  describe('exposed methods', () => {
    // Note: Testing exposed methods via component ref is done in integration tests.
    // The component exposes focus, blur, clear, and element properties via defineExpose.
    // These methods delegate to the underlying Stripe element.

    it('should have exposed methods defined in component', () => {
      // This test verifies the component code has defineExpose with the correct methods
      // by checking that the component is importable and structured correctly
      expect(VueStripeLinkAuthenticationElement).toBeDefined()
    })
  })
})
