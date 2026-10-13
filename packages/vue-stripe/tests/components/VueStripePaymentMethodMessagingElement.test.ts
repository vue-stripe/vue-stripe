import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue-demi'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripePaymentMethodMessagingElement from '../../src/components/VueStripePaymentMethodMessagingElement'
import { flushPromises, makeMockElement } from '../setup'

describe('VueStripePaymentMethodMessagingElement (v5.5)', () => {
  beforeEach(() => vi.clearAllMocks())

  const mountWith = async (
    options: Record<string, unknown> = {},
    slots: Record<string, (props: { error: string }) => unknown> = {}
  ) => {
    const mockElement = makeMockElement()
    const mockCreate = vi.fn(() => mockElement)
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({ create: mockCreate, submit: vi.fn() })),
      confirmPayment: vi.fn(),
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn()
    } as any)

    const onLoaderror = vi.fn()
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(
            VueStripeElements,
            {},
            {
              default: () =>
                h(VueStripePaymentMethodMessagingElement, { options, onLoaderror }, slots)
            }
          )
      }
    })
    await flushPromises()
    const handler = (name: string) =>
      mockElement.on.mock.calls.find((call) => call[0] === name)?.[1] as (e: unknown) => void
    return { wrapper, mockCreate, mockElement, onLoaderror, handler }
  }

  it('throws when used outside VueStripeElements', () => {
    expect(() => mount(VueStripePaymentMethodMessagingElement)).toThrow(
      'VueStripePaymentMethodMessagingElement must be used within VueStripeElements'
    )
  })

  it("creates the 'paymentMethodMessaging' element and mounts it", async () => {
    const { mockCreate, mockElement } = await mountWith()
    expect(mockCreate).toHaveBeenCalledWith('paymentMethodMessaging', expect.anything())
    expect(mockElement.mount).toHaveBeenCalled()
  })

  it('passes options (amount, currency, paymentMethodTypes) through to create()', async () => {
    const options = {
      amount: 9900,
      currency: 'USD',
      paymentMethodTypes: ['affirm'],
      countryCode: 'US'
    }
    const { mockCreate } = await mountWith(options)
    expect(mockCreate).toHaveBeenCalledWith('paymentMethodMessaging', options)
  })

  it('detaches listeners and destroys on unmount', async () => {
    const { wrapper, mockElement } = await mountWith()
    wrapper.unmount()
    expect(mockElement.off).toHaveBeenCalled()
    expect(mockElement.destroy).toHaveBeenCalled()
  })

  // Stripe.js emits `loaderror` on this element (e.g. no countryCode for an unsupported
  // country) although its .d.ts declares only `ready`, then destroys the element itself.
  it("surfaces Stripe's loaderror through @loaderror and #error, and stops loading (#645)", async () => {
    const { wrapper, mockElement, onLoaderror, handler } = await mountWith(
      { amount: 9900, currency: 'USD', paymentMethodTypes: ['affirm'] },
      { error: ({ error }) => h('p', { class: 'custom-error' }, `Messaging: ${error}`) }
    )
    expect(mockElement.on.mock.calls.map((c) => c[0])).toContain('loaderror')
    const event = { elementType: 'paymentMethodMessaging', error: { error: {} } }
    handler('loaderror')(event)
    await flushPromises()

    expect(onLoaderror).toHaveBeenCalledWith(event)
    expect(wrapper.find('.custom-error').text()).toBe('Messaging: Element failed to load')
    expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(false)
  })

  it('unmounts cleanly after Stripe destroyed the element itself (#645)', async () => {
    const { wrapper, mockElement } = await mountWith()
    mockElement.destroy.mockImplementation(() => {
      throw new Error('This Element has already been destroyed. Please create a new one.')
    })
    expect(() => wrapper.unmount()).not.toThrow()
    expect(mockElement.destroy).toHaveBeenCalled()
  })
})
