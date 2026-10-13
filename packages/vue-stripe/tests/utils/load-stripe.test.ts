import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

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
  defineStripe(vi.fn(() => instance))
  return instance
}

/** Defines window.Stripe as `construct` and fires the script's load event. */
const defineStripe = (construct: (...args: unknown[]) => unknown) => {
  const StripeConstructor = Object.assign(construct, { version: 'endive' })
  ;(window as unknown as { Stripe: unknown }).Stripe = StripeConstructor
  for (const script of stripeScripts()) script.dispatchEvent(new Event('load'))
  return StripeConstructor
}

/** Like Stripe(): a new instance per call, and an IntegrationError for a secret key. */
const strictStripe = () =>
  vi.fn((key: unknown) => {
    if (String(key).startsWith('sk_')) {
      throw new Error('You should not use your secret key with Stripe.js.')
    }
    return { key, registerAppInfo: vi.fn() }
  })

/** Resolves to 'pending' when `promise` has not settled after the microtask queue drains. */
const settled = <T>(promise: Promise<T>) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('pending'), 20))])

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const freshLoader = async () => {
  vi.resetModules()
  return import('../../src/utils/load-stripe')
}

// Each test re-imports the loader after vi.resetModules(). The first import transforms
// the real @stripe/stripe-js module graph, which can take seconds on a busy machine, so
// warm it once and give the tests room instead of failing on the default 5 s timeout.
const LOADER_TIMEOUT = 20_000

describe(
  'loadStripeInstance with the real @stripe/stripe-js/pure loader',
  { timeout: LOADER_TIMEOUT },
  () => {
    beforeAll(async () => {
      await freshLoader()
    }, LOADER_TIMEOUT)

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

    it('fails only the caller whose arguments Stripe() rejects, in either order (#596)', async () => {
      for (const order of [
        ['sk_test_bad', 'pk_test_good'],
        ['pk_test_good', 'sk_test_bad']
      ]) {
        for (const script of stripeScripts()) script.remove()
        delete (window as unknown as { Stripe?: unknown }).Stripe
        const { loadStripeInstance } = await freshLoader()

        const [first, second] = order.map((key) => loadStripeInstance(key!, {}))
        first!.catch(() => {})
        second!.catch(() => {})
        await settled(Promise.resolve())
        defineStripe(strictStripe())

        const results = await Promise.allSettled([first!, second!])
        const byKey = Object.fromEntries(order.map((key, i) => [key, results[i]!]))
        expect(byKey['sk_test_bad']).toMatchObject({
          status: 'rejected',
          reason: { message: 'You should not use your secret key with Stripe.js.' }
        })
        expect(byKey['pk_test_good']).toMatchObject({
          status: 'fulfilled',
          value: { key: 'pk_test_good' }
        })
      }
    })

    it('reuses one instance for identical arguments, and creates one per distinct set (#618)', async () => {
      const { loadStripeInstance } = await freshLoader()

      const first = loadStripeInstance('pk_test_a', { locale: 'fr' })
      await settled(Promise.resolve())
      const construct = defineStripe(strictStripe())
      const instance = await settled(first)

      // Same key and options, later (a provider remounted after client-side navigation).
      expect(await loadStripeInstance('pk_test_a', { locale: 'fr' })).toBe(instance)
      expect(construct).toHaveBeenCalledTimes(1)
      expect(
        (instance as { registerAppInfo: ReturnType<typeof vi.fn> }).registerAppInfo
      ).toHaveBeenCalledTimes(1)

      // Any difference in the arguments gets its own instance.
      const others = await Promise.all([
        loadStripeInstance('pk_test_b', { locale: 'fr' }),
        loadStripeInstance('pk_test_a', { locale: 'de' }),
        loadStripeInstance('pk_test_a', { locale: 'fr', stripeAccount: 'acct_1' }),
        loadStripeInstance('pk_test_a', { locale: 'fr' }, false)
      ])
      expect(new Set([instance, ...others]).size).toBe(5)
      expect(construct).toHaveBeenCalledTimes(5)
    })

    it('does not keep a failed instance, so the next identical call tries again (#618)', async () => {
      const { loadStripeInstance } = await freshLoader()
      let fail = true
      const first = loadStripeInstance('pk_test_retry', {})
      first.catch(() => {})
      await settled(Promise.resolve())
      defineStripe(
        vi.fn(() => {
          if (fail) throw new Error('boom')
          return { registerAppInfo: vi.fn() }
        })
      )
      await expect(first).rejects.toThrow('boom')

      fail = false
      await expect(loadStripeInstance('pk_test_retry', {})).resolves.toBeTruthy()
    })

    it('drops apiVersion, which versioned Stripe.js rejects, and warns once (#597)', async () => {
      const { loadStripeInstance } = await freshLoader()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const first = loadStripeInstance('pk_test_api', { apiVersion: '2026-09-30.endive' })
      await settled(Promise.resolve())
      const construct = defineStripe(
        vi.fn((_key: unknown, options?: { apiVersion?: string }) => {
          if (options?.apiVersion) {
            throw new Error(
              'Unsupported on version [endive]: Can not provide apiVersion to Stripe()'
            )
          }
          return { registerAppInfo: vi.fn() }
        })
      )
      const instance = await first
      await loadStripeInstance('pk_test_api2', { apiVersion: '2020-08-27', locale: 'fr' })

      expect(construct).toHaveBeenNthCalledWith(1, 'pk_test_api', {})
      expect(construct).toHaveBeenNthCalledWith(2, 'pk_test_api2', { locale: 'fr' })
      // Ignored, so the same arguments without it share the instance.
      expect(await loadStripeInstance('pk_test_api', {})).toBe(instance)
      const notices = warn.mock.calls.filter(([m]) => /^\[Vue Stripe\] apiVersion/.test(String(m)))
      expect(notices).toHaveLength(1)
      warn.mockRestore()
    })
  }
)

describe(
  'several VueStripeProviders on one page with the real loader',
  { timeout: LOADER_TIMEOUT },
  () => {
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

    it('keeps a valid provider working when a provider mounted with it fails (#596)', async () => {
      vi.resetModules()
      const { mount } = await import('@vue/test-utils')
      const { h } = await import('vue-demi')
      const { default: VueStripeProvider } = await import('../../src/components/VueStripeProvider')
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = mount({
        render: () =>
          h(
            'div',
            ['sk_test_a', 'pk_test_b'].map((key) =>
              h(VueStripeProvider, { key, publishableKey: key }, () =>
                h('p', { class: 'ready' }, `${key} ready`)
              )
            )
          )
      })
      await tick()
      defineStripe(strictStripe())
      for (let i = 0; i < 5; i++) await tick()

      expect(wrapper.findAll('.vue-stripe-error').map((e) => e.text())).toEqual([
        'You should not use your secret key with Stripe.js.'
      ])
      expect(wrapper.findAll('.ready').map((p) => p.text())).toEqual(['pk_test_b ready'])
      wrapper.unmount()
      error.mockRestore()
    })
  }
)
