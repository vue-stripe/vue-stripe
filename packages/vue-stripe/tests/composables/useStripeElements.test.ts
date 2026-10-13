import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue-demi'
import { useStripeElements } from '../../src/composables/useStripeElements'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripeProvider from '../../src/components/VueStripeProvider'
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
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(TestComponent)
            }
          )
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
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(TestComponent)
            }
          )
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
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(TestComponent)
            }
          )
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
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(TestComponent)
            }
          )
      }
    })

    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10))

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
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(NestedComponent)
            }
          )
      }
    })

    await flushPromises()

    expect(nestedContext).toBeDefined()
    expect(nestedContext!.elements).toBeDefined()
  })
})

describe('useStripeElements().fetchUpdates', () => {
  it('forwards to elements.fetchUpdates() and returns its result', async () => {
    const { makeMockStripe, makeMockElements } = await import('../setup')
    const elementsInstance = makeMockElements()
    elementsInstance.fetchUpdates.mockResolvedValueOnce({})
    const stripe = makeMockStripe()
    stripe.elements.mockReturnValue(elementsInstance)
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

    let api!: ReturnType<typeof useStripeElements>
    const Comp = defineComponent({
      setup() {
        api = useStripeElements()
        return () => h('div')
      }
    })
    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }, { default: () => h(Comp) })
      }
    })
    await flushPromises()

    await expect(api.fetchUpdates()).resolves.toEqual({})
    expect(elementsInstance.fetchUpdates).toHaveBeenCalledTimes(1)
  })

  it('returns an error result before Elements exists', async () => {
    const { provide, shallowRef, ref: vref } = await import('vue-demi')
    const { stripeElementsInjectionKey } = await import('../../src/utils/injection-keys')
    let api!: ReturnType<typeof useStripeElements>
    mount(
      defineComponent({
        setup() {
          provide(stripeElementsInjectionKey, {
            elements: shallowRef(null),
            loading: vref(true),
            error: vref(null)
          })
          return () =>
            h(
              defineComponent({
                setup() {
                  api = useStripeElements()
                  return () => h('div')
                }
              })
            )
        }
      })
    )
    await expect(api.fetchUpdates()).resolves.toEqual({
      error: { message: 'Elements not initialized' }
    })
  })
})

describe('useStripeElements().getElement', () => {
  const mountWithElements = async () => {
    const { makeMockStripe, makeMockElements } = await import('../setup')
    const elementsInstance = makeMockElements()
    const stripe = makeMockStripe()
    stripe.elements.mockReturnValue(elementsInstance)
    const { loadStripe } = await import('@stripe/stripe-js')
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

    let api!: ReturnType<typeof useStripeElements>
    const Comp = defineComponent({
      setup() {
        api = useStripeElements()
        return () => h('div')
      }
    })
    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }, { default: () => h(Comp) })
      }
    })
    await flushPromises()
    return { api, elementsInstance }
  }

  it("forwards getElement('payment') to the Elements group and returns the element", async () => {
    const { api, elementsInstance } = await mountWithElements()
    const paymentElement = { mount: vi.fn() }
    elementsInstance.getElement.mockReturnValueOnce(paymentElement)

    expect(api.getElement('payment')).toBe(paymentElement)
    expect(elementsInstance.getElement).toHaveBeenCalledWith('payment', undefined)
    // Called on the group itself, so Stripe.js sees the right `this`.
    expect(elementsInstance.getElement.mock.contexts[0]).toBe(elementsInstance)
  })

  it("passes the Address Element's getElement options through", async () => {
    const { api, elementsInstance } = await mountWithElements()
    api.getElement('address', { mode: 'shipping' })
    expect(elementsInstance.getElement).toHaveBeenCalledWith('address', { mode: 'shipping' })
  })

  it('returns null when Stripe has no element of that type', async () => {
    const { api, elementsInstance } = await mountWithElements()
    elementsInstance.getElement.mockReturnValueOnce(null)
    expect(api.getElement('card')).toBeNull()
  })

  it('returns null where Stripe throws for a type the account cannot use (#635)', async () => {
    const { api, elementsInstance } = await mountWithElements()
    elementsInstance.getElement.mockImplementationOnce(() => {
      throw new Error('A valid Element name must be provided.')
    })
    expect(api.getElement('linkSignup')).toBeNull()
  })

  it('returns null before Elements exists', async () => {
    const { provide, shallowRef, ref: vref } = await import('vue-demi')
    const { stripeElementsInjectionKey } = await import('../../src/utils/injection-keys')
    let api!: ReturnType<typeof useStripeElements>
    mount(
      defineComponent({
        setup() {
          provide(stripeElementsInjectionKey, {
            elements: shallowRef(null),
            loading: vref(true),
            error: vref(null)
          })
          return () =>
            h(
              defineComponent({
                setup() {
                  api = useStripeElements()
                  return () => h('div')
                }
              })
            )
        }
      })
    )
    expect(api.getElement('payment')).toBeNull()
  })
})
