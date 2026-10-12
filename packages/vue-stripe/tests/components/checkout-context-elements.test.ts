import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, type Component } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripePaymentElement from '../../src/components/VueStripePaymentElement'
import VueStripeAddressElement from '../../src/components/VueStripeAddressElement'
import VueStripeExpressCheckoutElement from '../../src/components/VueStripeExpressCheckoutElement'
import VueStripeCardElement from '../../src/components/VueStripeCardElement'
import { flushPromises, makeMockCheckout, makeMockStripe } from '../setup'

// Provider > CheckoutElementsProvider > Leaf (optionally wrapped in VueStripeElements).
async function mountInCheckout(
  Leaf: Component,
  options: Record<string, unknown>,
  nestElements = false
) {
  const checkout = makeMockCheckout()
  const stripe = makeMockStripe()
  stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
  const leaf = () => h(Leaf, { options })
  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () =>
        h(
          VueStripeCheckoutElementsProvider,
          { clientSecret: 'cs_test_secret' },
          {
            default: () =>
              nestElements
                ? h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }, { default: leaf })
                : leaf()
          }
        )
    }
  })
  await flushPromises()
  await flushPromises()
  return { wrapper, checkout, stripe }
}

describe('elements inside VueStripeCheckoutElementsProvider (Checkout Elements SDK)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Payment Element uses checkout.createPaymentElement() with the SDK-supported options only', async () => {
    const { checkout, stripe } = await mountInCheckout(VueStripePaymentElement, {
      layout: 'tabs',
      business: { name: 'Acme' }
    })
    expect(checkout.createPaymentElement).toHaveBeenCalledWith({ layout: 'tabs' })
    expect(stripe.elements).not.toHaveBeenCalled()
    const element = checkout.createPaymentElement.mock.results[0]?.value
    expect(element.mount).toHaveBeenCalledTimes(1)
  })

  it("Address Element with mode 'billing' uses createBillingAddressElement() without `mode`", async () => {
    const { checkout } = await mountInCheckout(VueStripeAddressElement, {
      mode: 'billing',
      display: { name: 'split' },
      allowedCountries: ['US']
    })
    expect(checkout.createBillingAddressElement).toHaveBeenCalledWith({
      display: { name: 'split' }
    })
    expect(checkout.createShippingAddressElement).not.toHaveBeenCalled()
  })

  it('Address Element defaults to createShippingAddressElement()', async () => {
    const { checkout } = await mountInCheckout(VueStripeAddressElement, {})
    expect(checkout.createShippingAddressElement).toHaveBeenCalledWith({})
    expect(checkout.createBillingAddressElement).not.toHaveBeenCalled()
  })

  it('Express Checkout Element uses createExpressCheckoutElement() with its option subset', async () => {
    const { checkout } = await mountInCheckout(VueStripeExpressCheckoutElement, {
      buttonType: { applePay: 'buy' },
      emailRequired: true
    })
    expect(checkout.createExpressCheckoutElement).toHaveBeenCalledWith({
      buttonType: { applePay: 'buy' }
    })
  })

  it('Card Element reports that it is not available inside Checkout Sessions', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper } = await mountInCheckout(VueStripeCardElement, {})
    expect(wrapper.text()).toContain(
      'VueStripeCardElement is not available inside Checkout Sessions; use it within VueStripeElements'
    )
    errorSpy.mockRestore()
  })

  it('a VueStripeElements nested inside the Checkout provider drives its own children', async () => {
    const { checkout, stripe } = await mountInCheckout(
      VueStripePaymentElement,
      { layout: 'tabs' },
      true
    )
    expect(stripe.elements).toHaveBeenCalledTimes(1)
    const elements = stripe.elements.mock.results[0]?.value
    expect(elements.create).toHaveBeenCalledWith('payment', { layout: 'tabs' })
    expect(checkout.createPaymentElement).not.toHaveBeenCalled()
  })
})
