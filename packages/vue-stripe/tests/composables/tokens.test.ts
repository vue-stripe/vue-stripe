import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue-demi'
import {
  useCreateToken,
  useCreateConfirmationToken,
  useHandleCardAction,
  useVerifyMicrodepositsForPayment,
  useVerifyMicrodepositsForSetup,
  useRadarSession,
  useEphemeralKeyNonce
} from '../../src'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import { VueStripeElementsError, VueStripeProviderError } from '../../src/utils/errors'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockElements, makeMockStripe } from '../setup'

// Mount Provider [> Elements] > <component calling `useComposable`> on a stripe mock
// extended with `stripeMethods`; returns the composable's value and the mocks.
async function mountWith(
  useComposable: () => unknown,
  stripeMethods: Record<string, unknown> = {},
  { withElements = false } = {}
) {
  const elements = makeMockElements()
  const stripe = { ...makeMockStripe(), elements: vi.fn(() => elements), ...stripeMethods }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
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
    slots: {
      default: () =>
        withElements
          ? h(VueStripeElements, { clientSecret: 'pi_test_secret_123' }, { default: () => h(Comp) })
          : h(Comp)
    }
  })
  await flushPromises()
  return { api, stripe, elements }
}

const outsideProvider = (useComposable: () => unknown) =>
  defineComponent({
    setup() {
      useComposable()
      return {}
    },
    render: () => h('div')
  })

// [composable name, composable, Stripe method, call arguments, Stripe's success result]
const METHOD_COMPOSABLES: [string, () => unknown, string, unknown[], object][] = [
  [
    'useCreateToken',
    useCreateToken,
    'createToken',
    ['pii', { personal_id_number: '000000000' }],
    { token: { id: 'tok_123' } }
  ],
  [
    'useHandleCardAction',
    useHandleCardAction,
    'handleCardAction',
    ['pi_123_secret_456'],
    { paymentIntent: { id: 'pi_123', status: 'requires_confirmation' } }
  ],
  [
    'useVerifyMicrodepositsForPayment',
    useVerifyMicrodepositsForPayment,
    'verifyMicrodepositsForPayment',
    ['pi_123_secret_456', { amounts: [32, 45] }],
    { paymentIntent: { id: 'pi_123', status: 'processing' } }
  ],
  [
    'useVerifyMicrodepositsForSetup',
    useVerifyMicrodepositsForSetup,
    'verifyMicrodepositsForSetup',
    ['seti_123_secret_456', { descriptor_code: 'SM11AA' }],
    { setupIntent: { id: 'seti_123', status: 'succeeded' } }
  ],
  ['useRadarSession', useRadarSession, 'createRadarSession', [], { radarSession: { id: 'rse_1' } }],
  [
    'useEphemeralKeyNonce',
    useEphemeralKeyNonce,
    'createEphemeralKeyNonce',
    [{ issuingCard: 'ic_123' }],
    { nonce: 'ephkn_pub_123' }
  ]
]

describe.each(METHOD_COMPOSABLES)('%s', (composableName, useComposable, method, args, success) => {
  beforeEach(() => vi.clearAllMocks())

  it(`returns { ${method}, loading, error }`, async () => {
    const { api } = await mountWith(useComposable)
    expect(Object.keys(api).sort()).toEqual([method, 'error', 'loading'].sort())
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
  })

  it(`forwards its arguments to stripe.${method} and returns the result untouched`, async () => {
    const stripeMethod = vi.fn(() => Promise.resolve(success))
    const { api, stripe } = await mountWith(useComposable, { [method]: stripeMethod })

    await expect(api[method](...args)).resolves.toBe(success)
    expect(stripeMethod).toHaveBeenCalledWith(...args)
    expect(stripeMethod.mock.instances[0]).toBe(stripe)
    expect(api.error.value).toBe(null)
  })

  it('is loading while the call is in flight', async () => {
    let resolve!: (value: object) => void
    const stripeMethod = vi.fn(() => new Promise((res) => (resolve = res)))
    const { api } = await mountWith(useComposable, { [method]: stripeMethod })

    const call = api[method](...args)
    expect(api.loading.value).toBe(true)
    resolve(success)
    await call
    expect(api.loading.value).toBe(false)
  })

  it('records a Stripe { error } result and a thrown error', async () => {
    const declined = { error: { type: 'invalid_request_error', message: 'No such object' } }
    const boom = new Error('network down')
    const stripeMethod = vi.fn().mockResolvedValueOnce(declined).mockRejectedValueOnce(boom)
    const { api } = await mountWith(useComposable, { [method]: stripeMethod })

    await expect(api[method](...args)).resolves.toBe(declined)
    expect(api.error.value).toBe('No such object')
    await expect(api[method](...args)).rejects.toBe(boom)
    expect(api.error.value).toBe('network down')
    expect(api.loading.value).toBe(false)
  })

  it('throws VueStripeProviderError naming itself outside a VueStripeProvider', () => {
    const Comp = outsideProvider(useComposable)
    expect(() => mount(Comp)).toThrow(VueStripeProviderError)
    expect(() => mount(Comp)).toThrow(
      `${composableName} must be called within a VueStripeProvider component`
    )
  })
})

