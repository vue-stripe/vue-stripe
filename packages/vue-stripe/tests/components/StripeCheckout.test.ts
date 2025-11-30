import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue-demi'
import StripeCheckout from '../../src/components/StripeCheckout.vue'
import StripeProvider from '../../src/components/StripeProvider.vue'
import { flushPromises } from '../setup'

// Get the mocked loadStripe
const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe

describe('StripeCheckout', () => {
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

  // Helper to mount with StripeProvider
  const mountWithProvider = async (props = {}, slots = {}) => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeCheckout, props, slots)
      }
    })

    await flushPromises()
    return wrapper
  }

  it('should render checkout button with default text', async () => {
    const wrapper = await mountWithProvider({ sessionId: 'cs_test_123' })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Checkout')
  })

  it('should render checkout button with custom text', async () => {
    const wrapper = await mountWithProvider({
      sessionId: 'cs_test_123',
      buttonText: 'Buy Now'
    })

    const button = wrapper.find('button')
    expect(button.text()).toContain('Buy Now')
  })

  it('should apply custom button class', async () => {
    const wrapper = await mountWithProvider({
      sessionId: 'cs_test_123',
      buttonClass: 'my-custom-class'
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('my-custom-class')
  })

  it('should be disabled when disabled prop is true', async () => {
    const wrapper = await mountWithProvider({
      sessionId: 'cs_test_123',
      disabled: true
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('should emit error when sessionId and priceId are missing', async () => {
    const wrapper = await mountWithProvider({})

    const checkoutComponent = wrapper.findComponent(StripeCheckout)
    const button = wrapper.find('button')

    await button.trigger('click')
    await flushPromises()

    expect(checkoutComponent.emitted('error')).toBeTruthy()
    const errorEvent = checkoutComponent.emitted('error')![0][0] as Error
    expect(errorEvent.message).toContain('sessionId or priceId is required')
  })

  it('should emit click event when button is clicked', async () => {
    const wrapper = await mountWithProvider({ sessionId: 'cs_test_123' })

    const checkoutComponent = wrapper.findComponent(StripeCheckout)
    const button = wrapper.find('button')

    await button.trigger('click')
    await flushPromises()

    expect(checkoutComponent.emitted('click')).toBeTruthy()
  })

  it('should call redirectToCheckout with sessionId', async () => {
    const wrapper = await mountWithProvider({ sessionId: 'cs_test_session_123' })

    const button = wrapper.find('button')
    await button.trigger('click')
    await flushPromises()

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'cs_test_session_123'
      })
    )
  })

  it('should call redirectToCheckout with priceId and mode', async () => {
    const wrapper = await mountWithProvider({
      priceId: 'price_123',
      mode: 'subscription',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    })

    const button = wrapper.find('button')
    await button.trigger('click')
    await flushPromises()

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [{ price: 'price_123', quantity: 1 }],
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })
    )
  })

  it('should show loading text during redirect', async () => {
    let resolveRedirect: () => void
    const redirectPromise = new Promise<void>(resolve => {
      resolveRedirect = resolve
    })

    mockRedirectToCheckout.mockImplementation(() => redirectPromise.then(() => ({})))

    const wrapper = await mountWithProvider({
      sessionId: 'cs_test_123',
      loadingText: 'Please wait...'
    })

    const button = wrapper.find('button')

    // Click and check loading state (don't await)
    button.trigger('click')
    await wrapper.vm.$nextTick()

    expect(button.text()).toContain('Please wait...')
    expect(button.attributes('disabled')).toBeDefined()

    // Resolve the redirect
    resolveRedirect!()
    await flushPromises()
  })

  it('should emit error when redirectToCheckout fails', async () => {
    mockRedirectToCheckout.mockResolvedValue({
      error: { message: 'Session expired' }
    })

    const wrapper = await mountWithProvider({ sessionId: 'cs_test_123' })

    const checkoutComponent = wrapper.findComponent(StripeCheckout)
    const button = wrapper.find('button')

    await button.trigger('click')
    await flushPromises()

    expect(checkoutComponent.emitted('error')).toBeTruthy()
    const errorEvent = checkoutComponent.emitted('error')![0][0] as Error
    expect(errorEvent.message).toContain('Session expired')
  })

  it('should show error state when Stripe fails to load', async () => {
    // Override mock to return null for this test
    mockLoadStripe.mockResolvedValue(null)

    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeCheckout, { sessionId: 'cs_test_123' })
      }
    })

    await flushPromises()

    // StripeProvider shows error state when Stripe fails to load
    // The StripeCheckout component won't be rendered
    expect(wrapper.text()).toContain('Failed to initialize Stripe')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('should render custom slot content', async () => {
    const wrapper = await mountWithProvider(
      { sessionId: 'cs_test_123' },
      { default: () => h('span', { class: 'custom-content' }, 'Custom Button Text') }
    )

    expect(wrapper.find('.custom-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Button Text')
  })

  it('should include customerEmail when provided', async () => {
    const wrapper = await mountWithProvider({
      priceId: 'price_123',
      mode: 'payment',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'test@example.com'
    })

    const button = wrapper.find('button')
    await button.trigger('click')
    await flushPromises()

    expect(mockRedirectToCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'test@example.com'
      })
    )
  })
})
