import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StripeProvider from '../../src/components/StripeProvider.vue'

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
})