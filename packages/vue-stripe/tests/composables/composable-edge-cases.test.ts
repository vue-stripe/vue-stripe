import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { usePaymentIntent } from '../../src/composables/usePaymentIntent'
import { useSetupIntent } from '../../src/composables/useSetupIntent'
import { useCreatePaymentMethod } from '../../src/composables/useCreatePaymentMethod'
import { useHandleNextAction } from '../../src/composables/useHandleNextAction'
import { useStripeElements } from '../../src/composables/useStripeElements'
import { useStripe } from '../../src/composables/useStripe'
import { stripeElementsInjectionKey, stripeInjectionKey } from '../../src/utils/injection-keys'
import { makeMockElements, makeMockStripe } from '../setup'

// Run `use()` under hand-provided Stripe / Elements contexts (no provider components).
function withContext<T>(
  use: () => T,
  { stripe = makeMockStripe() as unknown, elements = makeMockElements() as unknown } = {}
) {
  let api!: T
  mount(
    defineComponent({
      setup() {
        provide(stripeInjectionKey, {
          stripe: shallowRef(stripe as never),
          loading: ref(false),
          error: ref(null)
        })
        provide(stripeElementsInjectionKey, {
          elements: shallowRef(elements as never),
          loading: ref(false),
          error: ref(null)
        })
        return () =>
          h(
            defineComponent({
              setup() {
                api = use()
                return () => h('div')
              }
            })
          )
      }
    })
  )
  return api
}

const intents = [
  {
    name: 'usePaymentIntent',
    use: () => {
      const api = usePaymentIntent()
      return {
        confirm: api.confirmPayment,
        retrieve: api.retrievePaymentIntent,
        error: api.error,
        loading: api.loading
      }
    },
    confirmMethod: 'confirmPayment',
    retrieveMethod: 'retrievePaymentIntent'
  },
  {
    name: 'useSetupIntent',
    use: () => {
      const api = useSetupIntent()
      return {
        confirm: api.confirmSetup,
        retrieve: api.retrieveSetupIntent,
        error: api.error,
        loading: api.loading
      }
    },
    confirmMethod: 'confirmSetup',
    retrieveMethod: 'retrieveSetupIntent'
  }
] as const

describe.each(intents)('$name edge cases', ({ use, confirmMethod, retrieveMethod }) => {
  it('returns an error result when Stripe is not loaded yet', async () => {
    const api = withContext(use, { stripe: null })
    await expect(api.confirm({ clientSecret: 'x_secret' })).resolves.toEqual({
      error: { message: 'Stripe not initialized' }
    })
    await expect(api.retrieve('x_secret')).resolves.toEqual({
      error: { message: 'Stripe not initialized' }
    })
    expect(api.error.value).toBe('Stripe not initialized')
  })

  it('returns the elements.submit() error without confirming', async () => {
    const stripe = makeMockStripe() as Record<string, ReturnType<typeof vi.fn>>
    const elements = makeMockElements()
    elements.submit.mockResolvedValueOnce({ error: { message: 'Card number incomplete' } })
    const api = withContext(use, { stripe, elements })
    const result = await api.confirm({ clientSecret: 'x_secret' })
    expect(result).toEqual({ error: { message: 'Card number incomplete' } })
    expect(stripe[confirmMethod]).not.toHaveBeenCalled()
    expect(api.error.value).toBe('Card number incomplete')
  })

  it("passes redirect: 'always' with the confirm params", async () => {
    const stripe = makeMockStripe() as Record<string, ReturnType<typeof vi.fn>>
    const api = withContext(use, { stripe })
    await api.confirm({
      clientSecret: 'x_secret',
      redirect: 'always',
      confirmParams: { return_url: 'https://e.x/done' }
    })
    expect(stripe[confirmMethod]).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect: 'always',
        confirmParams: { return_url: 'https://e.x/done' }
      })
    )
  })

  it('records a Stripe error result and turns a throw into an error result', async () => {
    const stripe = makeMockStripe() as Record<string, ReturnType<typeof vi.fn>>
    stripe[confirmMethod]?.mockResolvedValueOnce({ error: { message: 'Your card was declined.' } })
    const api = withContext(use, { stripe })
    await api.confirm({ clientSecret: 'x_secret', skipSubmit: true })
    expect(api.error.value).toBe('Your card was declined.')

    stripe[confirmMethod]?.mockRejectedValueOnce(new Error('Network down'))
    await expect(api.confirm({ clientSecret: 'x_secret', skipSubmit: true })).resolves.toEqual({
      error: { message: 'Network down' }
    })
    expect(api.loading.value).toBe(false)
  })

  it('turns a retrieve throw into an error result', async () => {
    const stripe = {
      ...makeMockStripe(),
      [retrieveMethod]: vi.fn(() => Promise.reject(new Error('Timeout')))
    }
    const api = withContext(use, { stripe })
    await expect(api.retrieve('x_secret')).resolves.toEqual({ error: { message: 'Timeout' } })
    expect(api.error.value).toBe('Timeout')
  })
})

describe('other composable edge cases', () => {
  it('useCreatePaymentMethod: not loaded, and a throw becomes an error result', async () => {
    const notLoaded = withContext(() => useCreatePaymentMethod(), { stripe: null })
    await expect(notLoaded.createPaymentMethod()).resolves.toEqual({
      error: { message: 'Stripe not initialized' }
    })

    const stripe = {
      ...makeMockStripe(),
      createPaymentMethod: vi.fn(() => Promise.reject(new Error('Boom')))
    }
    const api = withContext(() => useCreatePaymentMethod(), { stripe })
    await expect(api.createPaymentMethod({ type: 'card' })).resolves.toEqual({
      error: { message: 'Boom' }
    })
    expect(api.error.value).toBe('Boom')
  })

  it('useHandleNextAction: returns an error result when Stripe is not loaded', async () => {
    const api = withContext(() => useHandleNextAction(), { stripe: null })
    await expect(api.handleNextAction({ clientSecret: 'x' })).resolves.toEqual({
      error: { message: 'Stripe not initialized' }
    })
  })

  it('useStripeElements: submit() forwards, and errors before Elements exists', async () => {
    const elements = makeMockElements()
    const api = withContext(() => useStripeElements(), { elements })
    await api.submit()
    expect(elements.submit).toHaveBeenCalled()
    const empty = withContext(() => useStripeElements(), { elements: null })
    await expect(empty.submit()).resolves.toEqual({
      error: { message: 'Elements not initialized' }
    })
  })

  it('useStripe: initialize() is a no-op kept for API compatibility', async () => {
    const api = withContext(() => useStripe())
    await expect(api.initialize()).resolves.toBeUndefined()
  })
})
