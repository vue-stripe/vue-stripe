import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, type Component } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeProvider from '../src/components/VueStripeProvider'
import VueStripeElements from '../src/components/VueStripeElements'
import VueStripeCardElement from '../src/components/VueStripeCardElement'
import VueStripePricingTable from '../src/components/VueStripePricingTable'
import VueStripeCheckout from '../src/components/VueStripeCheckout'
import VueStripeEmbeddedCheckout from '../src/components/VueStripeEmbeddedCheckout'
import VueStripeCheckoutElementsProvider from '../src/components/VueStripeCheckoutElementsProvider'
import VueStripeCheckoutFormProvider from '../src/components/VueStripeCheckoutFormProvider'
import VueStripeIssuingDisclosure from '../src/components/VueStripeIssuingDisclosure'
import { flushPromises, makeMockElements, makeMockStripe } from './setup'

// #651: a failure the app handles (an error listener or an #error slot) is not also logged.
// Only an unhandled one gets a `[Vue Stripe]` console.error.

type Handling = 'none' | 'listener' | 'slot'

const settle = async () => {
  for (let i = 0; i < 4; i++) await flushPromises()
  await nextTick()
}

/** The listener and slot for `handling`, for a component whose failure event is `event`. */
const handled = (handling: Handling, event = 'error') => ({
  props:
    handling === 'listener' ? { [`on${event[0]!.toUpperCase()}${event.slice(1)}`]: vi.fn() } : {},
  slots:
    handling === 'slot'
      ? { error: ({ error }: { error: string }) => h('p', { class: 'mine' }, error) }
      : {}
})

/** Mounts `inner` inside a provider whose loadStripe() resolves `stripe`. */
const underProvider = (stripe: unknown, inner: () => unknown) => {
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
  return mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: { default: inner as never }
  })
}

type Case = {
  name: string
  label: RegExp
  handlings: Handling[]
  run: (handling: Handling) => Promise<VueWrapper | void>
}

const CASES: Case[] = [
  {
    name: 'VueStripeProvider load failure',
    label: /^\[Vue Stripe\] Initialization error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      vi.mocked(loadStripe).mockRejectedValueOnce(new Error('Failed to load Stripe.js'))
      const { props, slots } = handled(handling)
      const wrapper = mount(VueStripeProvider, {
        props: { publishableKey: 'pk_test_123', ...props },
        slots
      })
      await settle()
      return wrapper
    }
  },
  {
    name: 'VueStripeElements creation failure',
    label: /^\[Vue Stripe\] Elements creation error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      const stripe = makeMockStripe()
      stripe.elements.mockImplementation(() => {
        throw new Error('allowedPaymentMethodTypes is only applicable when a mode is set')
      })
      const { props, slots } = handled(handling)
      const wrapper = underProvider(stripe, () => h(VueStripeElements, props, slots))
      await settle()
      return wrapper
    }
  },
  {
    name: 'element creation failure',
    label: /^\[Vue Stripe\] VueStripeCardElement creation error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      const elements = makeMockElements()
      elements.create.mockImplementation(() => {
        throw new Error('Invalid value for create()')
      })
      const stripe = makeMockStripe()
      stripe.elements.mockReturnValue(elements)
      const { props, slots } = handled(handling, 'loaderror')
      const wrapper = underProvider(stripe, () =>
        h(VueStripeElements, { clientSecret: 'pi_1_secret_2' }, () =>
          h(VueStripeCardElement, props, slots)
        )
      )
      await settle()
      return wrapper
    }
  },
  {
    name: 'VueStripePricingTable script failure',
    label: /^\[Vue Stripe\] Pricing table error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      document.querySelectorAll('script[src*="pricing-table.js"]').forEach((s) => s.remove())
      const create = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = create(tag)
        if (tag === 'script') setTimeout(() => el.onerror?.({} as Event), 0)
        return el
      })
      const { props, slots } = handled(handling)
      const wrapper = underProvider(makeMockStripe(), () =>
        h(VueStripePricingTable, { pricingTableId: 'prctbl_1', ...props }, slots)
      )
      await settle()
      await new Promise((resolve) => setTimeout(resolve, 10))
      await settle()
      return wrapper
    }
  },
  {
    name: 'VueStripeCheckout without sessionUrl',
    label: /^\[Vue Stripe\] Checkout error:/,
    // No #error slot: the default slot is the button.
    handlings: ['none', 'listener'],
    run: async (handling) => {
      const wrapper = mount(VueStripeCheckout, { props: handled(handling).props })
      ;(wrapper.vm as unknown as { checkout: () => void }).checkout()
      await settle()
      return wrapper
    }
  },
  {
    name: 'VueStripeEmbeddedCheckout without a client secret',
    label: /^\[Vue Stripe\] Embedded Checkout error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      const { props, slots } = handled(handling)
      const wrapper = underProvider(makeMockStripe(), () =>
        h(VueStripeEmbeddedCheckout, props, slots)
      )
      await settle()
      return wrapper
    }
  },
  {
    name: 'VueStripeCheckoutElementsProvider without a client secret',
    label: /^\[Vue Stripe\] Checkout init error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      const { props, slots } = handled(handling)
      const wrapper = underProvider(makeMockStripe(), () =>
        h(VueStripeCheckoutElementsProvider, props, slots)
      )
      await settle()
      return wrapper
    }
  },
  {
    name: 'VueStripeCheckoutFormProvider without a client secret',
    label: /^\[Vue Stripe\] Checkout Form init error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      const { props, slots } = handled(handling)
      const wrapper = underProvider(makeMockStripe(), () =>
        h(VueStripeCheckoutFormProvider, props, slots)
      )
      await settle()
      return wrapper
    }
  },
  {
    name: 'disclosure failure',
    label: /^\[Vue Stripe\] VueStripeIssuingDisclosure error:/,
    handlings: ['none', 'listener', 'slot'],
    run: async (handling) => {
      const stripe = {
        ...makeMockStripe(),
        createIssuingDisclosure: vi.fn(() => Promise.reject(new Error('network')))
      }
      const { props, slots } = handled(handling)
      const wrapper = mount(VueStripeIssuingDisclosure as Component, {
        props: { stripe, ...props },
        slots
      })
      await settle()
      return wrapper
    }
  }
]

describe('console output for failures the app handles (#651)', () => {
  let error: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    vi.clearAllMocks()
    error = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  const logged = (label: RegExp) => error.mock.calls.filter(([m]) => label.test(String(m)))

  for (const { name, label, handlings, run } of CASES) {
    describe(name, () => {
      it('logs a [Vue Stripe] error when nothing handles it', async () => {
        const wrapper = await run('none')
        expect(logged(label)).toHaveLength(1)
        wrapper?.unmount()
      })
      if (handlings.includes('listener')) {
        it('stays quiet when the app listens for the error event', async () => {
          const wrapper = await run('listener')
          expect(logged(label)).toEqual([])
          wrapper?.unmount()
        })
      }
      if (handlings.includes('slot')) {
        it('stays quiet when the app renders an #error slot', async () => {
          const wrapper = await run('slot')
          expect(wrapper?.find('.mine').exists()).toBe(true)
          expect(logged(label)).toEqual([])
          wrapper?.unmount()
        })
      }
    })
  }
})
