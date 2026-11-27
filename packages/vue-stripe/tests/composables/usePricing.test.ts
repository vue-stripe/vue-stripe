import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue-demi'
import type { Pricing, Stripe } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js/pure'
import { usePricing, VueStripeProvider } from '../../src'
import { createVueStripe } from '../../src/plugin'
import { flushPromises, makeMockStripe } from '../setup'

const mockLoadStripe = vi.mocked(loadStripe)

function withPricing(initializePricing: Stripe['initializePricing']) {
  let api!: ReturnType<typeof usePricing>
  mockLoadStripe.mockResolvedValueOnce({ ...makeMockStripe(), initializePricing })
  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_pricing' },
    slots: {
      default: () =>
        h(
          defineComponent({
            setup() {
              api = usePricing()
              return () => h('div')
            }
          })
        )
    }
  })
  return { wrapper, api: () => api }
}

describe('usePricing', () => {
  it('requires a provider or plugin', () => {
    expect(() =>
      mount(
        defineComponent({
          setup: () => {
            usePricing()
            return () => h('div')
          }
        })
      )
    ).toThrow('usePricing must be called within a VueStripeProvider component')
  })

  it('initializes explicitly and preserves the SDK, nullable amounts and currency units unchanged', async () => {
    const prices = {
      price_jpy: {
        currency: 'jpy',
        unitAmount: { amount: '¥0', minorUnitsAmount: 0 },
        unitAmountDecimal: null,
        minorUnitsAmountDivisor: 1
      },
      price_kwd: {
        currency: 'kwd',
        unitAmount: null,
        unitAmountDecimal: { amount: 'KWD 1.2345', minorUnitsAmount: 1234.5 },
        minorUnitsAmountDivisor: 1000
      }
    }
    const selected = ref('jpy')
    const sdk: Pricing = {
      getAvailableCurrencies: async () => [{ currency: 'jpy' }, { currency: 'kwd' }],
      getSelectedCurrency: async () => ({ currency: selected.value }),
      setSelectedCurrency: async (currency) => {
        selected.value = currency
      },
      resolvePrice: async (price) => prices[price as keyof typeof prices],
      createPricingToken: async () => ({ id: 'prctok_123' }),
      on() {
        return this
      },
      once() {
        return this
      },
      off() {
        return this
      }
    }
    const initializePricing = vi.fn(async (options) => {
      expect(options).toEqual({ pricingPolicy: 'prcpol_123', detectedCurrencyOverride: 'jpy' })
      return sdk
    })
    const context = withPricing(initializePricing)
    await flushPromises()
    const api = context.api()
    expect(api.pricing.value).toBeNull()
    expect(api.loading.value).toBe(false)
    expect(initializePricing).not.toHaveBeenCalled()

    const pending = api.initializePricing({
      pricingPolicy: 'prcpol_123',
      detectedCurrencyOverride: 'jpy'
    })
    expect(api.loading.value).toBe(true)
    expect(await pending).toBe(sdk)
    expect(api.pricing.value).toBe(sdk)
    expect(api.error.value).toBeNull()
    expect(api.loading.value).toBe(false)
    expect(await api.pricing.value!.resolvePrice('price_jpy')).toEqual(prices.price_jpy)
    await api.pricing.value!.setSelectedCurrency('kwd')
    expect(await api.pricing.value!.getSelectedCurrency()).toEqual({ currency: 'kwd' })
    expect(await api.pricing.value!.resolvePrice('price_kwd')).toEqual(prices.price_kwd)
    context.wrapper.unmount()
  })

  it('shares an overlapping initialization, then allows reinitialization with new options', async () => {
    let resolve!: (sdk: Pricing) => void
    const first = {} as Pricing
    const second = {} as Pricing
    const initializePricing = vi
      .fn<Stripe['initializePricing']>()
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      .mockResolvedValueOnce(second)
    const context = withPricing(initializePricing)
    await flushPromises()
    const api = context.api()
    const pending = api.initializePricing({ pricingPolicy: 'prcpol_first' })
    expect(api.initializePricing({ pricingPolicy: 'prcpol_ignored' })).toBe(pending)
    await flushPromises()
    resolve(first)
    expect(await pending).toBe(first)
    const next = api.initializePricing({ pricingPolicy: 'prcpol_second' })
    expect(api.pricing.value).toBeNull()
    expect(await next).toBe(second)
    expect(api.pricing.value).toBe(second)
    expect(initializePricing.mock.calls).toEqual([
      [{ pricingPolicy: 'prcpol_first' }],
      [{ pricingPolicy: 'prcpol_second' }]
    ])
    context.wrapper.unmount()
  })

  it.each([new Error('Beta access required'), 'unknown failure'])(
    'reports initialization failure and allows retry (%s)',
    async (failure) => {
      const sdk = {} as Pricing
      const initializePricing = vi
        .fn<Stripe['initializePricing']>()
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(sdk)
      const context = withPricing(initializePricing)
      await flushPromises()
      const api = context.api()
      await expect(api.initializePricing({ pricingPolicy: 'prcpol_123' })).resolves.toBeNull()
      expect(api.error.value).toBe(
        failure instanceof Error ? 'Beta access required' : 'Failed to initialize pricing'
      )
      expect(api.pricing.value).toBeNull()
      expect(api.loading.value).toBe(false)
      const retry = api.initializePricing({ pricingPolicy: 'prcpol_123' })
      expect(api.error.value).toBeNull()
      expect(await retry).toBe(sdk)
      context.wrapper.unmount()
    }
  )

  it.each([true, false])(
    'waits for the plugin load before initialization (load succeeds: %s)',
    async (succeeds) => {
      let resolve!: (stripe: unknown) => void
      mockLoadStripe.mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      const sdk = {} as Pricing
      const initializePricing = vi.fn(async () => sdk)
      let api!: ReturnType<typeof usePricing>
      const wrapper = mount(
        defineComponent({
          setup() {
            api = usePricing()
            return () => h('div')
          }
        }),
        { global: { plugins: [createVueStripe({ publishableKey: 'pk_test_pricing' })] } }
      )
      const pending = api.initializePricing({ pricingPolicy: 'prcpol_123' })
      expect(api.loading.value).toBe(true)
      expect(initializePricing).not.toHaveBeenCalled()
      resolve(succeeds ? { ...makeMockStripe(), initializePricing } : null)
      await expect(pending).resolves.toBe(succeeds ? sdk : null)
      expect(api.pricing.value).toBe(succeeds ? sdk : null)
      expect(api.error.value).toBe(succeeds ? null : 'Stripe not initialized')
      expect(api.loading.value).toBe(false)
      wrapper.unmount()
    }
  )
})
