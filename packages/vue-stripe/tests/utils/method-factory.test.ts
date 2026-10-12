import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue-demi'
import { createStripeMethodComposable } from '../../src/utils/method-factory'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { VueStripeProviderError } from '../../src/utils/errors'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockStripe } from '../setup'

const useConfirmCardPayment = createStripeMethodComposable('confirmCardPayment')

// Mount Provider > <component calling `useComposable`> on a stripe instance with the
// given method mocks; returns the composable's value and the stripe instance.
async function mountWith(stripeMethods: Record<string, unknown>, useComposable: () => unknown) {
  const stripe = { ...makeMockStripe(), ...stripeMethods }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  let api: any
  const Comp = defineComponent({
    setup() {
      api = useComposable()
      return {}
    },
    render: () => h('div')
  })
  mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: { default: () => h(Comp) }
  })
  await flushPromises()
  return { api: api as any, stripe }
}

// A promise whose settlement the test controls.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('createStripeMethodComposable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the wrapped method under its Stripe name, plus loading and error', async () => {
    const { api } = await mountWith({}, useConfirmCardPayment)

    expect(Object.keys(api).sort()).toEqual(['confirmCardPayment', 'error', 'loading'])
    expect(typeof api.confirmCardPayment).toBe('function')
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
  })

  it('forwards every argument to the Stripe method and returns its result untouched', async () => {
    const result = { paymentIntent: { id: 'pi_123', status: 'succeeded' } }
    const confirmCardPayment = vi.fn(() => Promise.resolve(result))
    const { api, stripe } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    const data = { payment_method: { card: {} } }
    const options = { handleActions: false }
    await expect(api.confirmCardPayment('pi_secret', data, options)).resolves.toBe(result)

    expect(confirmCardPayment).toHaveBeenCalledWith('pi_secret', data, options)
    // Called as a method of the Stripe instance (Stripe.js relies on `this`).
    expect(confirmCardPayment.mock.instances[0]).toBe(stripe)
    expect(api.error.value).toBe(null)
  })

  it('is loading while the Stripe call is in flight', async () => {
    const pending = deferred<{ paymentIntent: object }>()
    const confirmCardPayment = vi.fn(() => pending.promise)
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    const call = api.confirmCardPayment('pi_secret')
    expect(api.loading.value).toBe(true)

    pending.resolve({ paymentIntent: {} })
    await call
    expect(api.loading.value).toBe(false)
  })

  it('stays loading until every overlapping call has settled', async () => {
    const first = deferred<object>()
    const second = deferred<object>()
    const confirmCardPayment = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    const a = api.confirmCardPayment('pi_a')
    const b = api.confirmCardPayment('pi_b')
    first.resolve({})
    await a
    expect(api.loading.value).toBe(true)

    second.resolve({})
    await b
    expect(api.loading.value).toBe(false)
  })

  it('sets error from a Stripe { error } result and still returns the result', async () => {
    const result = { error: { type: 'card_error', message: 'Your card was declined.' } }
    const confirmCardPayment = vi.fn(() => Promise.resolve(result))
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    await expect(api.confirmCardPayment('pi_secret')).resolves.toBe(result)
    expect(api.error.value).toBe('Your card was declined.')
    expect(api.loading.value).toBe(false)
  })

  it('falls back to a generic message when the Stripe error has none', async () => {
    const confirmCardPayment = vi.fn(() => Promise.resolve({ error: { type: 'api_error' } }))
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    await api.confirmCardPayment('pi_secret')
    expect(api.error.value).toBe('confirmCardPayment failed')
  })

  it('clears a previous error when the next call succeeds', async () => {
    const confirmCardPayment = vi
      .fn()
      .mockResolvedValueOnce({ error: { message: 'declined' } })
      .mockResolvedValueOnce({ paymentIntent: {} })
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    await api.confirmCardPayment('pi_secret')
    expect(api.error.value).toBe('declined')
    await api.confirmCardPayment('pi_secret')
    expect(api.error.value).toBe(null)
  })

  it('captures a thrown error into error and rethrows it', async () => {
    const boom = new Error('network down')
    const confirmCardPayment = vi.fn(() => Promise.reject(boom))
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    await expect(api.confirmCardPayment('pi_secret')).rejects.toBe(boom)
    expect(api.error.value).toBe('network down')
    expect(api.loading.value).toBe(false)
  })

  it('captures a synchronous throw and a non-Error rejection', async () => {
    const confirmCardPayment = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('bad arguments')
      })
      .mockImplementationOnce(() => Promise.reject('offline'))
    const { api } = await mountWith({ confirmCardPayment }, useConfirmCardPayment)

    await expect(api.confirmCardPayment()).rejects.toThrow('bad arguments')
    expect(api.error.value).toBe('bad arguments')
    await expect(api.confirmCardPayment('pi_secret')).rejects.toBe('offline')
    expect(api.error.value).toBe('offline')
  })

  it('rejects with VueStripeProviderError when Stripe.js is not loaded', async () => {
    // VueStripeProvider renders children only once Stripe is ready, so provide an empty context.
    let api: any
    mount(
      defineComponent({
        setup() {
          api = useConfirmCardPayment()
          return {}
        },
        render: () => h('div')
      }),
      {
        global: {
          provide: {
            [stripeInjectionKey as symbol]: {
              stripe: ref(null),
              loading: ref(false),
              error: ref(null)
            }
          }
        }
      }
    )

    await expect(api.confirmCardPayment('pi_secret')).rejects.toBeInstanceOf(VueStripeProviderError)
    expect(api.error.value).toBe('Stripe.js is not loaded yet')
    expect(api.loading.value).toBe(false)
  })

  it('throws VueStripeProviderError outside a VueStripeProvider', () => {
    const Comp = defineComponent({
      setup() {
        useConfirmCardPayment()
        return {}
      },
      render: () => h('div')
    })
    expect(() => mount(Comp)).toThrow(VueStripeProviderError)
    expect(() => mount(Comp)).toThrow(
      'useConfirmCardPayment must be called within a VueStripeProvider component'
    )
  })

  it('exposes loading and error as readonly refs', async () => {
    const { api } = await mountWith({}, useConfirmCardPayment)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.loading.value = true
    api.error.value = 'x'
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
    warn.mockRestore()
  })
})
