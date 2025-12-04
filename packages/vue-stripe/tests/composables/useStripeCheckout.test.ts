import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue-demi'
import { useStripeCheckout } from '../../src/composables/useStripeCheckout'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { flushPromises } from '../setup'

// Get the mocked loadStripe
const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe

// Test component that uses useStripeCheckout
const TestComponent = defineComponent({
  setup() {
    const checkoutComposable = useStripeCheckout()
    return { checkoutComposable }
  },
  template: '<div>Test</div>'
})

describe('useStripeCheckout', () => {
  let mockRedirectToCheckout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirectToCheckout = vi.fn().mockResolvedValue({})

    // Reset to default mock implementation with redirectToCheckout
    mockLoadStripe.mockResolvedValue({
      redirectToCheckout: mockRedirectToCheckout,
      elements: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)
  })

  // Helper to mount with VueStripeProvider
  const mountWithProvider = async (component = TestComponent) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(component)
      }
    })

    await flushPromises()
    return wrapper
  }

  it('should throw error when used outside VueStripeProvider', () => {
    // useStripeCheckout internally calls useStripe, so the error comes from useStripe
    expect(() => {
      mount(TestComponent)
    }).toThrow('useStripe must be called within a VueStripeProvider component')
  })

  it('should return redirectToCheckout function and state refs', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    expect(testComponent.exists()).toBe(true)

    const { redirectToCheckout, loading, error } = testComponent.vm.checkoutComposable

    expect(typeof redirectToCheckout).toBe('function')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should set loading to true during checkout redirect', async () => {
    let resolveCheckout: () => void
    const checkoutPromise = new Promise<void>(resolve => {
      resolveCheckout = resolve
    })

    mockRedirectToCheckout.mockImplementation(async () => {
      await checkoutPromise
      return {}
    })

    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout, loading } = testComponent.vm.checkoutComposable

    expect(loading.value).toBe(false)

    // Start checkout redirect (don't await yet)
    const redirectPromise = redirectToCheckout({
      sessionId: 'cs_test_123'
    })

    // Loading should be true now
    expect(loading.value).toBe(true)

    // Resolve the checkout
    resolveCheckout!()
    await redirectPromise

    // Loading should be false after completion
    expect(loading.value).toBe(false)
  })

  it('should call stripe.redirectToCheckout with sessionId', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout } = testComponent.vm.checkoutComposable

    await redirectToCheckout({
      sessionId: 'cs_test_session_123'
    })

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'cs_test_session_123'
      })
    )
  })

  it('should call stripe.redirectToCheckout with lineItems and mode', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout } = testComponent.vm.checkoutComposable

    await redirectToCheckout({
      lineItems: [{ price: 'price_123', quantity: 2 }],
      mode: 'subscription',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    })

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [{ price: 'price_123', quantity: 2 }],
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })
    )
  })

  it('should handle checkout redirect error from Stripe', async () => {
    mockRedirectToCheckout.mockResolvedValue({
      error: { message: 'Session expired' }
    })

    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout, error } = testComponent.vm.checkoutComposable

    await expect(redirectToCheckout({
      sessionId: 'cs_test_123'
    })).rejects.toThrow('Session expired')

    expect(error.value).toBe('Session expired')
  })

  it('should handle exception during checkout redirect', async () => {
    mockRedirectToCheckout.mockRejectedValue(new Error('Network error'))

    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout, error, loading } = testComponent.vm.checkoutComposable

    await expect(redirectToCheckout({
      sessionId: 'cs_test_123'
    })).rejects.toThrow('Network error')

    expect(error.value).toBe('Network error')
    expect(loading.value).toBe(false)
  })

  it('should throw error if Stripe is not initialized and no URL provided', async () => {
    // Capture the composable during the loading phase when stripe is not yet initialized
    let capturedComposable: ReturnType<typeof useStripeCheckout> | null = null

    const CaptureComponent = defineComponent({
      setup() {
        capturedComposable = useStripeCheckout()
        return { checkoutComposable: capturedComposable }
      },
      template: '<div>Capture</div>'
    })

    // Create a mock where loadStripe returns null (no redirectToCheckout method)
    mockLoadStripe.mockResolvedValue(null)

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        // Capture in loading slot which renders during initialization
        loading: () => h(CaptureComponent)
      }
    })

    expect(capturedComposable).not.toBeNull()

    // Should throw when trying to use legacy redirectToCheckout while stripe is null
    // The error message should mention that redirectToCheckout is not available (v8.x behavior)
    await expect(capturedComposable!.redirectToCheckout({
      sessionId: 'cs_test_123'
    })).rejects.toThrow('redirectToCheckout is not available')
  })

  it('should redirect using URL (v8.x compatible)', async () => {
    // Mock window.location.replace
    const originalReplace = window.location.replace
    const mockReplace = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, replace: mockReplace },
      writable: true
    })

    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout } = testComponent.vm.checkoutComposable

    await redirectToCheckout({
      url: 'https://checkout.stripe.com/pay/cs_test_123'
    })

    expect(mockReplace).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_test_123')

    // Restore
    Object.defineProperty(window, 'location', {
      value: { ...window.location, replace: originalReplace },
      writable: true
    })
  })

  it('should have redirectToUrl helper for v8.x', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToUrl } = testComponent.vm.checkoutComposable

    expect(typeof redirectToUrl).toBe('function')
  })

  it('should return readonly refs', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { loading, error } = testComponent.vm.checkoutComposable

    // Verify refs have expected initial values
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should clear error on successful redirect', async () => {
    // First, simulate an error
    mockRedirectToCheckout.mockResolvedValueOnce({
      error: { message: 'Session expired' }
    })

    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout, error } = testComponent.vm.checkoutComposable

    // First call fails
    try {
      await redirectToCheckout({ sessionId: 'cs_test_123' })
    } catch {
      // Expected to throw
    }

    expect(error.value).toBe('Session expired')

    // Second call succeeds
    mockRedirectToCheckout.mockResolvedValueOnce({})

    await redirectToCheckout({ sessionId: 'cs_test_456' })

    expect(error.value).toBe(null)
  })

  it('should support customer email parameter', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout } = testComponent.vm.checkoutComposable

    await redirectToCheckout({
      lineItems: [{ price: 'price_123', quantity: 1 }],
      mode: 'payment',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'customer@example.com'
    })

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'customer@example.com'
      })
    )
  })

  it('should support client reference ID parameter', async () => {
    const wrapper = await mountWithProvider()

    const testComponent = wrapper.findComponent(TestComponent)
    const { redirectToCheckout } = testComponent.vm.checkoutComposable

    await redirectToCheckout({
      sessionId: 'cs_test_123',
      clientReferenceId: 'order_12345'
    })

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        clientReferenceId: 'order_12345'
      })
    )
  })
})
