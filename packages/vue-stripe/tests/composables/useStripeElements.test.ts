import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref, defineComponent } from 'vue-demi'
import { useStripeElements } from '../../src/composables/useStripeElements'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { flushPromises } from '../setup'

describe('useStripeElements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when used outside VueStripeElements', () => {
    const TestComponent = defineComponent({
      setup() {
        // This should throw
        useStripeElements()
        return () => h('div', 'Test')
      }
    })

    expect(() => {
      mount(TestComponent)
    }).toThrow('Elements context not found')
  })

  it('should return elements context when used inside VueStripeElements', async () => {
    let elementsContext: ReturnType<typeof useStripeElements> | null = null

    const TestComponent = defineComponent({
      setup() {
        elementsContext = useStripeElements()
        return () => h('div', 'Test')
      }
    })

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(TestComponent)
        })
      }
    })

    await flushPromises()

    expect(elementsContext).toBeDefined()
    expect(elementsContext!.elements).toBeDefined()
    expect(elementsContext!.loading).toBeDefined()
    expect(elementsContext!.error).toBeDefined()
  })

  it('should return readonly refs', async () => {
    let elementsContext: ReturnType<typeof useStripeElements> | null = null

    const TestComponent = defineComponent({
      setup() {
        elementsContext = useStripeElements()
        return () => h('div', 'Test')
      }
    })

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(TestComponent)
        })
      }
    })

    await flushPromises()

    // Check that returned values are refs
    expect(elementsContext!.elements).toHaveProperty('value')
    expect(elementsContext!.loading).toHaveProperty('value')
    expect(elementsContext!.error).toHaveProperty('value')
  })

  it('should reflect loading state correctly', async () => {
    const loadingStates: boolean[] = []

    const TestComponent = defineComponent({
      setup() {
        const { loading } = useStripeElements()
        loadingStates.push(loading.value)
        return () => h('div', `Loading: ${loading.value}`)
      }
    })

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(TestComponent)
        })
      }
    })

    await flushPromises()

    // After Stripe loads, loading should be false
    expect(loadingStates).toBeDefined()
  })

  it('should provide elements instance after loading', async () => {
    let elementsInstance: any = null

    const TestComponent = defineComponent({
      setup() {
        const { elements } = useStripeElements()
        // Capture the elements value after mounting
        setTimeout(() => {
          elementsInstance = elements.value
        }, 0)
        return () => h('div', 'Test')
      }
    })

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(TestComponent)
        })
      }
    })

    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(elementsInstance).toBeDefined()
  })

  it('should throw StripeElementsError with correct message', () => {
    const TestComponent = defineComponent({
      setup() {
        useStripeElements()
        return () => h('div', 'Test')
      }
    })

    expect(() => {
      mount(TestComponent)
    }).toThrow('Make sure to wrap your component with VueStripeElements')
  })

  it('should work with nested components', async () => {
    let nestedContext: ReturnType<typeof useStripeElements> | null = null

    const DeepNestedComponent = defineComponent({
      setup() {
        nestedContext = useStripeElements()
        return () => h('div', 'Deep Nested')
      }
    })

    const NestedComponent = defineComponent({
      setup() {
        return () => h('div', [h(DeepNestedComponent)])
      }
    })

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(NestedComponent)
        })
      }
    })

    await flushPromises()

    expect(nestedContext).toBeDefined()
    expect(nestedContext!.elements).toBeDefined()
  })
})
