import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeCheckoutFormProvider from '../../src/components/VueStripeCheckoutFormProvider'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import {
  flushPromises,
  makeMockCheckout,
  makeMockCheckoutForm,
  makeMockStripe,
  type MockStripe
} from '../setup'

// #697: Stripe.js checks a client secret Promise in a chain of its own that nothing handles, so a
// rejected secret, or one resolving to anything but a string, became an uncaught rejection next
// to the provider's #error. The mock SDKs below do the same.
const STRIPE_MESSAGE =
  'The client secret promise should always resolve with a string. The promise that was provided resolved with a value type of undefined.'

function stripeLikeInit(make: () => { loadActions: ReturnType<typeof vi.fn> }) {
  return (options: { clientSecret: unknown }) => {
    const sdk = make()
    const secret = Promise.resolve(options.clientSecret).then((value) => {
      if (typeof value !== 'string') throw new Error(STRIPE_MESSAGE)
      return value
    })
    // Stripe also starts loading the session from it, in a chain nothing handles.
    void secret.then(() => {})
    const loaded = sdk.loadActions.getMockImplementation()!
    sdk.loadActions.mockImplementation(() => secret.then(() => loaded()))
    return sdk
  }
}

const providers = [
  {
    name: 'VueStripeCheckoutElementsProvider',
    component: VueStripeCheckoutElementsProvider,
    init: 'initCheckoutElementsSdk',
    make: makeMockCheckout
  },
  {
    name: 'VueStripeCheckoutFormProvider',
    component: VueStripeCheckoutFormProvider,
    init: 'initCheckoutFormSdk',
    make: makeMockCheckoutForm
  }
] as const

const settle = async () => {
  for (let i = 0; i < 4; i++) await flushPromises()
}

enableAutoUnmount(afterEach)

describe.each(providers)('$name: a failing client secret (#697)', ({ component, init, make }) => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  const unhandled: unknown[] = []
  const onUnhandled = (reason: unknown) => unhandled.push(reason)
  beforeEach(() => {
    vi.clearAllMocks()
    unhandled.length = 0
    process.on('unhandledRejection', onUnhandled)
  })
  afterEach(() => {
    process.off('unhandledRejection', onUnhandled)
  })

  // Provider > checkout provider (#error slot) > child.
  async function mountWith(props: Record<string, unknown>) {
    const stripe = makeMockStripe()
    stripe[init]!.mockImplementation(stripeLikeInit(make))
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const onError = vi.fn()
    const onReady = vi.fn()
    const shown = ref(true)
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            VueStripeProvider,
            { publishableKey: 'pk_test_123' },
            {
              default: () =>
                shown.value
                  ? h(
                      component,
                      { ...props, onError, onReady },
                      {
                        default: () => h('div', { class: 'child' }),
                        error: ({ error }: { error: string }) =>
                          h('p', { class: 'custom-error' }, error)
                      }
                    )
                  : null
            }
          )
      }
    })
    const wrapper = mount(Host)
    await settle()
    return { wrapper, stripe, onError, onReady, shown }
  }

  it.each([
    [
      'rejects (refused connection)',
      () => Promise.reject(new TypeError('Failed to fetch')),
      'Failed to fetch'
    ],
    [
      'rejects (HTML error page)',
      () =>
        Promise.reject(new SyntaxError(`Unexpected token '<', "<!doctype "... is not valid JSON`)),
      `Unexpected token '<', "<!doctype "... is not valid JSON`
    ],
    [
      'resolves no client secret (500 with a JSON error)',
      () => Promise.resolve(undefined),
      'fetchClientSecret did not resolve to a client secret'
    ],
    [
      'resolves an empty string',
      () => Promise.resolve(''),
      'fetchClientSecret did not resolve to a client secret'
    ],
    [
      'throws synchronously',
      () => {
        throw new Error('fetch is not defined')
      },
      'fetch is not defined'
    ],
    ['rejects with a non-Error value', () => Promise.reject('boom'), 'boom']
  ])(
    'reports fetchClientSecret that %s through @error and #error, with nothing uncaught',
    async (_, fetchClientSecret, message) => {
      const { wrapper, onError, onReady } = await mountWith({ fetchClientSecret })
      expect(onError.mock.calls).toEqual([[message]])
      expect(onReady).not.toHaveBeenCalled()
      expect(wrapper.find('.custom-error').text()).toBe(message)
      expect(unhandled).toEqual([])
    }
  )

  it('reports a clientSecret Promise that resolves no client secret', async () => {
    const { wrapper, onError } = await mountWith({ clientSecret: Promise.resolve(undefined) })
    const message = 'clientSecret did not resolve to a client secret'
    expect(onError.mock.calls).toEqual([[message]])
    expect(wrapper.find('.custom-error').text()).toBe(message)
    expect(unhandled).toEqual([])
  })

  // Under VueStripeProvider the checkout provider only exists once Stripe.js has loaded. With
  // createVueStripe() it exists right away, so it takes the Promise over before Stripe.js loads.
  it('handles a clientSecret Promise that rejects before Stripe.js has loaded', async () => {
    const stripe = makeMockStripe()
    stripe[init]!.mockImplementation(stripeLikeInit(make))
    const current = shallowRef<MockStripe | null>(null)
    let reject!: (reason: Error) => void
    const clientSecret = new Promise<string>((_, r) => (reject = r))
    const onError = vi.fn()
    const Parent = defineComponent({
      setup() {
        provide(stripeInjectionKey, {
          stripe: current as never,
          loading: ref(true),
          error: ref(null)
        })
        return () => h(component, { clientSecret, onError })
      }
    })
    const wrapper = mount(Parent)
    reject(new TypeError('Failed to fetch'))
    await settle()
    current.value = stripe
    await settle()
    expect(onError.mock.calls).toEqual([['Failed to fetch']])
    expect(wrapper.text()).toBe('Failed to fetch')
    expect(stripe[init]).not.toHaveBeenCalled()
    expect(unhandled).toEqual([])
  })

  it('uses a clientSecret string that arrives before Stripe.js has loaded', async () => {
    const stripe = makeMockStripe()
    stripe[init]!.mockImplementation(stripeLikeInit(make))
    const current = shallowRef<MockStripe | null>(null)
    const clientSecret = ref('')
    const Parent = defineComponent({
      setup() {
        provide(stripeInjectionKey, {
          stripe: current as never,
          loading: ref(true),
          error: ref(null)
        })
        return () => h(component, { clientSecret: clientSecret.value })
      }
    })
    mount(Parent)
    clientSecret.value = 'cs_test_late_secret_x'
    await settle()
    current.value = stripe
    await settle()
    expect(stripe[init]!.mock.calls[0]?.[0].clientSecret).toBe('cs_test_late_secret_x')
  })

  it('hands Stripe the resolved secret and loads the actions', async () => {
    const { stripe, onError, onReady, wrapper } = await mountWith({
      fetchClientSecret: () => Promise.resolve('cs_test_1_secret_2')
    })
    await expect(stripe[init]!.mock.calls[0]?.[0].clientSecret).resolves.toBe('cs_test_1_secret_2')
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
    expect(wrapper.find('.child').exists()).toBe(true)
  })

  it('stays silent when the secret fails after unmount', async () => {
    let reject!: (reason: Error) => void
    const fetchClientSecret = () => new Promise<string>((_, r) => (reject = r))
    const { onError, shown } = await mountWith({ fetchClientSecret })
    shown.value = false
    await settle()
    reject(new TypeError('Failed to fetch'))
    await settle()
    expect(onError).not.toHaveBeenCalled()
    expect(unhandled).toEqual([])
  })
})