describe('useCreateConfirmationToken', () => {
  beforeEach(() => vi.clearAllMocks())

  const success = { confirmationToken: { id: 'ctoken_123' } }
  const createConfirmationToken = () => vi.fn(() => Promise.resolve(success))

  it('returns { createConfirmationToken, loading, error }', async () => {
    const { api } = await mountWith(useCreateConfirmationToken, {}, { withElements: true })
    expect(Object.keys(api).sort()).toEqual(['createConfirmationToken', 'error', 'loading'])
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
  })

  it('uses the injected Elements instance and submits it first', async () => {
    const create = createConfirmationToken()
    const { api, elements } = await mountWith(
      useCreateConfirmationToken,
      { createConfirmationToken: create },
      { withElements: true }
    )

    const params = { return_url: 'https://example.com/complete' }
    await expect(api.createConfirmationToken({ params })).resolves.toBe(success)

    expect(elements.submit).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({ elements, params })
    expect(elements.submit.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0]!
    )
    expect(api.error.value).toBe(null)
  })

  it('can be called with no options at all', async () => {
    const create = createConfirmationToken()
    const { api, elements } = await mountWith(
      useCreateConfirmationToken,
      { createConfirmationToken: create },
      { withElements: true }
    )

    await api.createConfirmationToken()
    expect(create).toHaveBeenCalledWith({ elements })
  })

  it('prefers an explicit elements option over the injected one', async () => {
    const create = createConfirmationToken()
    const { api, elements } = await mountWith(
      useCreateConfirmationToken,
      { createConfirmationToken: create },
      { withElements: true }
    )
    const other = makeMockElements()

    await api.createConfirmationToken({ elements: other })
    expect(other.submit).toHaveBeenCalledTimes(1)
    expect(elements.submit).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledWith({ elements: other })
  })

  it('works under the provider alone when elements is passed', async () => {
    const create = createConfirmationToken()
    const { api } = await mountWith(useCreateConfirmationToken, {
      createConfirmationToken: create
    })
    const elements = makeMockElements()

    await expect(api.createConfirmationToken({ elements })).resolves.toBe(success)
    expect(create).toHaveBeenCalledWith({ elements })
  })

  it('skipSubmit: true skips elements.submit() and is not passed to Stripe', async () => {
    const create = createConfirmationToken()
    const { api, elements } = await mountWith(
      useCreateConfirmationToken,
      { createConfirmationToken: create },
      { withElements: true }
    )

    await api.createConfirmationToken({ skipSubmit: true })
    expect(elements.submit).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledWith({ elements })
  })

  it('returns the submit error without creating a token', async () => {
    const create = createConfirmationToken()
    const { api, elements } = await mountWith(
      useCreateConfirmationToken,
      { createConfirmationToken: create },
      { withElements: true }
    )
    const submitError = { type: 'validation_error', message: 'Your card number is incomplete.' }
    elements.submit.mockResolvedValueOnce({ error: submitError })

    await expect(api.createConfirmationToken()).resolves.toEqual({ error: submitError })
    expect(create).not.toHaveBeenCalled()
    expect(api.error.value).toBe('Your card number is incomplete.')
    expect(api.loading.value).toBe(false)
  })

  it('records a Stripe { error } result and is loading while in flight', async () => {
    let resolve!: (value: object) => void
    const create = vi.fn(() => new Promise((res) => (resolve = res)))
    const { api } = await mountWith(
      useCreateConfirmationToken,
      { createConfirmationToken: create },
      { withElements: true }
    )

    const call = api.createConfirmationToken()
    expect(api.loading.value).toBe(true)
    await flushPromises()
    resolve({ error: { type: 'invalid_request_error', message: 'Invalid params' } })
    await call
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe('Invalid params')
  })

  it('rejects with VueStripeElementsError when there is no Elements instance', async () => {
    const create = createConfirmationToken()
    const { api } = await mountWith(useCreateConfirmationToken, {
      createConfirmationToken: create
    })

    await expect(api.createConfirmationToken()).rejects.toBeInstanceOf(VueStripeElementsError)
    expect(api.error.value).toMatch(/useCreateConfirmationToken needs an Elements instance/)
    expect(create).not.toHaveBeenCalled()
  })

  it('waits for a load in progress and rejects with VueStripeProviderError when it fails', async () => {
    let api: any
    const loading = ref(true)
    mount(
      defineComponent({
        setup() {
          api = useCreateConfirmationToken()
          return {}
        },
        render: () => h('div')
      }),
      {
        global: {
          provide: {
            [stripeInjectionKey as symbol]: {
              stripe: ref(null),
              loading,
              error: ref(null)
            }
          }
        }
      }
    )

    const call = api.createConfirmationToken()
    expect(api.loading.value).toBe(true)
    loading.value = false
    await expect(call).rejects.toBeInstanceOf(VueStripeProviderError)
    expect(api.error.value).toBe('Stripe.js is not loaded yet')
  })

  it('throws VueStripeProviderError outside a VueStripeProvider', () => {
    expect(() => mount(outsideProvider(useCreateConfirmationToken))).toThrow(
      'useCreateConfirmationToken must be called within a VueStripeProvider component'
    )
  })
})
