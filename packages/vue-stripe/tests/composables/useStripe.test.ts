import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, h } from 'vue-demi'
import { useStripe } from '../../src/composables/useStripe'
import StripeProvider from '../../src/components/StripeProvider.vue'
import { flushPromises } from '../setup'

// Simple component that uses useStripe
const TestComponent = defineComponent({
  setup() {
    const stripeComposable = useStripe()
    return { stripeComposable }
  },
  template: '<div>Test</div>'
})

describe('useStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when used outside StripeProvider', () => {
    expect(() => {
      mount(TestComponent)
    }).toThrow('useStripe must be called within a StripeProvider component')
  })

  it('should return stripe context when used inside StripeProvider', async () => {
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
    expect(testComponent.exists()).toBe(true)

    const { stripe, loading, error } = testComponent.vm.stripeComposable

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(stripe.value).toBeDefined()
  })

  it('should reflect error state when Stripe fails to load', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Network error'))

    // Use the loading slot to capture context, since it renders initially
    let capturedContext: ReturnType<typeof useStripe> | null = null
    const CaptureComponent = defineComponent({
      setup() {
        capturedContext = useStripe()
        return {}
      },
      template: '<div>Loading...</div>'
    })

    mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      },
      slots: {
        loading: () => h(CaptureComponent),
        error: () => h('div', 'Error occurred')
      }
    })

    // Context is captured synchronously during loading state
    expect(capturedContext).not.toBe(null)

    // Wait for error to occur
    await flushPromises()

    // The context refs should reflect the error state
    expect(capturedContext!.loading.value).toBe(false)
    expect(capturedContext!.error.value).toContain('Network error')
    expect(capturedContext!.stripe.value).toBe(null)
  })
})
