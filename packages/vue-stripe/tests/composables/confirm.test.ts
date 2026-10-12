import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue-demi'
import * as confirmComposables from '../../src/composables/confirm'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { flushPromises, makeMockStripe } from '../setup'
import { STRIPE_CONFIRMERS, composableName } from '../stripe-confirmers'

const composables = confirmComposables as unknown as Record<string, () => Record<string, any>>

// Mount Provider > <component calling `useComposable`>; returns its value and the stripe mock.
async function mountWith(useComposable: () => Record<string, any>) {
  const stripe = makeMockStripe()
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  let api!: Record<string, any>
  mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () =>
        h(
          defineComponent({
            setup() {
              api = useComposable()
              return {}
            },
            render: () => h('div')
          })
        )
    }
  })
  await flushPromises()
  return { api, stripe }
}

describe('useConfirm<Method>Payment / Setup composables', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads the confirmers from the installed Stripe.js types', () => {
    // Sanity check on the .d.ts parse: Stripe.js 10 declares 45, including these.
    expect(STRIPE_CONFIRMERS.length).toBeGreaterThanOrEqual(45)
    expect(STRIPE_CONFIRMERS).toEqual(
      expect.arrayContaining(['confirmCardPayment', 'confirmSepaDebitSetup', 'confirmBlikSetup'])
    )
    expect(STRIPE_CONFIRMERS).not.toContain('confirmPayment')
    expect(STRIPE_CONFIRMERS).not.toContain('confirmSetup')
  })

  it('exports one composable per Stripe.js confirmer, and nothing else', () => {
    expect(Object.keys(composables).sort()).toEqual(STRIPE_CONFIRMERS.map(composableName).sort())
  })

  it.each(STRIPE_CONFIRMERS.map((m) => [composableName(m), m]))(
    '%s forwards its arguments to stripe.%s',
    async (name, method) => {
      const useComposable = composables[name as string]
      expect(typeof useComposable).toBe('function')

      const { api, stripe } = await mountWith(useComposable!)
      const data = { payment_method: 'pm_123' }
      const options = { handleActions: false }

      const result = await api[method as string]('secret_123', data, options)

      expect(stripe[method as string]).toHaveBeenCalledTimes(1)
      expect(stripe[method as string]).toHaveBeenCalledWith('secret_123', data, options)
      expect(result).toHaveProperty(
        (method as string).endsWith('Setup') ? 'setupIntent' : 'paymentIntent'
      )
      expect(api.loading.value).toBe(false)
      expect(api.error.value).toBe(null)
    }
  )
})
