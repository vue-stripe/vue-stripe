import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, inject, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeCheckoutFormProvider from '../../src/components/VueStripeCheckoutFormProvider'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import {
  stripeCheckoutFormInjectionKey,
  stripeCheckoutInjectionKey
} from '../../src/utils/injection-keys'
import {
  flushPromises,
  makeMockStripe,
  makeMockCheckoutForm,
  makeMockCheckoutFormActions,
  makeMockCheckoutSession
} from '../setup'

type Injected = NonNullable<ReturnType<typeof inject<typeof stripeCheckoutFormInjectionKey>>> | null

// Mount Provider > CheckoutFormProvider > Child; returns the injected context too.
async function mountWith(
  providerProps: Record<string, unknown> = { clientSecret: 'cs_test_123_secret_456' },
  checkoutForm = makeMockCheckoutForm(),
  slots: Record<string, unknown> = {}
) {
  const stripe = makeMockStripe()
  stripe.initCheckoutFormSdk.mockReturnValue(checkoutForm)
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const injected = shallowRef<Injected>(null)
  const elementsKey = shallowRef<unknown>('unset')
  const show = ref(true)
  const Child = defineComponent({
    setup() {
      injected.value = inject(stripeCheckoutFormInjectionKey, null)
      elementsKey.value = inject(stripeCheckoutInjectionKey, null)
      return () => h('div', { class: 'checkout-form-child' }, 'child')
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
                ? h(VueStripeCheckoutFormProvider, providerProps, {
                    default: () => h(Child),
                    ...slots
                  })
                : null
          }
        )
    }
  })
  const wrapper = mount(Host)
  await flushPromises()
  await flushPromises()
  const provider = () => wrapper.findComponent(VueStripeCheckoutFormProvider)
  return { wrapper, stripe, checkoutForm, injected, elementsKey, show, provider }
}

