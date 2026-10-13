import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import { useCheckoutSession } from '../../src/composables/useCheckoutSession'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import { stripeCheckoutInjectionKey } from '../../src/utils/injection-keys'
import {
  flushPromises,
  makeMockStripe,
  makeMockCheckout,
  makeMockCheckoutActions,
  makeMockCheckoutSession
} from '../setup'

type Api = ReturnType<typeof useCheckoutSession>

// Provider > CheckoutElementsProvider > component using useCheckoutSession.
async function mountWith(checkout = makeMockCheckout()) {
  const stripe = makeMockStripe()
  stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  let api!: Api
  const Comp = defineComponent({
    setup() {
      api = useCheckoutSession()
      return () => h('div')
    }
  })
  mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () =>
        h(
          VueStripeCheckoutElementsProvider,
          { clientSecret: 'cs_test_123_secret' },
          { default: () => h(Comp) }
        )
    }
  })
  await flushPromises()
  await flushPromises()
  return { api: () => api, checkout }
}

// Provide a hand-built (not yet loaded) context directly, without the provider.
function mountWithContext(context: Record<string, unknown>) {
  let api!: Api
  const Comp = defineComponent({
    setup() {
      api = useCheckoutSession()
      return () => h('div')
    }
  })
  mount(
    defineComponent({
      setup() {
        provide(stripeCheckoutInjectionKey, context as never)
        return () => h(Comp)
      }
    })
  )
  return api
}

