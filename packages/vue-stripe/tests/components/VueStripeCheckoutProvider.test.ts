import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, inject, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { stripeCheckoutInjectionKey } from '../../src/utils/injection-keys'
import {
  flushPromises,
  makeMockStripe,
  makeMockCheckout,
  makeMockCheckoutActions,
  makeMockCheckoutSession
} from '../setup'

type Injected = NonNullable<ReturnType<typeof inject<typeof stripeCheckoutInjectionKey>>> | null

// Mount Provider > CheckoutElementsProvider > Child; returns the injected context too.
async function mountWith(
  providerProps: Record<string, unknown> = { clientSecret: 'cs_test_123_secret_456' },
  checkout = makeMockCheckout(),
  slots: Record<string, unknown> = {},
  { flush = true } = {}
) {
  const stripe = makeMockStripe()
  stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const injected = shallowRef<Injected>(null)
  const show = ref(true)
  const Child = defineComponent({
    setup() {
      injected.value = inject(stripeCheckoutInjectionKey, null)
      return () => h('div', { class: 'checkout-child' }, 'child')
    }
  })
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          VueStripeProvider,
          { publishableKey: 'pk_test_123' },
          {
            default: () =>
              show.value
                ? h(VueStripeCheckoutElementsProvider, providerProps, {
                    default: () => h(Child),
                    ...slots
                  })
                : null
          }
        )
    }
  })
  const wrapper = mount(Host)
  if (flush) {
    await flushPromises()
    await flushPromises()
  }
  const provider = () => wrapper.findComponent(VueStripeCheckoutElementsProvider)
  return { wrapper, stripe, checkout, injected, show, provider }
}

