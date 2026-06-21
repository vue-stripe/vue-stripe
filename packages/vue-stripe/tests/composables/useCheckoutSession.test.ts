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
    // 8.x: the session is seeded from actions.getSession() loaded via loadActions().
    checkout.actions.getSession = vi.fn(() => makeMockCheckoutSession({ email: 'seed@b.com' }))
    const { api } = await mountWith(checkout)
    expect(api().session.value.email).toBe('seed@b.com')
    expect(api().loading.value).toBe(false)
  })

  it('forwards session methods to the checkout actions', async () => {
    const { api, checkout } = await mountWith()

    await api().updateEmail('new@b.com')
    expect(checkout.actions.updateEmail).toHaveBeenCalledWith('new@b.com')

    await api().applyPromotionCode('PROMO10')
    expect(checkout.actions.applyPromotionCode).toHaveBeenCalledWith('PROMO10')

    await api().updateLineItemQuantity({ lineItem: 'li_1', quantity: 3 })
    expect(checkout.actions.updateLineItemQuantity).toHaveBeenCalledWith({ lineItem: 'li_1', quantity: 3 })

    await api().confirm({ returnUrl: 'https://example.com/done' })
    expect(checkout.actions.confirm).toHaveBeenCalledWith({ returnUrl: 'https://example.com/done' })

    // changeAppearance remains on the checkout instance, not behind loadActions().
    api().changeAppearance({ theme: 'night' })
    expect(checkout.changeAppearance).toHaveBeenCalledWith({ theme: 'night' })
  })

  it('forwards every session method to the underlying checkout actions', async () => {
    const { api, checkout } = await mountWith()
    const methods = [
      'confirm', 'applyPromotionCode', 'removePromotionCode', 'updateEmail',
      'updatePhoneNumber', 'updateBillingAddress', 'updateShippingAddress',
      'updateLineItemQuantity', 'updateShippingOption', 'updateTaxIdInfo', 'runServerUpdate'
    ] as const
    for (const name of methods) {
      await (api() as any)[name]('arg')
      expect((checkout.actions as any)[name]).toHaveBeenCalledTimes(1)
    }
  })

  it('getSession returns the current snapshot from the checkout actions', async () => {
    const checkout = makeMockCheckout()
    checkout.actions.getSession = vi.fn(() => makeMockCheckoutSession({ id: 'cs_snapshot' }))
    const { api } = await mountWith(checkout)
    expect(api().getSession().id).toBe('cs_snapshot')
  })

  it('returns a graceful error result if a method is called before the actions are ready', async () => {
    // Inject a context whose actions ref is still null (loadActions() not resolved).
    let api: any
    const Comp = defineComponent({ setup() { api = useCheckoutSession(); return {} }, render: () => h('div') })
    const Host = defineComponent({
      setup() {
        provide(stripeCheckoutInjectionKey, {
          checkout: ref(null),
          actions: ref(null),
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
    // sentinel conforms to Stripe's result-union shape ({ message, code })
    expect(result.error.code).toBeNull()
  })

  it('changeAppearance warns and no-ops when the session is not ready', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let api: any
    const Comp = defineComponent({ setup() { api = useCheckoutSession(); return {} }, render: () => h('div') })
    const Host = defineComponent({
      setup() {
        provide(stripeCheckoutInjectionKey, {
          checkout: ref(null),
          actions: ref(null),
          session: ref(null),
          loading: ref(true),
          error: ref(null)
        })
        return () => h(Comp)
      }
    })
    mount(Host)

    expect(() => api.changeAppearance({ theme: 'night' })).not.toThrow()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('changeAppearance'))
    warn.mockRestore()
  })
})
