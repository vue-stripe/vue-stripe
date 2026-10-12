import { describe, it, expect, vi } from 'vitest'
import type { App } from 'vue-demi'
import { createVueStripe } from '../src/plugin'
import { stripeConfigInjectionKey, stripeInjectionKey } from '../src/utils/injection-keys'

// The Vue 2.7 install path, unit-tested here; packages/vue2-smoke mounts it for real.
vi.mock('vue-demi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-demi')>()),
  isVue2: true
}))

describe('createVueStripe on Vue 2.7', () => {
  it('provides through a global mixin on root instances only', () => {
    const mixin = vi.fn()
    const provide = vi.fn()
    createVueStripe({ publishableKey: 'pk_test_123' }).install?.({
      mixin,
      provide
    } as unknown as App)

    expect(provide).not.toHaveBeenCalled()
    expect(mixin).toHaveBeenCalledTimes(1)
    const options = mixin.mock.calls[0]?.[0] as { provide(this: object): object }

    const root: { $root?: unknown } = {}
    root.$root = root
    const provided = options.provide.call(root) as Record<symbol, unknown>
    expect(provided[stripeConfigInjectionKey]).toMatchObject({ publishableKey: 'pk_test_123' })
    expect(provided[stripeInjectionKey]).toHaveProperty('stripe')

    // A child (e.g. VueStripeProvider) inherits instead of re-providing, so its own provide() wins.
    expect(Reflect.ownKeys(options.provide.call({ $root: root }))).toEqual([])
  })
})
