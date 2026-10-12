import { mount } from '@vue/test-utils'
import { h, ref, type Component } from 'vue-demi'
import { vi } from 'vitest'
import { loadStripe } from '@stripe/stripe-js'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import {
  flushPromises,
  makeMockCheckout,
  makeMockElement,
  makeMockElements,
  makeMockStripe
} from '../setup'

/** Mount `Leaf` under Provider > (CheckoutElementsProvider | Elements); returns the mocks. */
export async function mountLeaf(
  Leaf: Component,
  { context = 'checkout' as 'checkout' | 'elements', options = {}, slots = {} } = {}
) {
  const element = makeMockElement()
  const checkout = makeMockCheckout()
  checkout.createTaxIdElement.mockReturnValue(element)
  checkout.createCurrencySelectorElement.mockReturnValue(element)
  checkout.createContactDetailsElement.mockReturnValue(element)
  checkout.createTermsElement.mockReturnValue(element)
  checkout.createLinkSignupElement.mockReturnValue(element)
  const elements = makeMockElements()
  elements.create.mockReturnValue(element)
  const stripe = makeMockStripe()
  stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
  stripe.elements.mockReturnValue(elements)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const show = ref(true)
  const leaf = () => (show.value ? h(Leaf, { options }, slots) : null)
  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () =>
        context === 'checkout'
          ? h(
              VueStripeCheckoutElementsProvider,
              { clientSecret: 'cs_test_secret' },
              { default: leaf }
            )
          : h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }, { default: leaf })
    }
  })
  await flushPromises()
  await flushPromises()
  const handler = (name: string) =>
    element.on.mock.calls.find((call) => call[0] === name)?.[1] as (...a: unknown[]) => void
  return { wrapper, element, elements, checkout, stripe, show, handler }
}
