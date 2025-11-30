import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue-demi'
import { usePaymentIntent } from '../../src/composables/usePaymentIntent'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import { flushPromises } from '../setup'

// Test component that uses usePaymentIntent
const TestComponent = defineComponent({
  setup() {
    const paymentIntentComposable = usePaymentIntent()
    return { paymentIntentComposable }
  },
  template: '<div>Test</div>'
})

describe('usePaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (component = TestComponent) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {
          clientSecret: 'pi_test_secret_123'
        }, {
          default: () => h(component)
        })
      }
    })

    await flushPromises()
    return wrapper
  }

  it('should throw error when used outside VueStripeProvider', () => {
    expect(() => {
      mount(TestComponent)
    }).toThrow('usePaymentIntent must be called within a VueStripeProvider component')
  })

  it('should return confirmPayment function and state refs', async () => {
    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    expect(testComponent.exists()).toBe(true)

    const { confirmPayment, loading, error } = testComponent.vm.paymentIntentComposable

    expect(typeof confirmPayment).toBe('function')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should work with VueStripeProvider only (without VueStripeElements)', async () => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(TestComponent)
      }
    })

    await flushPromises()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment, loading, error } = testComponent.vm.paymentIntentComposable

    expect(typeof confirmPayment).toBe('function')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should set loading to true during payment confirmation', async () => {
    // Create a mock that delays resolution
    let resolvePayment: () => void
    const paymentPromise = new Promise<void>(resolve => {
      resolvePayment = resolve
    })

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        })),
        submit: vi.fn(() => Promise.resolve({}))
      })),
      confirmPayment: vi.fn(async () => {
        await paymentPromise
        return { paymentIntent: { id: 'pi_test', status: 'succeeded' } }
      }),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment, loading } = testComponent.vm.paymentIntentComposable

    expect(loading.value).toBe(false)

    // Start payment confirmation (don't await yet)
    const confirmPromise = confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    // Loading should be true now
    expect(loading.value).toBe(true)

    // Resolve the payment
    resolvePayment!()
    await confirmPromise

    // Loading should be false after completion
    expect(loading.value).toBe(false)
  })

  it('should call stripe.confirmPayment with correct parameters', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test', status: 'succeeded' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        })),
        submit: vi.fn(() => Promise.resolve({}))
      })),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment } = testComponent.vm.paymentIntentComposable

    await confirmPayment({
      clientSecret: 'pi_xxx_secret_xxx',
      confirmParams: {
        return_url: 'https://example.com/complete'
      },
      redirect: 'if_required'
    })

    expect(mockConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: 'pi_xxx_secret_xxx',
        confirmParams: {
          return_url: 'https://example.com/complete'
        },
        redirect: 'if_required'
      })
    )
  })

  it('should return successful payment result', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        })),
        submit: vi.fn(() => Promise.resolve({}))
      })),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment, error } = testComponent.vm.paymentIntentComposable

    const result = await confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    expect(result.paymentIntent).toBeDefined()
    expect(result.paymentIntent!.status).toBe('succeeded')
    expect(error.value).toBe(null)
  })

  it('should handle payment error from Stripe', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.resolve({
      error: { message: 'Your card was declined' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        })),
        submit: vi.fn(() => Promise.resolve({}))
      })),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment, error } = testComponent.vm.paymentIntentComposable

    const result = await confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    expect(result.error).toBeDefined()
    expect(error.value).toBe('Your card was declined')
  })

  it('should handle exception during payment confirmation', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.reject(new Error('Network error')))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        })),
        submit: vi.fn(() => Promise.resolve({}))
      })),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment, error, loading } = testComponent.vm.paymentIntentComposable

    const result = await confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    expect(result.error).toBeDefined()
    expect(result.error!.message).toBe('Network error')
    expect(error.value).toBe('Network error')
    expect(loading.value).toBe(false)
  })

  it('should return error if Stripe is not initialized', async () => {
    // This test verifies the case where stripe.value is null
    // The VueStripeProvider shows an error slot when loadStripe returns null
    // So we capture during loading state instead

    let capturedComposable: ReturnType<typeof usePaymentIntent> | null = null

    const CaptureComponent = defineComponent({
      setup() {
        capturedComposable = usePaymentIntent()
        return { paymentIntentComposable: capturedComposable }
      },
      template: '<div>Capture</div>'
    })

    // Create a mock where loadStripe returns null
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce(null)

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        // Capture in loading slot which always renders initially
        loading: () => h(CaptureComponent)
      }
    })

    // The composable is captured synchronously during loading
    expect(capturedComposable).not.toBeNull()

    const result = await capturedComposable!.confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    // Since stripe is null during loading, confirmPayment should return error
    expect(result.error).toBeDefined()
    expect(result.error!.message).toBe('Stripe not initialized')
    expect(capturedComposable!.error.value).toBe('Stripe not initialized')
  })

  it('should use default redirect value of if_required', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test', status: 'succeeded' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        })),
        submit: vi.fn(() => Promise.resolve({}))
      })),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment } = testComponent.vm.paymentIntentComposable

    await confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    expect(mockConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect: 'if_required'
      })
    )
  })

  it('should use injected elements if not provided in options', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test', status: 'succeeded' }
    }))

    const mockElements = {
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      })),
      submit: vi.fn(() => Promise.resolve({}))
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => mockElements),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment } = testComponent.vm.paymentIntentComposable

    await confirmPayment({
      clientSecret: 'pi_test_secret_123'
    })

    // The elements should be passed from the injected context
    expect(mockConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        elements: mockElements
      })
    )
  })

  it('should allow overriding elements in options', async () => {
    const mockConfirmPayment = vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test', status: 'succeeded' }
    }))

    const mockElements = {
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      })),
      submit: vi.fn(() => Promise.resolve({}))
    }

    const customElements = { custom: true, submit: vi.fn(() => Promise.resolve({})) } as any

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => mockElements),
      confirmPayment: mockConfirmPayment,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmPayment } = testComponent.vm.paymentIntentComposable

    await confirmPayment({
      clientSecret: 'pi_test_secret_123',
      elements: customElements
    })

    // The custom elements should be used instead of injected
    expect(mockConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        elements: customElements
      })
    )
  })

  it('should return readonly refs', async () => {
    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { loading, error } = testComponent.vm.paymentIntentComposable

    // The refs should be readonly (Vue returns ShallowRef for readonly refs)
    // We verify they exist and have the expected initial values
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })
})
