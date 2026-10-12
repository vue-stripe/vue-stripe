import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { useFinancialConnections } from '../../src/composables/useFinancialConnections'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { makeMockStripe } from '../setup'

// Run useFinancialConnections() under a hand-provided Stripe context with the given method mocks.
function withStripe(stripeMethods: Record<string, unknown> | null) {
  const stripe = stripeMethods ? { ...makeMockStripe(), ...stripeMethods } : null
  let api!: ReturnType<typeof useFinancialConnections>
  mount(
    defineComponent({
      setup() {
        provide(stripeInjectionKey, {
          stripe: shallowRef(stripe as never),
          loading: ref(false),
          error: ref(null)
        })
        return () =>
          h(
            defineComponent({
              setup() {
                api = useFinancialConnections()
                return () => h('div')
              }
            })
          )
      }
    })
  )
  return api
}

const consent = { consent: 'fcconsent_123', collectedAt: 1760000000 }
const usBank = {
  payment_method_type: 'us_bank_account' as const,
  payment_method_data: { billing_details: { name: 'Jenny Rosen' } }
}

// Each wrapped method: how to call it, the Stripe method it forwards to, and a success result.
const methods = [
  {
    name: 'collectFinancialConnectionsAccounts',
    call: (api: ReturnType<typeof useFinancialConnections>) =>
      api.collectFinancialConnectionsAccounts({
        clientSecret: 'fcsess_secret_123',
        preCollectedConsent: consent
      }),
    expectedArgs: { clientSecret: 'fcsess_secret_123', preCollectedConsent: consent },
    fallback: 'Failed to collect financial accounts',
    success: { financialConnectionsSession: { id: 'fcsess_123', accounts: [] } }
  },
  {
    name: 'collectBankAccountForPayment',
    call: (api: ReturnType<typeof useFinancialConnections>) =>
      api.collectBankAccountForPayment({ clientSecret: 'pi_secret_123', params: usBank }),
    expectedArgs: { clientSecret: 'pi_secret_123', params: usBank },
    fallback: 'Failed to collect bank account',
    success: { paymentIntent: { id: 'pi_123', status: 'requires_confirmation' } }
  },
  {
    name: 'collectBankAccountForSetup',
    call: (api: ReturnType<typeof useFinancialConnections>) =>
      api.collectBankAccountForSetup({ clientSecret: 'seti_secret_123', params: usBank }),
    expectedArgs: { clientSecret: 'seti_secret_123', params: usBank },
    fallback: 'Failed to collect bank account',
    success: { setupIntent: { id: 'seti_123', status: 'requires_confirmation' } }
  },
  {
    name: 'collectBankAccountToken',
    call: (api: ReturnType<typeof useFinancialConnections>) =>
      api.collectBankAccountToken({
        clientSecret: 'fcsess_secret_123',
        preCollectedConsent: consent
      }),
    expectedArgs: { clientSecret: 'fcsess_secret_123', preCollectedConsent: consent },
    fallback: 'Failed to collect bank account token',
    success: {
      financialConnectionsSession: { id: 'fcsess_123', accounts: [] },
      token: { id: 'btok_123' }
    }
  }
] as const

describe('useFinancialConnections', () => {
  it('throws when used outside a provider', () => {
    expect(() =>
      mount(
        defineComponent({
          setup() {
            useFinancialConnections()
            return {}
          },
          render: () => h('div')
        })
      )
    ).toThrow('useFinancialConnections must be called within a VueStripeProvider component')
  })

  describe.each(methods)('$name', ({ name, call, expectedArgs, fallback, success }) => {
    it('forwards the options to Stripe and resolves to its result', async () => {
      const stripeMethod = vi.fn(() => Promise.resolve(success))
      const api = withStripe({ [name]: stripeMethod })

      const result = await call(api)
      expect(stripeMethod).toHaveBeenCalledWith(expectedArgs)
      expect(result).toEqual(success)
      expect(api.error.value).toBe(null)
      expect(api.loading.value).toBe(false)
    })

    it('is loading while the Stripe modal is open', async () => {
      let resolve!: (value: unknown) => void
      const stripeMethod = vi.fn(() => new Promise((r) => (resolve = r)))
      const api = withStripe({ [name]: stripeMethod })

      const pending = call(api)
      expect(api.loading.value).toBe(true)
      resolve(success)
      await pending
      expect(api.loading.value).toBe(false)
    })

    it('surfaces a Stripe error result on the error ref', async () => {
      const stripeMethod = vi.fn(() =>
        Promise.resolve({ error: { type: 'invalid_request_error', message: 'No such session' } })
      )
      const api = withStripe({ [name]: stripeMethod })

      const result = await call(api)
      expect(result.error?.message).toBe('No such session')
      expect(api.error.value).toBe('No such session')
      expect(api.loading.value).toBe(false)
    })

    it('falls back to a generic message when the Stripe error has none', async () => {
      const stripeMethod = vi.fn(() => Promise.resolve({ error: { type: 'api_error' } }))
      const api = withStripe({ [name]: stripeMethod })

      await call(api)
      expect(api.error.value).toBe(fallback)
    })

    it('turns a thrown error into an error result', async () => {
      const stripeMethod = vi.fn(() => Promise.reject(new Error('Network down')))
      const api = withStripe({ [name]: stripeMethod })

      await expect(call(api)).resolves.toEqual({ error: { message: 'Network down' } })
      expect(api.error.value).toBe('Network down')
      expect(api.loading.value).toBe(false)
    })

    it('returns an error result when Stripe is not loaded', async () => {
      const api = withStripe(null)

      await expect(call(api)).resolves.toEqual({ error: { message: 'Stripe not initialized' } })
      expect(api.error.value).toBe('Stripe not initialized')
      expect(api.loading.value).toBe(false)
    })
  })

  it('clears a stale error on the next successful call', async () => {
    const collectFinancialConnectionsAccounts = vi
      .fn()
      .mockResolvedValueOnce({ error: { message: 'Cancelled' } })
      .mockResolvedValueOnce({ financialConnectionsSession: { id: 'fcsess_123', accounts: [] } })
    const api = withStripe({ collectFinancialConnectionsAccounts })

    await api.collectFinancialConnectionsAccounts({ clientSecret: 'fcsess_secret_123' })
    expect(api.error.value).toBe('Cancelled')
    await api.collectFinancialConnectionsAccounts({ clientSecret: 'fcsess_secret_123' })
    expect(api.error.value).toBe(null)
  })

  it('reports a non-Error throw with the generic message', async () => {
    const collectBankAccountToken = vi.fn(() => Promise.reject('boom'))
    const api = withStripe({ collectBankAccountToken })

    await expect(
      api.collectBankAccountToken({ clientSecret: 'fcsess_secret_123' })
    ).resolves.toEqual({ error: { message: 'Failed to collect bank account token' } })
  })
})
