import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, h, inject } from 'vue-demi'
import { mount } from '@vue/test-utils'
import { createVueStripe } from '../src/plugin'
import { stripeConfigInjectionKey, type VueStripeConfig } from '../src/utils/injection-keys'
import VueStripePricingTable from '../src/components/VueStripePricingTable.vue'
import type { VueStripeOptions } from '../src/types'

describe('createVueStripe Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a valid Vue plugin', () => {
    const plugin = createVueStripe({ publishableKey: 'pk_test_123' })

    expect(plugin).toHaveProperty('install')
    expect(typeof plugin.install).toBe('function')
  })

  it('should provide config under the shared stripeConfigInjectionKey', () => {
    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123',
      stripeAccount: 'acct_123',
      apiVersion: '2023-10-16',
      locale: 'en'
    }

    let injectedConfig: VueStripeConfig | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedConfig = inject(stripeConfigInjectionKey)
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    expect(injectedConfig).toBeDefined()
    expect(injectedConfig).toMatchObject({
      publishableKey: 'pk_test_123',
      stripeAccount: 'acct_123',
      apiVersion: '2023-10-16',
      locale: 'en'
    })

    app.unmount()
  })

  it('should NOT provide config under the legacy string key (key fixed)', () => {
    let legacyConfig: unknown

    const TestComponent = defineComponent({
      setup() {
        legacyConfig = inject('vue-stripe-config', undefined)
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe({ publishableKey: 'pk_test_123' }))

    const container = document.createElement('div')
    app.mount(container)

    expect(legacyConfig).toBeUndefined()

    app.unmount()
  })

  it('lets VueStripePricingTable resolve config via the plugin (no VueStripeProvider)', () => {
    // Before the fix, the plugin provided config under a string key while
    // VueStripePricingTable injects stripeConfigInjectionKey (Symbol), so it
    // threw "must be used within a VueStripeProvider". With the fix it mounts.
    const wrapper = mount(VueStripePricingTable, {
      props: { pricingTableId: 'prctbl_123' },
      global: {
        plugins: [createVueStripe({ publishableKey: 'pk_test_123' })]
      }
    })

    expect(wrapper.find('.vue-stripe-pricing-table').exists()).toBe(true)
    // The pricing-table web component receives the plugin's publishable key.
    expect(wrapper.html()).toContain('pk_test_123')
  })
})
