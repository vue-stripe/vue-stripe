import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref } from 'vue-demi'
import { useCheckoutSession } from '../../src/composables/useCheckoutSession'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeCheckoutProvider from '../../src/components/VueStripeCheckoutProvider.vue'
import { stripeCheckoutInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockStripe, makeMockCheckout, makeMockCheckoutSession } from '../setup'

// Mount Provider > CheckoutProvider > <component using useCheckoutSession>; returns the composable api + checkout mock.
async function mountWith(checkout = makeMockCheckout()) {
  const stripe = { ...makeMockStripe(), initCheckout: vi.fn(() => Promise.resolve(checkout)) }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  let api: any
  const Comp = defineComponent({
    setup() { api = useCheckoutSession(); return {} },
    render: () => h('div')
  })

  mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () => h(VueStripeCheckoutProvider, { clientSecret: 'cs_test_123_secret' }, { default: () => h(Comp) })
    }
  })
  await flushPromises()
  return { api: () => api, checkout }
}

describe('useCheckoutSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside a VueStripeCheckoutProvider', () => {
    expect(() =>
      mount(defineComponent({ setup() { useCheckoutSession(); return {} }, render: () => h('div') }))
    ).toThrow('useCheckoutSession must be used within a VueStripeCheckoutProvider component')
  })

  it('exposes the reactive session seeded from the checkout', async () => {
    const checkout = makeMockCheckout()
    checkout.session = vi.fn(() => makeMockCheckoutSession({ email: 'seed@b.com' }))
    const { api } = await mountWith(checkout)
    expect(api().session.value.email).toBe('seed@b.com')
    expect(api().loading.value).toBe(false)
  })

  it('forwards session methods to the checkout instance', async () => {
    const { api, checkout } = await mountWith()

    await api().updateEmail('new@b.com')
    expect(checkout.updateEmail).toHaveBeenCalledWith('new@b.com')

    await api().applyPromotionCode('PROMO10')
    expect(checkout.applyPromotionCode).toHaveBeenCalledWith('PROMO10')

    await api().updateLineItemQuantity({ lineItem: 'li_1', quantity: 3 })
    expect(checkout.updateLineItemQuantity).toHaveBeenCalledWith({ lineItem: 'li_1', quantity: 3 })

    await api().confirm({ returnUrl: 'https://example.com/done' })
    expect(checkout.confirm).toHaveBeenCalledWith({ returnUrl: 'https://example.com/done' })

    api().changeAppearance({ theme: 'night' })
    expect(checkout.changeAppearance).toHaveBeenCalledWith({ theme: 'night' })
  })

  it('getSession returns the current snapshot from the checkout', async () => {
    const checkout = makeMockCheckout()
    checkout.session = vi.fn(() => makeMockCheckoutSession({ id: 'cs_snapshot' }))
    const { api } = await mountWith(checkout)
    expect(api().getSession().id).toBe('cs_snapshot')
  })

  it('returns a graceful error result if a method is called before the session is ready', async () => {
    // Inject a context whose checkout ref is still null (session not yet created).
    let api: any
    const Comp = defineComponent({ setup() { api = useCheckoutSession(); return {} }, render: () => h('div') })
    const Host = defineComponent({
      setup() {
        provide(stripeCheckoutInjectionKey, {
          checkout: ref(null),
          session: ref(null),
          loading: ref(true),
          error: ref(null)
        })
        return () => h(Comp)
      }
    })
    mount(Host)

    const result = await api.updateEmail('x@y.com')
    expect(result.type).toBe('error')
    expect(result.error.message).toMatch(/not ready/i)
  })
})
