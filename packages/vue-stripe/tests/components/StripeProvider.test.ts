import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, inject } from 'vue-demi'
import StripeProvider from '../../src/components/StripeProvider.vue'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises } from '../setup'

describe('StripeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: '<div>Payment Form</div>',
        loading: '<div>Custom Loading</div>'
      }
    })

    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Loading')
  })

  it('should render default content after successful load', async () => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: '<div>Payment Form</div>'
      }
    })

    // Wait for loading to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(false)
    expect(wrapper.text()).toContain('Payment Form')
  })

  it('should render error state when Stripe fails to load', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      },
      slots: {
        default: '<div>Payment Form</div>',
        error: '<div>Custom Error</div>'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.vue-stripe-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Error')
  })

  it('should pass correct options to loadStripe', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe

    mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123',
        stripeAccount: 'acct_123',
        apiVersion: '2023-10-16',
        locale: 'en-US'
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123', {
      stripeAccount: 'acct_123',
      apiVersion: '2023-10-16',
      locale: 'en-US'
    })
  })

  // === New Tests ===

  it('should emit load event with Stripe instance', async () => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      }
    })

    await flushPromises()

    const emitted = wrapper.emitted('load')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBeDefined() // Stripe instance
  })

  it('should emit error event when loading fails', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      }
    })

    await flushPromises()

    const emitted = wrapper.emitted('error')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBeInstanceOf(Error)
  })

  it('should provide stripe context to child components', async () => {
    let injectedContext: ReturnType<typeof inject<any>> = null

    const ChildComponent = {
      setup() {
        injectedContext = inject(stripeInjectionKey)
        return () => h('div', 'Child')
      }
    }

    mount(StripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () => h(ChildComponent)
      }
    })

    await flushPromises()

    expect(injectedContext).toBeDefined()
    expect(injectedContext!.stripe.value).toBeDefined()
    expect(injectedContext!.loading.value).toBe(false)
    expect(injectedContext!.error.value).toBe(null)
  })

  it('should accept stripeKey prop for backwards compatibility', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe

    const wrapper = mount(StripeProvider, {
      props: {
        stripeKey: 'pk_test_legacy'
      },
      slots: {
        default: '<div>Payment Form</div>'
      }
    })

    await flushPromises()

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_legacy', expect.any(Object))
    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(false)
  })

  it('should pass error message to error slot scope', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Custom error message'))

    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      },
      slots: {
        error: ({ error }: { error: string }) => h('div', { class: 'custom-error' }, error)
      }
    })

    await flushPromises()

    expect(wrapper.find('.custom-error').exists()).toBe(true)
    expect(wrapper.find('.custom-error').text()).toContain('Custom error message')
  })

  it('should throw error when no publishableKey or stripeKey provided', () => {
    expect(() => {
      mount(StripeProvider, {
        props: {}
      })
    }).toThrow('publishableKey or stripeKey is required')
  })
})