import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { useIdentity } from '../../src/composables/useIdentity'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { makeMockStripe } from '../setup'

// Run useIdentity() under a hand-provided Stripe context with the given method mocks.
function withStripe(stripeMethods: Record<string, unknown> | null) {
  const stripe = stripeMethods ? { ...makeMockStripe(), ...stripeMethods } : null
  let api!: ReturnType<typeof useIdentity>
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
                api = useIdentity()
                return () => h('div')
              }
            })
          )
      }
    })
  )
  return api
}

describe('useIdentity', () => {
  it('throws when used outside a provider', () => {
    expect(() =>
      mount(
        defineComponent({
          setup() {
            useIdentity()
            return {}
          },
          render: () => h('div')
        })
      )
    ).toThrow('useIdentity must be called within a VueStripeProvider component')
  })

  it('calls stripe.verifyIdentity with the client secret and resolves to its result', async () => {
    const success = { verificationSession: { id: 'vs_123', status: 'processing' } }
    const verifyIdentity = vi.fn(() => Promise.resolve(success))
    const api = withStripe({ verifyIdentity })

    const result = await api.verifyIdentity('vs_secret_123')
    expect(verifyIdentity).toHaveBeenCalledWith('vs_secret_123')
    expect(result).toEqual(success)
    expect(api.error.value).toBe(null)
    expect(api.loading.value).toBe(false)
  })

  it('treats the { error: null } Stripe.js resolves on submit as success', async () => {
    // Observed live: Stripe.js 10 resolves { error: null } (no verificationSession) on submit.
    const verifyIdentity = vi.fn(() => Promise.resolve({ error: null }))
    const api = withStripe({ verifyIdentity })

    const result = await api.verifyIdentity('vs_secret_123')
    expect(result.error).toBe(null)
    expect(api.error.value).toBe(null)
  })

  it('keeps the code of a cancel, which Stripe sends without a message', async () => {
    const cancelled = { error: { type: 'user_action', code: 'session_cancelled' } }
    const verifyIdentity = vi.fn(() => Promise.resolve(cancelled))
    const api = withStripe({ verifyIdentity })

    const result = await api.verifyIdentity('vs_secret_123')
    expect(result).toEqual(cancelled)
    expect(api.error.value).toBe('Failed to verify identity')
  })

  it('is loading while the Identity modal is open', async () => {
    let resolve!: (value: unknown) => void
    const verifyIdentity = vi.fn(() => new Promise((r) => (resolve = r)))
    const api = withStripe({ verifyIdentity })

    const pending = api.verifyIdentity('vs_secret_123')
    expect(api.loading.value).toBe(true)
    resolve({ verificationSession: { id: 'vs_123' } })
    await pending
    expect(api.loading.value).toBe(false)
  })

  it('surfaces a Stripe error result on the error ref', async () => {
    const verifyIdentity = vi.fn(() =>
      Promise.resolve({ error: { type: 'invalid_request_error', message: 'Session expired' } })
    )
    const api = withStripe({ verifyIdentity })

    const result = await api.verifyIdentity('vs_secret_123')
    expect(result.error?.message).toBe('Session expired')
    expect(api.error.value).toBe('Session expired')
    expect(api.loading.value).toBe(false)
  })

  it('falls back to a generic message when the Stripe error has none', async () => {
    const verifyIdentity = vi.fn(() => Promise.resolve({ error: { type: 'api_error' } }))
    const api = withStripe({ verifyIdentity })

    await api.verifyIdentity('vs_secret_123')
    expect(api.error.value).toBe('Failed to verify identity')
  })

  it('turns a thrown error into an error result', async () => {
    const verifyIdentity = vi.fn(() => Promise.reject(new Error('Network down')))
    const api = withStripe({ verifyIdentity })

    await expect(api.verifyIdentity('vs_secret_123')).resolves.toEqual({
      error: { message: 'Network down' }
    })
    expect(api.error.value).toBe('Network down')
    expect(api.loading.value).toBe(false)
  })

  it('reports a non-Error throw with the generic message', async () => {
    const verifyIdentity = vi.fn(() => Promise.reject('boom'))
    const api = withStripe({ verifyIdentity })

    await expect(api.verifyIdentity('vs_secret_123')).resolves.toEqual({
      error: { message: 'Failed to verify identity' }
    })
  })

  it('returns an error result when Stripe is not loaded', async () => {
    const api = withStripe(null)

    await expect(api.verifyIdentity('vs_secret_123')).resolves.toEqual({
      error: { message: 'Stripe not initialized' }
    })
    expect(api.error.value).toBe('Stripe not initialized')
  })

  it('clears a stale error on the next successful call', async () => {
    const verifyIdentity = vi
      .fn()
      .mockResolvedValueOnce({ error: { message: 'Cancelled' } })
      .mockResolvedValueOnce({ verificationSession: { id: 'vs_123' } })
    const api = withStripe({ verifyIdentity })

    await api.verifyIdentity('vs_secret_123')
    expect(api.error.value).toBe('Cancelled')
    await api.verifyIdentity('vs_secret_123')
    expect(api.error.value).toBe(null)
  })
})
