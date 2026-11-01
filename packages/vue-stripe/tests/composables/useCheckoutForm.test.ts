import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import { useCheckoutForm } from '../../src/composables/useCheckoutForm'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeCheckoutFormProvider from '../../src/components/VueStripeCheckoutFormProvider'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import { stripeCheckoutFormInjectionKey } from '../../src/utils/injection-keys'
import { VueStripeCheckoutError } from '../../src/utils/errors'
import {
  flushPromises,
  makeMockStripe,
  makeMockCheckoutForm,
  makeMockCheckoutFormActions,
  makeMockCheckoutSession
} from '../setup'

type Api = ReturnType<typeof useCheckoutForm>

const Probe = (capture: (api: Api) => void) =>
  defineComponent({
    setup() {
      capture(useCheckoutForm())
      return () => h('div')
    }
  })

// Provider > CheckoutFormProvider > component using useCheckoutForm.
async function mountWith(checkoutForm = makeMockCheckoutForm()) {
  const stripe = makeMockStripe()
  stripe.initCheckoutFormSdk.mockReturnValue(checkoutForm)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  let api!: Api
  mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () =>
        h(
          VueStripeCheckoutFormProvider,
          { clientSecret: 'cs_test_123_secret' },
          { default: () => h(Probe((a) => (api = a))) }
        )
    }
  })
  await flushPromises()
  await flushPromises()
  return { api: () => api, checkoutForm }
}

// Provide a hand-built (not yet loaded) context directly, without the provider.
function mountWithContext(context: Record<string, unknown>) {
  let api!: Api
  mount(
    defineComponent({
      setup() {
        provide(stripeCheckoutFormInjectionKey, context as never)
        return () => h(Probe((a) => (api = a)))
      }
    })
  )
  return api
}

describe('useCheckoutForm (Checkout Form SDK actions, beta)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws a typed error outside VueStripeCheckoutFormProvider', () => {
    const run = () => mount(Probe(() => {}))
    expect(run).toThrow(VueStripeCheckoutError)
    expect(run).toThrow('useCheckoutForm must be used within a VueStripeCheckoutFormProvider')
  })

  it('does not accept a VueStripeCheckoutElementsProvider', async () => {
    const stripe = makeMockStripe()
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const errorHandler = vi.fn()
    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(
            VueStripeCheckoutElementsProvider,
            { clientSecret: 'cs_test' },
            { default: () => h(Probe(() => {})) }
          )
      },
      global: { config: { errorHandler } }
    })
    await flushPromises()
    await flushPromises()
    expect(errorHandler.mock.calls[0]?.[0]).toBeInstanceOf(VueStripeCheckoutError)
  })

  it('exposes checkout, actions and the session seeded from actions.getSession()', async () => {
    const actions = makeMockCheckoutFormActions()
    actions.getSession.mockReturnValue(makeMockCheckoutSession({ email: 'seed@b.com' }))
    const checkoutForm = makeMockCheckoutForm(actions)
    const { api } = await mountWith(checkoutForm)
    expect(api().checkout.value).toBe(checkoutForm)
    expect(api().actions.value).toBe(actions)
    expect(api().session.value).toMatchObject({ email: 'seed@b.com' })
    expect(api().loading.value).toBe(false)
    expect(api().error.value).toBe(null)
  })

  it('forwards every Form SDK action to actions.* with its arguments', async () => {
    const actions = makeMockCheckoutFormActions()
    const { api } = await mountWith(makeMockCheckoutForm(actions))
    const calls: Array<[keyof Api & keyof typeof actions, unknown[]]> = [
      ['confirm', [{ returnUrl: 'https://example.com/done' }]],
      ['applyPromotionCode', ['PROMO10']],
      ['removePromotionCode', []],
      ['updateLineItemQuantity', [{ lineItem: 'li_1', quantity: 3 }]],
      ['updateShippingOption', ['shr_1']],
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

  it('confirm forwards the form confirm event as formConfirmEvent', async () => {
    const actions = makeMockCheckoutFormActions()
    const { api } = await mountWith(makeMockCheckoutForm(actions))
    const formConfirmEvent = {
      source: 'checkout-form-pay-button' as const,
      paymentMethodType: 'card'
    }
    await api().confirm({ formConfirmEvent })
    expect(actions.confirm).toHaveBeenCalledWith({ formConfirmEvent })
  })

  it('leaves out the updates the form UI owns (email, phone, names, addresses, tax ID)', async () => {
    const { api } = await mountWith()
    for (const name of [
      'updateEmail',
      'updatePhoneNumber',
      'updateIndividualName',
      'updateBusinessName',
      'updateBillingAddress',
      'updateShippingAddress',
      'updateTaxIdInfo'
    ]) {
      expect(api(), name).not.toHaveProperty(name)
    }
  })

  it('getSession() reads actions.getSession()', async () => {
    const actions = makeMockCheckoutFormActions()
    actions.getSession.mockReturnValue(makeMockCheckoutSession({ id: 'cs_form_snapshot' }))
    const { api } = await mountWith(makeMockCheckoutForm(actions))
    expect(api().getSession()).toMatchObject({ id: 'cs_form_snapshot' })
  })

  it('changeAppearance and loadFonts go to the SDK instance', async () => {
    const checkoutForm = makeMockCheckoutForm()
    const { api } = await mountWith(checkoutForm)
    api().changeAppearance({ theme: 'night' })
    api().loadFonts([{ cssSrc: 'https://fonts.example.com/inter.css' }])
    expect(checkoutForm.changeAppearance).toHaveBeenCalledWith({ theme: 'night' })
    expect(checkoutForm.loadFonts).toHaveBeenCalledWith([
      { cssSrc: 'https://fonts.example.com/inter.css' }
    ])
  })

  it('getForm and getCurrencySelectorElement return the SDK instance elements', async () => {
    const checkoutForm = makeMockCheckoutForm()
    const form = { id: 'form' }
    const selector = { id: 'currencySelector' }
    checkoutForm.getForm.mockReturnValue(form)
    checkoutForm.getCurrencySelectorElement.mockReturnValue(selector)
    const { api } = await mountWith(checkoutForm)
    expect(api().getForm()).toBe(form)
    expect(api().getCurrencySelectorElement()).toBe(selector)
  })

  it('resolves { type: "error" } when Stripe throws an integration error (#579)', async () => {
    const { api, checkoutForm } = await mountWith()
    const actions = (await checkoutForm.loadActions.mock.results[0]!.value).actions
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

  it('names an action the loaded session does not have instead of "not ready" (#593)', async () => {
    const { api, checkoutForm } = await mountWith()
    const actions = (await checkoutForm.loadActions.mock.results[0]!.value).actions
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
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
    await expect(api.applyPromotionCode('X')).resolves.toMatchObject({ type: 'error' })
    expect(api.getSession()).toBe(null)
    expect(() => api.changeAppearance({ theme: 'night' })).not.toThrow()
    expect(() => api.loadFonts([])).not.toThrow()
    expect(api.getForm()).toBe(null)
    expect(api.getCurrencySelectorElement()).toBe(null)
    expect(warnSpy).toHaveBeenCalledWith(
      '[Vue Stripe] changeAppearance called before the Checkout Form is ready'
    )
    warnSpy.mockRestore()
  })
})
