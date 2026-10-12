import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Component } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeIssuingCardNumberDisplayElement from '../../src/components/VueStripeIssuingCardNumberDisplayElement'
import VueStripeIssuingCardCvcDisplayElement from '../../src/components/VueStripeIssuingCardCvcDisplayElement'
import VueStripeIssuingCardExpiryDisplayElement from '../../src/components/VueStripeIssuingCardExpiryDisplayElement'
import VueStripeIssuingCardPinDisplayElement from '../../src/components/VueStripeIssuingCardPinDisplayElement'
import VueStripeIssuingCardCopyButtonElement from '../../src/components/VueStripeIssuingCardCopyButtonElement'
import VueStripeIssuingAddToWalletButtonElement from '../../src/components/VueStripeIssuingAddToWalletButtonElement'
import { flushPromises, makeMockElement, makeMockElements, makeMockStripe } from '../setup'

const CARD = { issuingCard: 'ic_123', nonce: 'nonce_123', ephemeralKeySecret: 'ek_test_secret' }

// The six Issuing elements and the exact Stripe.js 10.0.0 event union of each.
const ISSUING: Array<[string, Component, string, string[], Record<string, unknown>]> = [
  [
    'VueStripeIssuingCardNumberDisplayElement',
    VueStripeIssuingCardNumberDisplayElement,
    'issuingCardNumberDisplay',
    ['ready'],
    CARD
  ],
  [
    'VueStripeIssuingCardCvcDisplayElement',
    VueStripeIssuingCardCvcDisplayElement,
    'issuingCardCvcDisplay',
    [],
    CARD
  ],
  [
    'VueStripeIssuingCardExpiryDisplayElement',
    VueStripeIssuingCardExpiryDisplayElement,
    'issuingCardExpiryDisplay',
    [],
    CARD
  ],
  [
    'VueStripeIssuingCardPinDisplayElement',
    VueStripeIssuingCardPinDisplayElement,
    'issuingCardPinDisplay',
    [],
    CARD
  ],
  [
    'VueStripeIssuingCardCopyButtonElement',
    VueStripeIssuingCardCopyButtonElement,
    'issuingCardCopyButton',
    ['click'],
    { toCopy: 'number' }
  ],
  [
    'VueStripeIssuingAddToWalletButtonElement',
    VueStripeIssuingAddToWalletButtonElement,
    'issuingAddToWalletButton',
    ['click', 'success'],
    { ...CARD, wallet: 'apple' }
  ]
]

async function mountIssuing(Element: Component, initial: Record<string, unknown>) {
  const element = makeMockElement()
  const elements = makeMockElements()
  elements.create.mockImplementation(() => element)
  const stripe = makeMockStripe()
  stripe.elements.mockReturnValue(elements)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const options = ref<Record<string, unknown>>(initial)
  const child = ref<Record<string, unknown> | null>(null)
  const show = ref(true)

  // Issuing elements need a plain Elements group: no clientSecret, no mode.
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          VueStripeProvider,
          { publishableKey: 'pk_test_123' },
          {
            default: () =>
              h(VueStripeElements, null, {
                default: () =>
                  show.value ? h(Element, { ref: child, options: options.value }) : null
              })
          }
        )
    }
  })

  const wrapper = mount(Host)
  await flushPromises()
  await flushPromises()
  const handler = (name: string) =>
    element.on.mock.calls.find((call) => call[0] === name)?.[1] as (...a: unknown[]) => void
  return { wrapper, stripe, element, elements, options, child, show, handler }
}

describe.each(ISSUING)('%s', (name, Element, elementType, events, options) => {
  beforeEach(() => vi.clearAllMocks())

  it(`creates an "${elementType}" element with the options and mounts it`, async () => {
    const { stripe, elements, element } = await mountIssuing(Element, options)
    expect(stripe.elements).toHaveBeenCalledWith({})
    expect(elements.create).toHaveBeenCalledWith(elementType, options)
    expect(element.mount).toHaveBeenCalledTimes(1)
  })

  it(`attaches exactly the Stripe.js 10 events [${events.join(', ')}] and re-emits them`, async () => {
    const { wrapper, element, handler } = await mountIssuing(Element, options)
    expect(element.on.mock.calls.map((call) => call[0])).toEqual(events)
    for (const event of events) {
      handler(event)({ elementType })
      await nextTick()
      expect(wrapper.findComponent(Element).emitted(event)).toHaveLength(1)
    }
  })

  it('shows the element once mounted (ready-less elements do not wait for ready)', async () => {
    const { wrapper, element, child, handler } = await mountIssuing(Element, options)
    if (events.includes('ready')) {
      expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(true)
      handler('ready')({ elementType })
      await nextTick()
      expect(wrapper.findComponent(Element).emitted('ready')?.[0]).toEqual([element])
    }
    expect(child.value?.['loading']).toBe(false)
    expect(wrapper.find('.vue-stripe-element-loader').exists()).toBe(false)
  })

  it('calls element.update() when options change', async () => {
    const { options: opts, element } = await mountIssuing(Element, options)
    opts.value = { ...options, style: { base: { color: '#32325d' } } }
    await flushPromises()
    expect(element.update).toHaveBeenCalledWith(opts.value)
  })

  it('exposes the standard element members', async () => {
    const { child, element } = await mountIssuing(Element, options)
    expect(Object.keys(child.value ?? {})).toEqual(
      expect.arrayContaining(['element', 'loading', 'error', 'focus', 'blur', 'clear'])
    )
    expect(child.value?.['element']).toBe(element)
  })

  it('detaches its listeners and destroys the element on unmount', async () => {
    const { show, element } = await mountIssuing(Element, options)
    show.value = false
    await flushPromises()
    expect(element.off.mock.calls.map((call) => call[0])).toEqual(events)
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })

  it('throws outside VueStripeElements', () => {
    // Vue warns about the component that failed in setup(); keep the test output clean.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Element)).toThrow(`${name} must be used within VueStripeElements`)
    warnSpy.mockRestore()
  })

  it('reports that Checkout Sessions have no Issuing elements', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(loadStripe).mockResolvedValueOnce(makeMockStripe() as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(
            VueStripeCheckoutElementsProvider,
            { clientSecret: 'cs_test_secret' },
            { default: () => h(Element, { options }) }
          )
      }
    })
    await flushPromises()
    await flushPromises()
    expect(wrapper.text()).toContain('not available inside Checkout Sessions')
    expect(errorSpy).toHaveBeenCalledWith(
      `[Vue Stripe] ${name} creation error:`,
      expect.stringContaining('not available inside Checkout Sessions')
    )
    errorSpy.mockRestore()
  })
})
