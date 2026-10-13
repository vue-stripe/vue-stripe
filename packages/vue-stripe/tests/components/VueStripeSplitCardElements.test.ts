import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import VueStripeCardNumberElement from '../../src/components/VueStripeCardNumberElement'
import VueStripeCardExpiryElement from '../../src/components/VueStripeCardExpiryElement'
import VueStripeCardCvcElement from '../../src/components/VueStripeCardCvcElement'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { flushPromises, makeMockElement } from '../setup'

describe('Split Card Elements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to mount with full provider hierarchy
  const mountWithProviders = async (
    ElementComponent: any,
    elementProps = {},
    elementSlots = {}
  ) => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () => h(ElementComponent, elementProps, elementSlots)
            }
          )
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  describe('VueStripeCardNumberElement', () => {
    it('should throw error when used outside StripeElements', () => {
      expect(() => {
        mount(VueStripeCardNumberElement, {
          props: {}
        })
      }).toThrow('VueStripeCardNumberElement must be used within VueStripeElements')
    })

    it('should render card number element container', async () => {
      const wrapper = await mountWithProviders(VueStripeCardNumberElement)

      expect(wrapper.find('.vue-stripe-cardNumber-element').exists()).toBe(true)
      expect(wrapper.find('.vue-stripe-cardNumber-element-mount').exists()).toBe(true)
    })

    it('should create cardNumber type element', async () => {
      const mockElement = makeMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      await mountWithProviders(VueStripeCardNumberElement)

      expect(mockCreate).toHaveBeenCalledWith('cardNumber', {})
      expect(mockElement.mount).toHaveBeenCalled()
    })

    it('should pass options to card number element', async () => {
      const mockElement = makeMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const options = {
        style: {
          base: { fontSize: '16px' }
        },
        showIcon: true
      }

      await mountWithProviders(VueStripeCardNumberElement, { options })

      expect(mockCreate).toHaveBeenCalledWith('cardNumber', options)
    })

    it('should emit change event with brand information', async () => {
      let changeCallback: Function | null = null
      const mockElement = {
        ...makeMockElement(),
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'change') {
            changeCallback = callback
          }
        })
      }

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => mockElement)
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = await mountWithProviders(VueStripeCardNumberElement)

      const changeEvent = {
        complete: false,
        empty: false,
        brand: 'visa',
        error: undefined
      }

      if (changeCallback) {
        changeCallback(changeEvent)
      }

      await nextTick()

      const component = wrapper.findComponent(VueStripeCardNumberElement)
      const emitted = component.emitted('change')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toMatchObject({ brand: 'visa' })
    })

    it('should set up all event listeners', async () => {
      const mockElement = makeMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      await mountWithProviders(VueStripeCardNumberElement)

      expect(mockElement.on).toHaveBeenCalledWith('ready', expect.any(Function))
      expect(mockElement.on).toHaveBeenCalledWith('change', expect.any(Function))
      expect(mockElement.on).toHaveBeenCalledWith('focus', expect.any(Function))
      expect(mockElement.on).toHaveBeenCalledWith('blur', expect.any(Function))
      expect(mockElement.on).toHaveBeenCalledWith('escape', expect.any(Function))
    })

    // #661: Stripe.js declares both on cardNumber, as on card.
    it('re-emits networkschange and loaderror', async () => {
      const handlers: Record<string, (event: unknown) => void> = {}
      const mockElement = {
        ...makeMockElement(),
        on: vi.fn((event: string, handler: (event: unknown) => void) => {
          handlers[event] = handler
        })
      }
      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({ create: vi.fn(() => mockElement) })),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = await mountWithProviders(VueStripeCardNumberElement)
      // What Stripe.js sends for a co-badged card (4000 0025 0000 1001)
      const networks = {
        elementType: 'cardNumber',
        networks: ['cartes_bancaires', 'visa'],
        loading: false
      }
      const loadError = { elementType: 'cardNumber', error: { message: 'Failed to load' } }
      handlers['networkschange']?.(networks)
      handlers['loaderror']?.(loadError)
      await nextTick()

      const number = wrapper.findComponent(VueStripeCardNumberElement)
      expect(number.emitted('networkschange')).toEqual([[networks]])
      expect(number.emitted('loaderror')).toEqual([[loadError]])
      expect(number.find('.vue-stripe-cardNumber-element-error').text()).toBe('Failed to load')
    })
  })

  describe('VueStripeCardExpiryElement', () => {
    it('should throw error when used outside StripeElements', () => {
      expect(() => {
        mount(VueStripeCardExpiryElement, {
          props: {}
        })
      }).toThrow('VueStripeCardExpiryElement must be used within VueStripeElements')
    })

    it('should render card expiry element container', async () => {
      const wrapper = await mountWithProviders(VueStripeCardExpiryElement)

      expect(wrapper.find('.vue-stripe-cardExpiry-element').exists()).toBe(true)
      expect(wrapper.find('.vue-stripe-cardExpiry-element-mount').exists()).toBe(true)
    })

    it('should create cardExpiry type element', async () => {
      const mockElement = makeMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      await mountWithProviders(VueStripeCardExpiryElement)

      expect(mockCreate).toHaveBeenCalledWith('cardExpiry', {})
      expect(mockElement.mount).toHaveBeenCalled()
    })

    it('should emit ready event', async () => {
      let readyCallback: Function | null = null
      const mockElement = {
        ...makeMockElement(),
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'ready') {
            readyCallback = callback
          }
        })
      }

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => mockElement)
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = await mountWithProviders(VueStripeCardExpiryElement)

      if (readyCallback) {
        readyCallback()
      }

      await nextTick()

      const component = wrapper.findComponent(VueStripeCardExpiryElement)
      expect(component.emitted('ready')).toBeTruthy()
    })

    it('should emit change event with completion status', async () => {
      let changeCallback: Function | null = null
      const mockElement = {
        ...makeMockElement(),
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'change') {
            changeCallback = callback
          }
        })
      }

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => mockElement)
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = await mountWithProviders(VueStripeCardExpiryElement)

      const changeEvent = {
        complete: true,
        empty: false,
        error: undefined
      }

      if (changeCallback) {
        changeCallback(changeEvent)
      }

      await nextTick()

      const component = wrapper.findComponent(VueStripeCardExpiryElement)
      const emitted = component.emitted('change')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toMatchObject({ complete: true })
    })
  })

  describe('VueStripeCardCvcElement', () => {
    it('should throw error when used outside StripeElements', () => {
      expect(() => {
        mount(VueStripeCardCvcElement, {
          props: {}
        })
      }).toThrow('VueStripeCardCvcElement must be used within VueStripeElements')
    })

    it('should render card CVC element container', async () => {
      const wrapper = await mountWithProviders(VueStripeCardCvcElement)

      expect(wrapper.find('.vue-stripe-cardCvc-element').exists()).toBe(true)
      expect(wrapper.find('.vue-stripe-cardCvc-element-mount').exists()).toBe(true)
    })

    it('should create cardCvc type element', async () => {
      const mockElement = makeMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      await mountWithProviders(VueStripeCardCvcElement)

      expect(mockCreate).toHaveBeenCalledWith('cardCvc', {})
      expect(mockElement.mount).toHaveBeenCalled()
    })

    it('should emit focus and blur events', async () => {
      let focusCallback: Function | null = null
      let blurCallback: Function | null = null
      const mockElement = {
        ...makeMockElement(),
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'focus') focusCallback = callback
          if (event === 'blur') blurCallback = callback
        })
      }

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => mockElement)
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = await mountWithProviders(VueStripeCardCvcElement)

      if (focusCallback) focusCallback()
      await nextTick()

      if (blurCallback) blurCallback()
      await nextTick()

      const component = wrapper.findComponent(VueStripeCardCvcElement)
      expect(component.emitted('focus')).toBeTruthy()
      expect(component.emitted('blur')).toBeTruthy()
    })

    it('should display error from change event', async () => {
      let changeCallback: Function | null = null
      const mockElement = {
        ...makeMockElement(),
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'change') {
            changeCallback = callback
          }
        })
      }

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: vi.fn(() => mockElement)
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = await mountWithProviders(VueStripeCardCvcElement)

      const changeEvent = {
        complete: false,
        empty: false,
        error: {
          message: 'Your security code is incomplete.'
        }
      }

      if (changeCallback) {
        changeCallback(changeEvent)
      }

      await nextTick()

      expect(wrapper.find('.vue-stripe-cardCvc-element-error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Your security code is incomplete.')
    })
  })

  describe('Split Elements Together', () => {
    it('should allow mounting all three split elements in same Elements container', async () => {
      const mockElement = makeMockElement()
      const mockCreate = vi.fn(() => mockElement)

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = mount(VueStripeProvider, {
        props: {
          publishableKey: 'pk_test_123'
        },
        slots: {
          default: () =>
            h(
              VueStripeElements,
              {},
              {
                default: () => [
                  h(VueStripeCardNumberElement, { key: 'number' }),
                  h(VueStripeCardExpiryElement, { key: 'expiry' }),
                  h(VueStripeCardCvcElement, { key: 'cvc' })
                ]
              }
            )
        }
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      // All three elements should be created
      expect(mockCreate).toHaveBeenCalledTimes(3)
      expect(mockCreate).toHaveBeenCalledWith('cardNumber', {})
      expect(mockCreate).toHaveBeenCalledWith('cardExpiry', {})
      expect(mockCreate).toHaveBeenCalledWith('cardCvc', {})
    })

    it('should destroy all elements on unmount', async () => {
      const mockElements = [makeMockElement(), makeMockElement(), makeMockElement()]
      let elementIndex = 0
      const mockCreate = vi.fn(() => mockElements[elementIndex++])

      const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
      mockLoadStripe.mockResolvedValueOnce({
        elements: vi.fn(() => ({
          create: mockCreate
        })),
        confirmPayment: vi.fn(),
        confirmCardSetup: vi.fn(),
        registerAppInfo: vi.fn()
      } as any)

      const wrapper = mount(VueStripeProvider, {
        props: {
          publishableKey: 'pk_test_123'
        },
        slots: {
          default: () =>
            h(
              VueStripeElements,
              {},
              {
                default: () => [
                  h(VueStripeCardNumberElement, { key: 'number' }),
                  h(VueStripeCardExpiryElement, { key: 'expiry' }),
                  h(VueStripeCardCvcElement, { key: 'cvc' })
                ]
              }
            )
        }
      })

      await flushPromises()
      wrapper.unmount()

      // All elements should be destroyed, with listeners detached first (#376)
      mockElements.forEach((element) => {
        expect(element.off).toHaveBeenCalledWith('ready', expect.any(Function))
        expect(element.off).toHaveBeenCalledWith('change', expect.any(Function))
        expect(element.destroy).toHaveBeenCalled()
      })
    })
  })
})
