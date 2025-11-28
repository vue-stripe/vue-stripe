import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, provide } from 'vue-demi'
import { useStripe } from '../../src/composables/useStripe'
import type { VueStripeOptions } from '../../src/types'

const TestComponent = defineComponent({
  setup() {
    const stripeComposable = useStripe()
    return { stripeComposable }
  },
  template: '<div>Test</div>'
})

const ProviderComponent = defineComponent({
  setup() {
    const config: VueStripeOptions = {
      publishableKey: 'pk_test_123'
    }
    provide('vue-stripe-config', config)
    return {}
  },
  template: '<div><test-component /></div>',
  components: { TestComponent }
})

describe('useStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when used outside StripeProvider', () => {
    expect(() => {
      mount(TestComponent)
    }).toThrow('[Vue Stripe] Configuration not found')
  })

  it('should initialize when provided with configuration', async () => {
    const wrapper = mount(ProviderComponent)
    const testComponent = wrapper.findComponent(TestComponent)
    
    expect(testComponent.exists()).toBe(true)
    
    // Wait for initialization
    await wrapper.vm.$nextTick()
    
    const { stripe, loading, error } = testComponent.vm.stripeComposable
    
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(stripe.value).toBeTruthy()
  })

  it('should handle initialization errors', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Failed to load'))
    
    const wrapper = mount(ProviderComponent)
    const testComponent = wrapper.findComponent(TestComponent)
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const { error, loading } = testComponent.vm.stripeComposable
    
    expect(loading.value).toBe(false)
    expect(error.value).toBe('Failed to load')
  })
})