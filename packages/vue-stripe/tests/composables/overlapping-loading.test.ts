import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef, type Ref } from 'vue-demi'
import { usePaymentIntent } from '../../src/composables/usePaymentIntent'
import { useSetupIntent } from '../../src/composables/useSetupIntent'
import { useFinancialConnections } from '../../src/composables/useFinancialConnections'
import { useCreatePaymentMethod } from '../../src/composables/useCreatePaymentMethod'
import { useHandleNextAction } from '../../src/composables/useHandleNextAction'
import { useIdentity } from '../../src/composables/useIdentity'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockStripe } from '../setup'

// #672: with two overlapping calls, `loading` stays true until the last one settles,
// as the method confirmers and useCreateToken already do.

type Api = Record<string, unknown> & { loading: Readonly<Ref<boolean>> }

/** Runs `use()` under a hand-provided Stripe context whose `method` returns deferred promises. */
function withDeferredStripe(method: string, use: () => Api) {
  const settles: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []
  const stripe = {
    ...makeMockStripe(),
    [method]: vi.fn(() => new Promise((resolve, reject) => settles.push({ resolve, reject })))
  }
  let api!: Api
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
                api = use()
                return () => h('div')
              }
            })
          )
      }
    })
  )
  return { api, settles }
}

const CASES: Array<{ name: string; method: string; use: () => Api; call: (api: Api) => unknown }> =
  [
    {
      name: 'usePaymentIntent().confirmPayment',
      method: 'confirmPayment',
      use: () => usePaymentIntent() as unknown as Api,
      call: (api) =>
        (api['confirmPayment'] as (o: unknown) => unknown)({ clientSecret: 'pi_1_secret_2' })
    },
    {
      name: 'usePaymentIntent().retrievePaymentIntent',
      method: 'retrievePaymentIntent',
      use: () => usePaymentIntent() as unknown as Api,
      call: (api) => (api['retrievePaymentIntent'] as (s: string) => unknown)('pi_1_secret_2')
    },
    {
      name: 'useSetupIntent().confirmSetup',
      method: 'confirmSetup',
      use: () => useSetupIntent() as unknown as Api,
      call: (api) =>
        (api['confirmSetup'] as (o: unknown) => unknown)({ clientSecret: 'seti_1_secret_2' })
    },
    {
      name: 'useSetupIntent().retrieveSetupIntent',
      method: 'retrieveSetupIntent',
      use: () => useSetupIntent() as unknown as Api,
      call: (api) => (api['retrieveSetupIntent'] as (s: string) => unknown)('seti_1_secret_2')
    },
    {
      name: 'useFinancialConnections().collectFinancialConnectionsAccounts',
      method: 'collectFinancialConnectionsAccounts',
      use: () => useFinancialConnections() as unknown as Api,
      call: (api) =>
        (api['collectFinancialConnectionsAccounts'] as (o: unknown) => unknown)({
          clientSecret: 'fcsess_secret_1'
        })
    },
    {
      name: 'useCreatePaymentMethod().createPaymentMethod',
      method: 'createPaymentMethod',
      use: () => useCreatePaymentMethod() as unknown as Api,
      call: (api) =>
        (api['createPaymentMethod'] as (o: unknown) => unknown)({
          type: 'card',
          card: { token: 'tok_visa' }
        })
    },
    {
      name: 'useHandleNextAction().handleNextAction',
      method: 'handleNextAction',
      use: () => useHandleNextAction() as unknown as Api,
      call: (api) =>
        (api['handleNextAction'] as (o: unknown) => unknown)({ clientSecret: 'pi_1_secret_2' })
    },
    {
      name: 'useIdentity().verifyIdentity',
      method: 'verifyIdentity',
      use: () => useIdentity() as unknown as Api,
      call: (api) => (api['verifyIdentity'] as (s: string) => unknown)('vs_1_secret_2')
    }
  ]

describe('composables keep loading true until the last overlapping call settles (#672)', () => {
  it.each(CASES)('$name', async ({ method, use, call }) => {
    const { api, settles } = withDeferredStripe(method, use)

    const first = call(api)
    const second = call(api)
    await flushPromises()
    expect(settles).toHaveLength(2)
    expect(api.loading.value).toBe(true)

    // The first call fails fast; the second is still pending.
    settles[0]!.reject(new Error('first failed'))
    await first
    expect(api.loading.value).toBe(true)

    settles[1]!.resolve({})
    await second
    expect(api.loading.value).toBe(false)
  })
})
