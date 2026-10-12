import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, type Component } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripeCardElement from '../../src/components/VueStripeCardElement'
import VueStripeIbanElement from '../../src/components/VueStripeIbanElement'
import VueStripeAuBankAccountElement from '../../src/components/VueStripeAuBankAccountElement'
import VueStripeLinkAuthenticationElement from '../../src/components/VueStripeLinkAuthenticationElement'
import VueStripeAddressElement from '../../src/components/VueStripeAddressElement'
import VueStripePaymentElement from '../../src/components/VueStripePaymentElement'
import VueStripeExpressCheckoutElement from '../../src/components/VueStripeExpressCheckoutElement'
import {
  flushPromises,
  makeMockElement,
  makeMockElements,
  makeMockStripe,
  type MockStripeElement
} from '../setup'

// The lifecycle contract every element component follows (see CLAUDE.md):
// create from the injected Elements, attach named handlers, mount, forward
// Stripe events as Vue events, update on options change, expose
// focus/blur/clear, detach every handler and destroy on unmount.
const ELEMENTS: Array<[string, Component, string]> = [
  ['VueStripeCardElement', VueStripeCardElement, 'card'],
  ['VueStripeIbanElement', VueStripeIbanElement, 'iban'],
  ['VueStripeAuBankAccountElement', VueStripeAuBankAccountElement, 'auBankAccount'],
  ['VueStripeLinkAuthenticationElement', VueStripeLinkAuthenticationElement, 'linkAuthentication'],
  ['VueStripeAddressElement', VueStripeAddressElement, 'address'],
  ['VueStripePaymentElement', VueStripePaymentElement, 'payment'],
  ['VueStripeExpressCheckoutElement', VueStripeExpressCheckoutElement, 'expressCheckout']
]

async function mountElement(Element: Component, elementType: string) {
  const element = makeMockElement()
  const elements = makeMockElements()
  elements.create.mockImplementation(() => element)
  const stripe = makeMockStripe()
  stripe.elements.mockReturnValue(elements)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const options = ref<Record<string, unknown>>(
    elementType === 'address' ? { mode: 'shipping' } : {}
  )
  const child = ref<Record<string, unknown> | null>(null)
  const show = ref(true)

  const Host = defineComponent({
    setup() {
      return () =>
        h(
          VueStripeProvider,
          { publishableKey: 'pk_test_123' },
          {
            default: () =>
              h(
                VueStripeElements,
                { clientSecret: 'pi_123_secret_456' },
                {
                  default: () =>
                    show.value ? h(Element, { ref: child, options: options.value }) : null
                }
              )
          }
        )
    }
  })

  const wrapper = mount(Host)
  await flushPromises()
  await flushPromises()

  const handlers = new Map<string, (...args: unknown[]) => void>()
  for (const [name, handler] of element.on.mock.calls)
    handlers.set(name as string, handler as never)

  return { wrapper, element, elements, options, child, show, handlers }
}

const emittedNames = (wrapper: ReturnType<typeof mount>, Element: Component) =>
  Object.keys(wrapper.findComponent(Element).emitted()).map((n) => n.toLowerCase())

describe.each(ELEMENTS)('%s lifecycle contract', (_name, Element, elementType) => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(`creates a "${elementType}" element and mounts it`, async () => {
    const { elements, element } = await mountElement(Element, elementType)
    expect(elements.create).toHaveBeenCalledWith(elementType, expect.any(Object))
    expect(element.mount).toHaveBeenCalledTimes(1)
  })

  it('forwards every attached Stripe event as a Vue event', async () => {
    const { wrapper, handlers } = await mountElement(Element, elementType)
    expect(handlers.size).toBeGreaterThan(0)
    for (const [name, handler] of handlers) {
      handler({ elementType, complete: false, empty: true })
      await flushPromises()
      expect(emittedNames(wrapper, Element)).toContain(name.toLowerCase())
    }
  })

  it('shows the change-event error and clears it on the next valid change', async () => {
    const { wrapper, handlers } = await mountElement(Element, elementType)
    const change = handlers.get('change')
    if (!change) return // elements without a change event (e.g. Express Checkout)
    change({
      elementType,
      complete: false,
      empty: false,
      error: { message: 'Your card number is incomplete.' }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Your card number is incomplete.')
    change({ elementType, complete: true, empty: false })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Your card number is incomplete.')
  })

  it('calls element.update() when options change', async () => {
    const { element, options } = await mountElement(Element, elementType)
    options.value = { ...options.value, disabled: true }
    await flushPromises()
    expect(element.update).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }))
  })

  it('exposes focus/blur/clear that proxy to the Stripe element', async () => {
    const { child, element } = await mountElement(Element, elementType)
    const exposed = child.value as unknown as {
      focus: () => void
      blur: () => void
      clear: () => void
    }
    exposed.focus()
    exposed.blur()
    exposed.clear()
    expect(element.focus).toHaveBeenCalled()
    expect(element.blur).toHaveBeenCalled()
    expect(element.clear).toHaveBeenCalled()
  })

  it('detaches every handler and destroys the element on unmount', async () => {
    const { element, show, handlers } = await mountElement(Element, elementType)
    show.value = false
    await flushPromises()
    for (const [name, handler] of handlers) {
      expect(element.off).toHaveBeenCalledWith(name, handler)
    }
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })

  it('surfaces element creation failures as an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const element: MockStripeElement = makeMockElement()
    const elements = makeMockElements()
    elements.create.mockImplementation(() => {
      throw new Error(`${elementType} create failed`)
    })
    const stripe = makeMockStripe()
    stripe.elements.mockReturnValue(elements)
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(
            VueStripeElements,
            { clientSecret: 'pi_123_secret_456' },
            {
              default: () =>
                h(Element, { options: elementType === 'address' ? { mode: 'shipping' } : {} })
            }
          )
      }
    })
    await flushPromises()
    await flushPromises()
    expect(wrapper.text()).toContain(`${elementType} create failed`)
    expect(element.mount).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[Vue Stripe\]/),
      expect.anything()
    )
    errorSpy.mockRestore()
  })
})
