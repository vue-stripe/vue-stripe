import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { usePaymentIntent } from '../../src/composables/usePaymentIntent'
import { useSetupIntent } from '../../src/composables/useSetupIntent'
import { useCreatePaymentMethod } from '../../src/composables/useCreatePaymentMethod'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { makeMockStripe } from '../setup'

// These composables work with or without VueStripeElements (retrieve*, createPaymentMethod
// with raw card data, confirm with an explicit `elements`), so using them under
// VueStripeProvider alone must not make Vue warn about a missing injection.
describe.each([
  ['usePaymentIntent', () => usePaymentIntent()],
  ['useSetupIntent', () => useSetupIntent()],
  ['useCreatePaymentMethod', () => useCreatePaymentMethod()]
])('%s outside VueStripeElements', (_name, use) => {
  afterEach(() => vi.restoreAllMocks())

  it('does not warn about a missing Elements injection', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(
      defineComponent({
        setup() {
          provide(stripeInjectionKey, {
            stripe: shallowRef(makeMockStripe() as never),
            loading: ref(false),
            error: ref(null)
          })
          return () =>
            h(
              defineComponent({
                setup() {
                  use()
                  return () => h('div')
                }
              })
            )
        }
      })
    )
    const injectionWarnings = warn.mock.calls.filter((args) =>
      String(args[0]).includes('injection')
    )
    expect(injectionWarnings).toEqual([])
  })
})
