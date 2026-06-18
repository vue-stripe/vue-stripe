import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue-demi'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripePaymentMethodMessagingElement from '../../src/components/VueStripePaymentMethodMessagingElement.vue'
import { flushPromises, createMockElement } from '../setup'

describe('VueStripePaymentMethodMessagingElement (v5.5)', () => {
  beforeEach(() => vi.clearAllMocks())

  const mountWith = async (options: Record<string, unknown> = {}) => {
    const mockElement = createMockElement()
    const mockCreate = vi.fn(() => mockElement)
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({ create: mockCreate, submit: vi.fn() })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () => h(VueStripeElements, {}, {
          default: () => h(VueStripePaymentMethodMessagingElement, { options })
        })
      }
    })
    await flushPromises()
    return { wrapper, mockCreate, mockElement }
  }

  it('throws when used outside VueStripeElements', () => {
    expect(() => mount(VueStripePaymentMethodMessagingElement))
      .toThrow('VueStripePaymentMethodMessagingElement must be used within VueStripeElements')
  })

  it("creates the 'paymentMethodMessaging' element and mounts it", async () => {
    const { mockCreate, mockElement } = await mountWith()
    expect(mockCreate).toHaveBeenCalledWith('paymentMethodMessaging', expect.anything())
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('passes options (amount, currency, paymentMethodTypes) through to create()', async () => {
    const options = { amount: 9900, currency: 'USD', paymentMethodTypes: ['affirm'], countryCode: 'US' }
    const { mockCreate } = await mountWith(options)
    expect(mockCreate).toHaveBeenCalledWith('paymentMethodMessaging', options)
  })

  it('detaches listeners and destroys on unmount', async () => {
    const { wrapper, mockElement } = await mountWith()
    wrapper.unmount()
    expect(mockElement.off).toHaveBeenCalled()
    expect(mockElement.destroy).toHaveBeenCalled()
  })
})
