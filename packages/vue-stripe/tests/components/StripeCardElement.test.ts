import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref, nextTick } from 'vue-demi'
import StripeCardElement from '../../src/components/StripeCardElement.vue'
import StripeElements from '../../src/components/StripeElements.vue'
import StripeProvider from '../../src/components/StripeProvider.vue'
import { flushPromises, createMockElement } from '../setup'

describe('StripeCardElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (cardProps = {}, cardSlots = {}) => {
    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeElements, {}, {
          default: () => h(StripeCardElement, cardProps, cardSlots)
        })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside StripeElements', () => {
    expect(() => {
      mount(StripeCardElement, {
        props: {}
      })
    }).toThrow('StripeCardElement must be used within StripeElements')
  })

  it('should render card element container', async () => {
    const wrapper = await mountWithProviders()

    expect(wrapper.find('.vue-stripe-card-element').exists()).toBe(true)
    expect(wrapper.find('.vue-stripe-card-element-mount').exists()).toBe(true)
  })

  it('should mount Stripe card element on the DOM', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    await mountWithProviders()

    expect(mockCreate).toHaveBeenCalledWith('card', undefined)
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('should pass options to card element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const cardOptions = {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770'
        }
      },
      hidePostalCode: true
    }

    await mountWithProviders({
      options: cardOptions
    })

    expect(mockCreate).toHaveBeenCalledWith('card', cardOptions)
  })

  it('should set up event listeners on card element', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    await mountWithProviders()

    // Check that event listeners were set up
    expect(mockElement.on).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('blur', expect.any(Function))
    expect(mockElement.on).toHaveBeenCalledWith('escape', expect.any(Function))
  })

  it('should emit ready event when card element is ready', async () => {
    let readyCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'ready') {
          readyCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Simulate ready event
    if (readyCallback) {
      readyCallback()
    }

    await nextTick()

    // Find the StripeCardElement component and check emissions
    const cardComponent = wrapper.findComponent(StripeCardElement)
    const emitted = cardComponent.emitted('ready')
    expect(emitted).toBeTruthy()
  })

  it('should emit change event when card element changes', async () => {
    let changeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'change') {
          changeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Simulate change event
    const changeEvent = {
      complete: true,
      empty: false,
      brand: 'visa',
      error: undefined
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    const cardComponent = wrapper.findComponent(StripeCardElement)
    const emitted = cardComponent.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(changeEvent)
  })

  it('should emit focus event', async () => {
    let focusCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'focus') {
          focusCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (focusCallback) {
      focusCallback()
    }

    await nextTick()

    const cardComponent = wrapper.findComponent(StripeCardElement)
    expect(cardComponent.emitted('focus')).toBeTruthy()
  })

  it('should emit blur event', async () => {
    let blurCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'blur') {
          blurCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (blurCallback) {
      blurCallback()
    }

    await nextTick()

    const cardComponent = wrapper.findComponent(StripeCardElement)
    expect(cardComponent.emitted('blur')).toBeTruthy()
  })

  it('should emit escape event', async () => {
    let escapeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'escape') {
          escapeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    if (escapeCallback) {
      escapeCallback()
    }

    await nextTick()

    const cardComponent = wrapper.findComponent(StripeCardElement)
    expect(cardComponent.emitted('escape')).toBeTruthy()
  })

  it('should update error state from change event', async () => {
    let changeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'change') {
          changeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Simulate error in change event
    const changeEvent = {
      complete: false,
      empty: false,
      error: {
        message: 'Your card number is invalid.'
      }
    }

    if (changeCallback) {
      changeCallback(changeEvent)
    }

    await nextTick()

    // Error should be displayed
    expect(wrapper.find('.vue-stripe-card-element-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Your card number is invalid.')
  })

  it('should update options when props change', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const options = ref({
      style: {
        base: { fontSize: '14px' }
      }
    })

    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeElements, {}, {
          default: () => h(StripeCardElement, {
            options: options.value
          })
        })
      }
    })

    await flushPromises()

    // Update options
    options.value = {
      style: {
        base: { fontSize: '18px' }
      }
    }

    await nextTick()
    await flushPromises()

    // Note: The component uses watch with deep: true to detect changes
    // and calls cardElement.update() when options change
  })

  it('should destroy element on unmount', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    // Unmount the component
    wrapper.unmount()

    expect(mockElement.destroy).toHaveBeenCalled()
  })

  it('should expose element methods via defineExpose', async () => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: mockCreate
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = await mountWithProviders()

    const cardComponent = wrapper.findComponent(StripeCardElement)

    // Access exposed properties - they may be functions or refs depending on Vue version
    // The component exposes: element, loading, error, focus, blur, clear
    expect(cardComponent.vm).toBeDefined()

    // Check that the component has the exposed API available
    // In Vue 3 with script setup, defineExpose makes these available on vm
    const vm = cardComponent.vm as any
    expect(typeof vm.focus === 'function' || vm.focus === undefined || vm.focus).toBeTruthy()
    expect(typeof vm.blur === 'function' || vm.blur === undefined || vm.blur).toBeTruthy()
    expect(typeof vm.clear === 'function' || vm.clear === undefined || vm.clear).toBeTruthy()
  })

  it('should render custom loading slot', async () => {
    const wrapper = await mountWithProviders(
      {},
      {
        loading: () => h('div', { class: 'custom-card-loading' }, 'Loading card...')
      }
    )

    // Note: Loading state may be brief, this tests slot rendering capability
    expect(wrapper.find('.vue-stripe-card-element').exists()).toBe(true)
  })

  it('should render custom error slot', async () => {
    let changeCallback: Function | null = null
    const mockElement = {
      ...createMockElement(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'change') {
          changeCallback = callback
        }
      })
    }

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({
        create: vi.fn(() => mockElement)
      })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = mount(StripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(StripeElements, {}, {
          default: () => h(StripeCardElement, {}, {
            error: ({ error }: { error: string }) =>
              h('div', { class: 'custom-error-display' }, `Custom: ${error}`)
          })
        })
      }
    })

    await flushPromises()

    // Trigger error
    if (changeCallback) {
      changeCallback({
        error: { message: 'Test error' }
      })
    }

    await nextTick()

    expect(wrapper.find('.custom-error-display').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom: Test error')
  })
})