describe('useCheckoutSession (Checkout Elements SDK actions)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws a typed error outside VueStripeCheckoutElementsProvider', () => {
    expect(() =>
      mount(
        defineComponent({
          setup() {
            useCheckoutSession()
            return () => h('div')
          }
        })
      )
    ).toThrow(
      'useCheckoutSession must be used within a VueStripeCheckoutElementsProvider component'
    )
  })

  it('exposes checkout, actions and the session seeded from actions.getSession()', async () => {
    const actions = makeMockCheckoutActions()
    actions.getSession.mockReturnValue(makeMockCheckoutSession({ email: 'seed@b.com' }))
    const checkout = makeMockCheckout(actions)
    const { api } = await mountWith(checkout)
    expect(api().checkout.value).toBe(checkout)
    expect(api().actions.value).toBe(actions)
    expect(api().session.value).toMatchObject({ email: 'seed@b.com' })
    expect(api().loading.value).toBe(false)
    expect(api().error.value).toBe(null)
  })

  it('forwards every action to actions.* with its arguments', async () => {
    const actions = makeMockCheckoutActions()
    const { api } = await mountWith(makeMockCheckout(actions))
    const calls: Array<[keyof Api & keyof typeof actions, unknown[]]> = [
      ['confirm', [{ returnUrl: 'https://example.com/done' }]],
      ['applyPromotionCode', ['PROMO10']],
      ['removePromotionCode', []],
      ['updateEmail', ['new@b.com']],
      ['updatePhoneNumber', ['+15555550100']],
      ['updateBillingAddress', [{ name: 'Jenny', address: { country: 'US' } }]],
      ['updateShippingAddress', [{ name: 'Jenny', address: { country: 'US' } }]],
      ['updateLineItemQuantity', [{ lineItem: 'li_1', quantity: 3 }]],
      ['updateShippingOption', ['shr_1']],
      ['updateTaxIdInfo', [{ businessName: 'Acme', taxId: { type: 'eu_vat', value: 'DE123' } }]],
      ['runServerUpdate', [() => Promise.resolve()]],
      ['validateElements', []],
      ['addOptionalLineItem', ['price_123']],
      ['removeOptionalLineItem', ['price_123']]
    ]
    for (const [name, args] of calls) {
      const fn = api()[name] as (...a: unknown[]) => Promise<unknown>
      await fn(...args)
      expect(actions[name], name).toHaveBeenCalledWith(...args)
    }
  })

  it('getSession() reads actions.getSession()', async () => {
    const actions = makeMockCheckoutActions()
    actions.getSession.mockReturnValue(makeMockCheckoutSession({ id: 'cs_live_snapshot' }))
    const { api } = await mountWith(makeMockCheckout(actions))
    expect(api().getSession()).toMatchObject({ id: 'cs_live_snapshot' })
  })

  it('changeAppearance and loadFonts go to the SDK instance', async () => {
    const checkout = makeMockCheckout()
    const { api } = await mountWith(checkout)
    api().changeAppearance({ theme: 'night' })
    api().loadFonts([{ cssSrc: 'https://fonts.example.com/inter.css' }])
    expect(checkout.changeAppearance).toHaveBeenCalledWith({ theme: 'night' })
    expect(checkout.loadFonts).toHaveBeenCalledWith([
      { cssSrc: 'https://fonts.example.com/inter.css' }
    ])
  })

  it('element getters return the elements created on the SDK instance', async () => {
    const checkout = makeMockCheckout()
    const payment = { id: 'payment' }
    checkout.getPaymentElement.mockReturnValue(payment)
    const { api } = await mountWith(checkout)
    expect(api().getPaymentElement()).toBe(payment)
    const getters = [
      'getBillingAddressElement',
      'getShippingAddressElement',
      'getExpressCheckoutElement',
      'getCurrencySelectorElement',
      'getTaxIdElement',
      'getTermsElement',
      'getLinkSignupElement'
    ] as const
    for (const getter of getters) {
      const element = { id: getter }
      checkout[getter].mockReturnValue(element)
      expect(api()[getter](), getter).toBe(element)
    }
  })

  it('element getters return null where Stripe throws for an element the account cannot use (#635)', async () => {
    const checkout = makeMockCheckout()
    checkout.getTermsElement.mockImplementation(() => {
      throw new Error(
        'You cannot use the Terms Element without being gated into this functionality.'
      )
    })
    checkout.getLinkSignupElement.mockImplementation(() => {
      throw new Error('A valid Element name must be provided.')
    })
    const { api } = await mountWith(checkout)
    expect(api().getTermsElement()).toBeNull()
    expect(api().getLinkSignupElement()).toBeNull()
  })

  it('resolves { type: "error" } when Stripe throws an integration error (#579)', async () => {
    const { api, checkout } = await mountWith()
    const actions = (await checkout.loadActions.mock.results[0]!.value).actions
    actions.confirm.mockImplementation(() => {
      throw new Error('An email address is required to confirm this Checkout Session.')
    })
    actions.updateLineItemQuantity.mockRejectedValueOnce(
      new Error('You must first set line_items.adjustable_quantity.enabled=true')
    )
    await expect(api().confirm()).resolves.toEqual({
      type: 'error',
      error: {
        message: 'An email address is required to confirm this Checkout Session.',
        code: null
      }
    })
    await expect(api().updateLineItemQuantity({ lineItem: 'li_1', quantity: 2 })).resolves.toEqual({
      type: 'error',
      error: {
        message: 'You must first set line_items.adjustable_quantity.enabled=true',
        code: null
      }
    })
  })

  it('turns a non-Error throw into an error result', async () => {
    const { api, checkout } = await mountWith()
    const actions = (await checkout.loadActions.mock.results[0]!.value).actions
    actions.applyPromotionCode.mockImplementation(() => {
      throw 'boom'
    })
    actions.removePromotionCode.mockRejectedValueOnce('gone')
    await expect(api().applyPromotionCode('X')).resolves.toEqual({
      type: 'error',
      error: { message: 'boom', code: null }
    })
    await expect(api().removePromotionCode()).resolves.toEqual({
      type: 'error',
      error: { message: 'gone', code: null }
    })
  })

  it('names an action the loaded session does not have instead of "not ready" (#593)', async () => {
    const { api, checkout } = await mountWith()
    const actions = (await checkout.loadActions.mock.results[0]!.value).actions
    delete (actions as Record<string, unknown>)['addOptionalLineItem']
    await expect(api().addOptionalLineItem('price_123')).resolves.toEqual({
      type: 'error',
      error: {
        message: 'addOptionalLineItem is not available for this Checkout Session',
        code: null
      }
    })
  })

  it('returns the not-ready sentinel before loadActions() resolves', async () => {
    const api = mountWithContext({
      checkout: shallowRef(null),
      actions: shallowRef(null),
      session: shallowRef(null),
      loading: ref(true),
      error: ref(null)
    })
    await expect(api.confirm()).resolves.toEqual({
      type: 'error',
      error: { message: 'Checkout session is not ready yet', code: null }
    })
    await expect(api.updateEmail('x@y.z')).resolves.toMatchObject({ type: 'error' })
    expect(api.getSession()).toBe(null)
    expect(() => api.changeAppearance({ theme: 'night' })).not.toThrow()
    expect(api.getPaymentElement()).toBe(null)
    expect(api.getTaxIdElement()).toBe(null)
  })
})
