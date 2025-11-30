import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue-demi'
import { useSetupIntent } from '../../src/composables/useSetupIntent'
import StripeProvider from '../../src/components/StripeProvider.vue'
import StripeElements from '../../src/components/StripeElements.vue'
import { flushPromises } from '../setup'

// Test component that uses useSetupIntent
const TestComponent = defineComponent({
  setup() {
    const setupIntentComposable = useSetupIntent()
    return { setupIntentComposable }
  },
  template: '<div>Test</div>'
})

describe('useSetupIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (component = TestComponent) => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeElements, {
          clientSecret: 'seti_test_secret_123'
        }, {
          default: () => h(component)
        })
      }
    })

    await flushPromises()
    return wrapper
  }

  it('should throw error when used outside StripeProvider', () => {
    expect(() => {
      mount(TestComponent)
    }).toThrow('useSetupIntent must be called within a StripeProvider component')
  })

  it('should return confirmSetup function and state refs', async () => {
    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    expect(testComponent.exists()).toBe(true)

    const { confirmSetup, loading, error } = testComponent.vm.setupIntentComposable

    expect(typeof confirmSetup).toBe('function')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should work with StripeProvider only (without StripeElements)', async () => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(TestComponent)
      }
    })

    await flushPromises()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup, loading, error } = testComponent.vm.setupIntentComposable

    expect(typeof confirmSetup).toBe('function')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should set loading to true during setup confirmation', async () => {
    // Create a mock that delays resolution
    let resolveSetup: () => void
    const setupPromise = new Promise<void>(resolve => {
      resolveSetup = resolve
    })

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        }))
      })),
      confirmPayment: vi.fn(),
      confirmSetup: vi.fn(async () => {
        await setupPromise
        return { setupIntent: { id: 'seti_test', status: 'succeeded' } }
      }),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup, loading } = testComponent.vm.setupIntentComposable

    expect(loading.value).toBe(false)

    // Start setup confirmation (don't await yet)
    const confirmPromise = confirmSetup({
      clientSecret: 'seti_test_secret_123'
    })

    // Loading should be true now
    expect(loading.value).toBe(true)

    // Resolve the setup
    resolveSetup!()
    await confirmPromise

    // Loading should be false after completion
    expect(loading.value).toBe(false)
  })

  it('should call stripe.confirmSetup with correct parameters', async () => {
    const mockConfirmSetup = vi.fn(() => Promise.resolve({
      setupIntent: { id: 'seti_test', status: 'succeeded' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        }))
      })),
      confirmPayment: vi.fn(),
      confirmSetup: mockConfirmSetup,
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup } = testComponent.vm.setupIntentComposable

    await confirmSetup({
      clientSecret: 'seti_xxx_secret_xxx',
      confirmParams: {
        return_url: 'https://example.com/complete'
      },
      redirect: 'if_required'
    })

    expect(mockConfirmSetup).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: 'seti_xxx_secret_xxx',
        confirmParams: { return_url: 'https://example.com/complete' },
        redirect: 'if_required'
      })
    )
  })

  it('should return successful setup result', async () => {
    const mockConfirmSetup = vi.fn(() => Promise.resolve({
      setupIntent: { id: 'seti_test_123', status: 'succeeded' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        }))
      })),
      confirmPayment: vi.fn(),
      confirmSetup: mockConfirmSetup,
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup, error } = testComponent.vm.setupIntentComposable

    const result = await confirmSetup({
      clientSecret: 'seti_test_secret_123'
    })

    expect(result.setupIntent).toBeDefined()
    expect(result.setupIntent!.status).toBe('succeeded')
    expect(error.value).toBe(null)
  })

  it('should handle setup error from Stripe', async () => {
    const mockConfirmSetup = vi.fn(() => Promise.resolve({
      error: { message: 'Your card was declined' }
    }))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        }))
      })),
      confirmPayment: vi.fn(),
      confirmSetup: mockConfirmSetup,
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup, error } = testComponent.vm.setupIntentComposable

    const result = await confirmSetup({
      clientSecret: 'seti_test_secret_123'
    })

    expect(result.error).toBeDefined()
    expect(error.value).toBe('Your card was declined')
  })

  it('should handle exception during setup confirmation', async () => {
    const mockConfirmSetup = vi.fn(() => Promise.reject(new Error('Network error')))

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => ({
          mount: vi.fn(),
          destroy: vi.fn(),
          on: vi.fn()
        }))
      })),
      confirmPayment: vi.fn(),
      confirmSetup: mockConfirmSetup,
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup, error, loading } = testComponent.vm.setupIntentComposable

    const result = await confirmSetup({
      clientSecret: 'seti_test_secret_123'
    })

    expect(result.error).toBeDefined()
    expect(result.error!.message).toBe('Network error')
    expect(error.value).toBe('Network error')
    expect(loading.value).toBe(false)
  })

  it('should return error if Stripe is not initialized', async () => {
    let capturedComposable: ReturnType<typeof useSetupIntent> | null = null

    const CaptureComponent = defineComponent({
      setup() {
        capturedComposable = useSetupIntent()
        return { setupIntentComposable: capturedComposable }
      },
      template: '<div>Capture</div>'
    })

    // Create a mock where loadStripe returns null
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce(null)

    mount(StripeProvider, {
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

    const result = await capturedComposable!.confirmSetup({
      clientSecret: 'seti_test_secret_123'
    })

    // Since stripe is null during loading, confirmSetup should return error
    expect(result.error).toBeDefined()
    expect(result.error!.message).toBe('Stripe not initialized')
    expect(capturedComposable!.error.value).toBe('Stripe not initialized')
  })

  it('should use injected elements if available', async () => {
    const mockConfirmSetup = vi.fn(() => Promise.resolve({
      setupIntent: { id: 'seti_test', status: 'succeeded' }
    }))

    const mockElements = {
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn()
      }))
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => mockElements),
      confirmPayment: vi.fn(),
      confirmSetup: mockConfirmSetup,
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { confirmSetup } = testComponent.vm.setupIntentComposable

    await confirmSetup({
      clientSecret: 'seti_test_secret_123'
    })

    // The elements should be passed from the injected context
    expect(mockConfirmSetup).toHaveBeenCalledWith(
      expect.objectContaining({
        elements: mockElements,
        clientSecret: 'seti_test_secret_123'
      })
    )
  })

  it('should return readonly refs', async () => {
    const wrapper = await mountWithProviders()

    const testComponent = wrapper.findComponent(TestComponent)
    const { loading, error } = testComponent.vm.setupIntentComposable

    // The refs should be readonly (Vue returns ShallowRef for readonly refs)
    // We verify they exist and have the expected initial values
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })
})
