import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue-demi'
import { useCreatePaymentMethod } from '../../src/composables/useCreatePaymentMethod'
import { useHandleNextAction } from '../../src/composables/useHandleNextAction'
import { usePaymentIntent } from '../../src/composables/usePaymentIntent'
import { useSetupIntent } from '../../src/composables/useSetupIntent'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import { flushPromises, makeMockStripe } from '../setup'

// Mount Provider > Elements > <component using `useComposable`> with a stripe
// instance that includes the given method mocks; returns the composable's value.
async function mountWith(stripeMethods: Record<string, unknown>, useComposable: () => unknown) {
  const stripe = { ...makeMockStripe(), ...stripeMethods }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  let api: any
  const Comp = defineComponent({
    setup() { api = useComposable(); return {} },
    render: () => h('div')
  })
  mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () => h(VueStripeElements, { clientSecret: 'pi_test_secret_123' }, { default: () => h(Comp) })
    }
  })
  await flushPromises()
  return { api: () => api, stripe }
}

describe('useCreatePaymentMethod', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside a provider', () => {
    expect(() => mount(defineComponent({ setup() { useCreatePaymentMethod(); return {} }, render: () => h('div') })))
      .toThrow('useCreatePaymentMethod must be called within a VueStripeProvider component')
  })

  it('calls stripe.createPaymentMethod, injecting the elements instance', async () => {
    const createPaymentMethod = vi.fn(() => Promise.resolve({ paymentMethod: { id: 'pm_123' } }))
    const { api } = await mountWith({ createPaymentMethod }, () => useCreatePaymentMethod())

    const result = await api().createPaymentMethod()
    expect(createPaymentMethod).toHaveBeenCalledTimes(1)
    expect(createPaymentMethod.mock.calls[0][0]).toHaveProperty('elements')
    expect(result.paymentMethod.id).toBe('pm_123')
    expect(api().error.value).toBe(null)
  })

  it('surfaces a Stripe error on the error ref', async () => {
    const createPaymentMethod = vi.fn(() => Promise.resolve({ error: { message: 'card declined' } }))
    const { api } = await mountWith({ createPaymentMethod }, () => useCreatePaymentMethod())

    const result = await api().createPaymentMethod({ type: 'card', card: {} })
    expect(result.error.message).toBe('card declined')
    expect(api().error.value).toBe('card declined')
  })
})

describe('useHandleNextAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls stripe.handleNextAction with the client secret', async () => {
    const handleNextAction = vi.fn(() => Promise.resolve({ paymentIntent: { status: 'succeeded' } }))
    const { api } = await mountWith({ handleNextAction }, () => useHandleNextAction())

    const result = await api().handleNextAction({ clientSecret: 'pi_test_secret_123' })
    expect(handleNextAction).toHaveBeenCalledWith({ clientSecret: 'pi_test_secret_123' })
    expect(result.paymentIntent.status).toBe('succeeded')
  })
})

describe('usePaymentIntent.retrievePaymentIntent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retrieves a PaymentIntent by client secret', async () => {
    const retrievePaymentIntent = vi.fn(() => Promise.resolve({ paymentIntent: { id: 'pi_1', status: 'requires_payment_method' } }))
    const { api } = await mountWith({ retrievePaymentIntent }, () => usePaymentIntent())

    const result = await api().retrievePaymentIntent('pi_test_secret_123')
    expect(retrievePaymentIntent).toHaveBeenCalledWith('pi_test_secret_123')
    expect(result.paymentIntent.id).toBe('pi_1')
  })
})

describe('useSetupIntent.retrieveSetupIntent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retrieves a SetupIntent by client secret', async () => {
    const retrieveSetupIntent = vi.fn(() => Promise.resolve({ setupIntent: { id: 'seti_1', status: 'requires_confirmation' } }))
    const { api } = await mountWith({ retrieveSetupIntent }, () => useSetupIntent())

    const result = await api().retrieveSetupIntent('seti_test_secret_123')
    expect(retrieveSetupIntent).toHaveBeenCalledWith('seti_test_secret_123')
    expect(result.setupIntent.id).toBe('seti_1')
  })
})