describe('VueStripeCheckoutFormProvider (Stripe.js 10 Checkout Form SDK, beta)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside VueStripeProvider', () => {
    expect(() =>
      mount(VueStripeCheckoutFormProvider, { props: { clientSecret: 'cs_test' } })
    ).toThrow(
      'VueStripeCheckoutFormProvider must be used within a VueStripeProvider component or an app using createVueStripe()'
    )
  })

  it('calls initCheckoutFormSdk synchronously with a clientSecret string', async () => {
    const { stripe } = await mountWith({ clientSecret: 'cs_test_secret' })
    expect(stripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1)
    expect(stripe.initCheckoutFormSdk).toHaveBeenCalledWith({ clientSecret: 'cs_test_secret' })
    expect(stripe.initCheckoutElementsSdk).not.toHaveBeenCalled()
  })

  it('accepts a Promise<string> clientSecret and passes it through untouched', async () => {
    const secret = Promise.resolve('cs_from_promise')
    const { stripe } = await mountWith({ clientSecret: secret })
    expect(stripe.initCheckoutFormSdk.mock.calls[0]?.[0].clientSecret).toBe(secret)
  })

  it('wraps fetchClientSecret() into the clientSecret option', async () => {
    const fetchClientSecret = vi.fn(() => Promise.resolve('cs_from_fn'))
    const { stripe } = await mountWith({ fetchClientSecret })
    const call = stripe.initCheckoutFormSdk.mock.calls[0]?.[0]
    expect(fetchClientSecret).toHaveBeenCalledTimes(1)
    await expect(call.clientSecret).resolves.toBe('cs_from_fn')
    expect(call).not.toHaveProperty('fetchClientSecret')
  })

  it('forwards appearance, loader, fonts, savedPaymentMethod and defaultValues', async () => {
    const options = {
      appearance: { theme: 'night' },
      loader: 'always',
      fonts: [{ cssSrc: 'https://fonts.example.com/inter.css' }],
      savedPaymentMethod: { enableSave: 'never' },
      defaultValues: { email: 'jenny@example.com' }
    }
    const { stripe } = await mountWith({ clientSecret: 'cs_test_secret', ...options })
    expect(stripe.initCheckoutFormSdk).toHaveBeenCalledWith({
      clientSecret: 'cs_test_secret',
      ...options
    })
  })

  it('renders the default slot immediately, before loadActions resolves', async () => {
    const checkoutForm = makeMockCheckoutForm()
    checkoutForm.loadActions.mockReturnValue(new Promise(() => {})) // never resolves
    const { wrapper, injected } = await mountWith(undefined, checkoutForm)
    expect(wrapper.find('.checkout-form-child').exists()).toBe(true)
    expect(injected.value?.checkout.value).toBe(checkoutForm)
    expect(injected.value?.actions.value).toBe(null)
    expect(injected.value?.loading.value).toBe(true)
  })

  it('provides only its own key (the Checkout Elements key stays unprovided)', async () => {
    const { elementsKey, injected } = await mountWith()
    expect(injected.value).not.toBe(null)
    expect(elementsKey.value).toBe(null)
  })

  it('provides actions + session after loadActions resolves and emits ready(actions)', async () => {
    const actions = makeMockCheckoutFormActions()
    actions.getSession.mockReturnValue(makeMockCheckoutSession({ email: 'a@b.com' }))
    const { injected, provider } = await mountWith(undefined, makeMockCheckoutForm(actions))
    expect(injected.value?.actions.value).toBe(actions)
    expect(injected.value?.session.value).toMatchObject({ email: 'a@b.com' })
    expect(injected.value?.loading.value).toBe(false)
    expect(provider().emitted('ready')?.[0]).toEqual([actions])
  })

  it('passes checkout, actions, session and loading to the default slot', async () => {
    const actions = makeMockCheckoutFormActions()
    const checkoutForm = makeMockCheckoutForm(actions)
    const seen = shallowRef<Record<string, unknown> | null>(null)
    await mountWith(undefined, checkoutForm, {
      default: (props: Record<string, unknown>) => {
        seen.value = props
        return h('div')
      }
    })
    expect(seen.value).toMatchObject({ checkout: checkoutForm, actions, loading: false })
  })

  it('reports a rejected loadActions() through @error, #error and loading (#590)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const checkoutForm = makeMockCheckoutForm()
    checkoutForm.loadActions.mockRejectedValue(
      new Error('You cannot update the email because a `customer_email` is already set.')
    )
    const { wrapper, provider, injected } = await mountWith(undefined, checkoutForm, {
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
    const checkoutForm = makeMockCheckoutForm()
    let resolveActions!: (value: unknown) => void
    const actions = (await checkoutForm.loadActions()).actions
    checkoutForm.loadActions.mockReturnValue(new Promise((r) => (resolveActions = r)))
    const { injected } = await mountWith(undefined, checkoutForm)
    const onChange = checkoutForm.on.mock.calls.find((c) => c[0] === 'change')?.[1]
    onChange?.(makeMockCheckoutSession({ email: 'early@b.com' }))
    expect(injected.value?.session.value).toBe(null)
    resolveActions({ type: 'success', actions })
    await flushPromises()
    expect(injected.value?.session.value).not.toBe(null)
  })

  it('emits error and renders #error when loadActions resolves { type: "error" }', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const checkoutForm = makeMockCheckoutForm()
    checkoutForm.loadActions.mockResolvedValue({
      type: 'error',
      error: { message: 'Session expired', code: null }
    })
    const { wrapper, provider } = await mountWith(undefined, checkoutForm, {
      error: ({ error }: { error: string }) => h('div', { class: 'checkout-error' }, error)
    })
    expect(wrapper.find('.checkout-error').text()).toBe('Session expired')
    expect(provider().emitted('error')?.[0]).toEqual(['Session expired'])
    // Handled through the #error slot, so not also logged (#651).
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('updates session and emits change on SDK "change" events', async () => {
    const checkoutForm = makeMockCheckoutForm()
    const { injected, provider } = await mountWith(undefined, checkoutForm)
    const onCall = checkoutForm.on.mock.calls.find((c) => c[0] === 'change')
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
    expect(stripe.initCheckoutFormSdk).not.toHaveBeenCalled()
    expect(provider().emitted('error')?.[0]?.[0]).toContain('clientSecret')
    expect(wrapper.text()).toContain('clientSecret')
    errorSpy.mockRestore()
  })

  it('surfaces a synchronous initCheckoutFormSdk throw (no beta access) as an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stripe = makeMockStripe()
    stripe.initCheckoutFormSdk.mockImplementation(() => {
      throw new Error('initCheckoutFormSdk is not available')
    })
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeCheckoutFormProvider, { clientSecret: 'cs' }) }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('initCheckoutFormSdk is not available')
    errorSpy.mockRestore()
  })

  it('reports a non-Error throw with a generic message', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stripe = makeMockStripe()
    stripe.initCheckoutFormSdk.mockImplementation(() => {
      throw 'boom'
    })
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeCheckoutFormProvider, { clientSecret: 'cs' }) }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Failed to initialize the Checkout Form')
    errorSpy.mockRestore()
  })

  it('ignores change events and loadActions results after unmount', async () => {
    let resolveActions!: (value: unknown) => void
    const checkoutForm = makeMockCheckoutForm()
    checkoutForm.loadActions.mockReturnValue(new Promise((r) => (resolveActions = r)))
    const { injected, show, provider } = await mountWith(undefined, checkoutForm)
    const captured = injected.value
    const changeHandler = checkoutForm.on.mock.calls.find((c) => c[0] === 'change')?.[1]
    const providerWrapper = provider()

    show.value = false
    await flushPromises()

    resolveActions({ type: 'success', actions: makeMockCheckoutFormActions() })
    changeHandler?.(makeMockCheckoutSession({ email: 'late@b.com' }))
    await flushPromises()

    expect(captured?.checkout.value).toBe(null)
    expect(captured?.actions.value).toBe(null)
    expect(captured?.session.value).toBe(null)
    expect(providerWrapper.emitted('ready')).toBeUndefined()
    expect(providerWrapper.emitted('change')).toBeUndefined()
  })
})
