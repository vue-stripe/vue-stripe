import { mount } from '@vue/test-utils'
import { h, ref, type Component } from 'vue-demi'
import { vi } from 'vitest'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeCheckoutFormProvider from '../../src/components/VueStripeCheckoutFormProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import {
  flushPromises,
  makeMockCheckout,
  makeMockCheckoutForm,
  makeMockElement,
  makeMockElements,
  makeMockStripe
} from '../setup'

type LeafContext = 'checkout' | 'form' | 'elements'

/** Mount `Leaf` under Provider > (CheckoutElementsProvider | CheckoutFormProvider | Elements). */
export async function mountLeaf(
  Leaf: Component,
  { context = 'checkout' as LeafContext, options = {}, slots = {} } = {}
) {
  const element = makeMockElement()
  const checkout = makeMockCheckout()
  checkout.createTaxIdElement.mockReturnValue(element)
  checkout.createCurrencySelectorElement.mockReturnValue(element)
  checkout.createContactDetailsElement.mockReturnValue(element)
  checkout.createTermsElement.mockReturnValue(element)
  checkout.createLinkSignupElement.mockReturnValue(element)
  const checkoutForm = makeMockCheckoutForm()
  checkoutForm.createForm.mockReturnValue(element)
  checkoutForm.createCurrencySelectorElement.mockReturnValue(element)
  const elements = makeMockElements()
  elements.create.mockReturnValue(element)
  const stripe = makeMockStripe()
  stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
  stripe.initCheckoutFormSdk.mockReturnValue(checkoutForm)
  stripe.elements.mockReturnValue(elements)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const show = ref(true)
  const leaf = () => (show.value ? h(Leaf, { options }, slots) : null)
  const parents = {
    checkout: () =>
      h(VueStripeCheckoutElementsProvider, { clientSecret: 'cs_test_secret' }, { default: leaf }),
    form: () =>
      h(VueStripeCheckoutFormProvider, { clientSecret: 'cs_test_secret' }, { default: leaf }),
    elements: () => h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }, { default: leaf })
  }
  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: { default: parents[context] }
  })
  await flushPromises()
  await flushPromises()
  const handler = (name: string) =>
    element.on.mock.calls.find((call) => call[0] === name)?.[1] as (...a: unknown[]) => void
  return { wrapper, element, elements, checkout, checkoutForm, stripe, show, handler }
}