describe('VueStripeCheckoutElementsProvider (Stripe.js 10 Checkout Elements SDK)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside VueStripeProvider', () => {
    expect(() =>
      mount(VueStripeCheckoutElementsProvider, { props: { clientSecret: 'cs_test' } })
    ).toThrow('must be used within a VueStripeProvider component or an app using createVueStripe()')
  })

  it('calls initCheckoutElementsSdk synchronously with a clientSecret string', async () => {
    const { stripe } = await mountWith({ clientSecret: 'cs_test_secret' })
    expect(stripe.initCheckoutElementsSdk).toHaveBeenCalledTimes(1)
    expect(stripe.initCheckoutElementsSdk).toHaveBeenCalledWith({ clientSecret: 'cs_test_secret' })
  })

  it('accepts a Promise<string> clientSecret and passes it through untouched', async () => {
    const secret = Promise.resolve('cs_from_promise')
    const { stripe } = await mountWith({ clientSecret: secret })
    expect(stripe.initCheckoutElementsSdk.mock.calls[0]?.[0].clientSecret).toBe(secret)
  })

  it('wraps fetchClientSecret() into the clientSecret option', async () => {
    const fetchClientSecret = vi.fn(() => Promise.resolve('cs_from_fn'))
    const { stripe } = await mountWith({ fetchClientSecret })
    const call = stripe.initCheckoutElementsSdk.mock.calls[0]?.[0]
    expect(fetchClientSecret).toHaveBeenCalledTimes(1)
    expect(call.clientSecret).toBeInstanceOf(Promise)
    await expect(call.clientSecret).resolves.toBe('cs_from_fn')
    expect(call).not.toHaveProperty('fetchClientSecret')
  })

  it('forwards elementsOptions, adaptivePricing and defaultValues', async () => {
    const elementsOptions = {
      appearance: { theme: 'night' },
      savedPaymentMethod: { enableSave: 'auto' }
    }
    const adaptivePricing = { allowed: true }
    const defaultValues = { email: 'jenny@example.com' }
    const { stripe } = await mountWith({
      clientSecret: 'cs_test_secret',
      elementsOptions,
      adaptivePricing,
      defaultValues
    })
    expect(stripe.initCheckoutElementsSdk).toHaveBeenCalledWith({
      clientSecret: 'cs_test_secret',
      elementsOptions,
      adaptivePricing,
      defaultValues
    })
  })

  it('renders the default slot immediately, before loadActions resolves', async () => {
    const checkout = makeMockCheckout()
    checkout.loadActions.mockReturnValue(new Promise(() => {})) // never resolves
    const { wrapper, injected } = await mountWith(undefined, checkout)
    expect(wrapper.find('.checkout-child').exists()).toBe(true)
    expect(injected.value?.checkout.value).toBe(checkout)
    expect(injected.value?.actions.value).toBe(null)
    expect(injected.value?.loading.value).toBe(true)
  })

  it('provides actions + session after loadActions resolves and emits ready(actions)', async () => {
    const actions = makeMockCheckoutActions()
    actions.getSession.mockReturnValue(makeMockCheckoutSession({ email: 'a@b.com' }))
    const { injected, provider } = await mountWith(undefined, makeMockCheckout(actions))
    expect(injected.value?.actions.value).toBe(actions)
    expect(injected.value?.session.value).toMatchObject({ email: 'a@b.com' })
    expect(injected.value?.loading.value).toBe(false)
    expect(provider().emitted('ready')?.[0]).toEqual([actions])
  })

  it('reports a rejected loadActions() through @error, #error and loading (#590)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const checkout = makeMockCheckout()
    checkout.loadActions.mockRejectedValue(
      new Error('You cannot update the email because a `customer_email` is already set.')
    )
    const { wrapper, provider, injected } = await mountWith(undefined, checkout, {
      error: ({ error }: { error: string }) => h('div', { class: 'checkout-error' }, error)
    })
    const message = 'You cannot update the email because a `customer_email` is already set.'
    expect(wrapper.find('.checkout-error').text()).toBe(message)
    expect(provider().emitted('error')?.[0]).toEqual([message])
    expect(injected.value?.error.value).toBe(message)
    expect(injected.value?.loading.value).toBe(false)
    expect(injected.value?.session.value).toBe(null)
    errorSpy.mockRestore()
  })

  it('keeps session null until loadActions() resolves (#590)', async () => {
    const checkout = makeMockCheckout()
    let resolveActions!: (value: unknown) => void
    const actions = (await checkout.loadActions()).actions
    checkout.loadActions.mockReturnValue(new Promise((r) => (resolveActions = r)))
    const { injected } = await mountWith(undefined, checkout)
    const onChange = checkout.on.mock.calls.find((c) => c[0] === 'change')?.[1]
    onChange?.(makeMockCheckoutSession({ email: 'early@b.com' }))
    expect(injected.value?.session.value).toBe(null)
    resolveActions({ type: 'success', actions })
    await flushPromises()
    expect(injected.value?.session.value).not.toBe(null)
  })

  it('emits error and renders #error when loadActions resolves { type: "error" }', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const checkout = makeMockCheckout()
    checkout.loadActions.mockResolvedValue({
      type: 'error',
      error: { message: 'Session expired', code: null }
    })
    const { wrapper, provider } = await mountWith(undefined, checkout, {
      error: ({ error }: { error: string }) => h('div', { class: 'checkout-error' }, error)
    })
    expect(wrapper.find('.checkout-error').text()).toBe('Session expired')
    expect(provider().emitted('error')?.[0]).toEqual(['Session expired'])
    // Handled through the #error slot, so not also logged (#651).
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('updates session and emits change on checkout "change" events', async () => {
    const checkout = makeMockCheckout()
    const { injected, provider } = await mountWith(undefined, checkout)
    const onCall = checkout.on.mock.calls.find((c) => c[0] === 'change')
    expect(onCall).toBeTruthy()
    const next = makeMockCheckoutSession({ email: 'changed@b.com', canConfirm: false })
    onCall?.[1](next)
    expect(injected.value?.session.value).toMatchObject({
      email: 'changed@b.com',
      canConfirm: false
    })
    expect(provider().emitted('change')?.[0]).toEqual([next])
  })

  it('emits error when neither clientSecret nor fetchClientSecret is given', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { stripe, provider, wrapper } = await mountWith({})
    expect(stripe.initCheckoutElementsSdk).not.toHaveBeenCalled()
    expect(provider().emitted('error')?.[0]?.[0]).toContain('clientSecret')
    expect(wrapper.text()).toContain('clientSecret')
    errorSpy.mockRestore()
  })

  it('surfaces a synchronous initCheckoutElementsSdk throw as an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stripe = makeMockStripe()
    stripe.initCheckoutElementsSdk.mockImplementation(() => {
      throw new Error('Invalid client secret')
    })
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeCheckoutElementsProvider, { clientSecret: 'bad' }) }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Invalid client secret')
    errorSpy.mockRestore()
  })

  it('ignores change events and loadActions results after unmount', async () => {
    let resolveActions!: (value: unknown) => void
    const checkout = makeMockCheckout()
    checkout.loadActions.mockReturnValue(new Promise((r) => (resolveActions = r)))
    const { injected, show, provider } = await mountWith(undefined, checkout)
    const captured = injected.value
    const changeHandler = checkout.on.mock.calls.find((c) => c[0] === 'change')?.[1]
    const providerWrapper = provider()

    show.value = false
    await flushPromises()

    resolveActions({ type: 'success', actions: makeMockCheckoutActions() })
    changeHandler?.(makeMockCheckoutSession({ email: 'late@b.com' }))
    await flushPromises()

    expect(captured?.checkout.value).toBe(null)
    expect(captured?.actions.value).toBe(null)
    expect(captured?.session.value).toBe(null)
    expect(providerWrapper.emitted('ready')).toBeUndefined()
    expect(providerWrapper.emitted('change')).toBeUndefined()
  })
})
