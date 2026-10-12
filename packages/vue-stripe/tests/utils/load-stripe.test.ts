import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// These tests run the REAL @stripe/stripe-js/pure loader (tests/setup.ts mocks it
// for everything else). jsdom never fetches the injected <script>, so a test
// "loads" Stripe.js by defining window.Stripe and dispatching the script's load event.
vi.unmock('@stripe/stripe-js/pure')

const stripeScripts = () =>
  [...document.querySelectorAll<HTMLScriptElement>('script')].filter((s) =>
    s.src.startsWith('https://js.stripe.com/')
  )

const finishScriptLoad = () => {
  const instance = { registerAppInfo: vi.fn() }
  const StripeConstructor = Object.assign(
    vi.fn(() => instance),
    { version: 'endive' }
  )
  ;(window as unknown as { Stripe: unknown }).Stripe = StripeConstructor
  for (const script of stripeScripts()) script.dispatchEvent(new Event('load'))
  return instance
}

/** Resolves to 'pending' when `promise` has not settled after the microtask queue drains. */
const settled = <T>(promise: Promise<T>) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('pending'), 20))])

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const freshLoader = async () => {
  vi.resetModules()
  return import('../../src/utils/load-stripe')
}

describe('loadStripeInstance with the real @stripe/stripe-js/pure loader', () => {
  beforeEach(() => {
    for (const script of stripeScripts()) script.remove()
    delete (window as unknown as { Stripe?: unknown }).Stripe
  })
  afterEach(() => {
    for (const script of stripeScripts()) script.remove()
    delete (window as unknown as { Stripe?: unknown }).Stripe
  })

  it('resolves every concurrent load from one Stripe.js script', async () => {
    const { loadStripeInstance } = await freshLoader()

    const first = loadStripeInstance('pk_test_first', {})
    const second = loadStripeInstance('pk_test_second', {})
    const third = loadStripeInstance('pk_test_third', {})
    await settled(Promise.resolve())

    expect(stripeScripts()).toHaveLength(1)
    const instance = finishScriptLoad()

    expect(await settled(first)).toBe(instance)
    expect(await settled(second)).toBe(instance)
    expect(await settled(third)).toBe(instance)
    expect(stripeScripts()).toHaveLength(1)
  })

  it('shares the in-flight load with the public loadStripe re-export', async () => {
    const { loadStripe, loadStripeInstance } = await freshLoader()

    const fromProvider = loadStripeInstance('pk_test_provider', {})
    const fromApp = loadStripe('pk_test_app')
    await settled(Promise.resolve())
    const instance = finishScriptLoad()

    expect(await settled(fromProvider)).toBe(instance)
    expect(await settled(fromApp)).toBe(instance)
    expect(stripeScripts()).toHaveLength(1)
  })

  it('applies advancedFraudSignals: false to the first load and keeps it for concurrent ones', async () => {
    const { loadStripeInstance } = await freshLoader()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const first = loadStripeInstance('pk_test_first', {}, false)
    const second = loadStripeInstance('pk_test_second', {}, false)
    await settled(Promise.resolve())

    expect(stripeScripts().map((s) => s.src)).toEqual([
      'https://js.stripe.com/endive/stripe.js?advancedFraudSignals=false'
    ])
    const instance = finishScriptLoad()
    expect(await settled(first)).toBe(instance)
    expect(await settled(second)).toBe(instance)
    // Only Stripe.js's own notice that the existing script (which already has the
    // parameter) is reused; nothing from Vue Stripe.
    expect(warn).not.toHaveBeenCalledWith(expect.stringMatching(/^\[Vue Stripe\]/))
    warn.mockRestore()
  })

  it('warns when a later load asks for advancedFraudSignals: false after a default load started', async () => {
    const { loadStripeInstance } = await freshLoader()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const first = loadStripeInstance('pk_test_first', {})
    const second = loadStripeInstance('pk_test_second', {}, false)
    await settled(Promise.resolve())

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^\[Vue Stripe\] advancedFraudSignals: false was ignored/)
    )
    const instance = finishScriptLoad()
    expect(await settled(first)).toBe(instance)
    expect(await settled(second)).toBe(instance)
    warn.mockRestore()
  })

  it('rejects every concurrent load when Stripe.js fails, and the next load starts over', async () => {
    const { loadStripeInstance } = await freshLoader()

    const first = loadStripeInstance('pk_test_first', {})
    const second = loadStripeInstance('pk_test_second', {})
    first.catch(() => {})
    second.catch(() => {})
    await settled(Promise.resolve())
    // Stripe's loader retries once on error, so fail the script twice.
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const script of stripeScripts()) script.dispatchEvent(new Event('error'))
      await tick()
    }

    await expect(first).rejects.toThrow('Failed to load Stripe.js')
    await expect(second).rejects.toThrow('Failed to load Stripe.js')

    const retry = loadStripeInstance('pk_test_retry', {})
    await settled(Promise.resolve())
    const instance = finishScriptLoad()
    expect(await settled(retry)).toBe(instance)
  })
})

describe('several VueStripeProviders on one page with the real loader', () => {
  afterEach(() => {
    for (const script of stripeScripts()) script.remove()
    delete (window as unknown as { Stripe?: unknown }).Stripe
  })

  it('renders every provider once the shared Stripe.js load finishes', async () => {
    vi.resetModules()
    const { mount } = await import('@vue/test-utils')
    const { h } = await import('vue-demi')
    const { default: VueStripeProvider } = await import('../../src/components/VueStripeProvider')

    const wrapper = mount({
      render: () =>
        h(
          'div',
          ['a', 'b', 'c'].map((name) =>
            h(VueStripeProvider, { key: name, publishableKey: `pk_test_${name}` }, () =>
              h('p', { class: 'ready' }, `provider ${name} ready`)
            )
          )
        )
    })
    await tick()
    expect(wrapper.findAll('.vue-stripe-loading')).toHaveLength(3)
    expect(stripeScripts()).toHaveLength(1)

    finishScriptLoad()
    for (let i = 0; i < 5; i++) await tick()

    expect(wrapper.findAll('.vue-stripe-loading')).toHaveLength(0)
    expect(wrapper.findAll('.ready').map((p) => p.text())).toEqual([
      'provider a ready',
      'provider b ready',
      'provider c ready'
    ])
    wrapper.unmount()
  })
})
