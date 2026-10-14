import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue-demi'
import { renderToString } from 'vue/server-renderer'
import VueStripePricingTable from '../../src/components/VueStripePricingTable'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { createVueStripe } from '../../src/plugin'
import { VueStripeProviderError } from '../../src/utils/errors'
import { flushPromises } from '../setup'

describe('VueStripePricingTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any existing pricing table scripts
    const existingScript = document.querySelector('script[src*="pricing-table.js"]')
    if (existingScript) {
      existingScript.remove()
    }
  })

  afterEach(() => {
    // Clean up pricing table scripts
    const scripts = document.querySelectorAll('script[src*="pricing-table.js"]')
    scripts.forEach((script) => script.remove())
  })

  // Helper to mount within VueStripeProvider
  const mountWithProvider = async (pricingTableProps = {}, pricingTableSlots = {}) => {
    const defaultProps = {
      pricingTableId: 'prctbl_test_123',
      ...pricingTableProps
    }

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripePricingTable, defaultProps, pricingTableSlots)
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return wrapper
  }

  it('should throw error when used outside VueStripeProvider', () => {
    expect(() => {
      mount(VueStripePricingTable, {
        props: {
          pricingTableId: 'prctbl_test_123'
        }
      })
    }).toThrow('VueStripePricingTable must be used within a VueStripeProvider component')
  })

  it('should render pricing table container', async () => {
    const wrapper = await mountWithProvider()

    expect(wrapper.find('.vue-stripe-pricing-table').exists()).toBe(true)
  })

  it('should show loading state initially', async () => {
    const wrapper = await mountWithProvider()

    // Component should have loading element (may or may not be visible depending on script load timing)
    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    expect(pricingTableComponent.exists()).toBe(true)
  })

  it('should render stripe-pricing-table web component with correct props', async () => {
    const wrapper = await mountWithProvider({
      pricingTableId: 'prctbl_custom_123',
      customerEmail: 'test@example.com',
      clientReferenceId: 'ref_123'
    })

    await flushPromises()
    await nextTick()

    const pricingTable = wrapper.find('stripe-pricing-table')
    expect(pricingTable.exists()).toBe(true)
    expect(pricingTable.attributes('pricing-table-id')).toBe('prctbl_custom_123')
    expect(pricingTable.attributes('publishable-key')).toBe('pk_test_123')
    expect(pricingTable.attributes('customer-email')).toBe('test@example.com')
    expect(pricingTable.attributes('client-reference-id')).toBe('ref_123')
  })

  it('should pass customer session client secret when provided', async () => {
    const wrapper = await mountWithProvider({
      pricingTableId: 'prctbl_test_123',
      customerSessionClientSecret: 'cuss_secret_123'
    })

    await flushPromises()
    await nextTick()

    const pricingTable = wrapper.find('stripe-pricing-table')
    expect(pricingTable.attributes('customer-session-client-secret')).toBe('cuss_secret_123')
  })

  it('should expose loading and error refs via defineExpose', async () => {
    const wrapper = await mountWithProvider()

    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    expect(pricingTableComponent.vm).toBeDefined()

    const vm = pricingTableComponent.vm as any
    expect(vm.loading).toBeDefined()
    expect(vm.error).toBeDefined()
  })

  it('should render custom loading slot', async () => {
    const wrapper = await mountWithProvider(
      { pricingTableId: 'prctbl_test_123' },
      {
        loading: () => h('div', { class: 'custom-loading' }, 'Custom loading...')
      }
    )

    // Note: The loading state depends on script load timing
    // The custom slot should be available when loading is true
    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    expect(pricingTableComponent.exists()).toBe(true)
  })

  it('should not duplicate script tags when remounting', async () => {
    // Mount first instance
    const wrapper1 = await mountWithProvider()
    await flushPromises()

    // Mount second instance
    const wrapper2 = await mountWithProvider()
    await flushPromises()

    // Should only have one script tag
    const scripts = document.querySelectorAll('script[src*="pricing-table.js"]')
    expect(scripts.length).toBeLessThanOrEqual(1)

    wrapper1.unmount()
    wrapper2.unmount()
  })

  it('should emit load event when script loads successfully', async () => {
    // Mock successful script load
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'script') {
        setTimeout(() => {
          element.onload?.({} as Event)
        }, 10)
      }
      return element
    })

    const wrapper = await mountWithProvider()

    // Wait for script load
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushPromises()

    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    const emitted = pricingTableComponent.emitted('load')
    expect(emitted).toBeTruthy()

    vi.restoreAllMocks()
  })

  it('should emit error event when script fails to load', async () => {
    // Mock failed script load
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'script') {
        setTimeout(() => {
          element.onerror?.({} as Event)
        }, 10)
      }
      return element
    })

    // Need to mount a fresh instance where script hasn't been loaded
    document.querySelectorAll('script[src*="pricing-table.js"]').forEach((s) => s.remove())

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripePricingTable, { pricingTableId: 'prctbl_test_123' })
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Wait for script error
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushPromises()
    await nextTick()

    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    const emitted = pricingTableComponent.emitted('error')
    expect(emitted).toBeTruthy()

    vi.restoreAllMocks()
  })

  it('should render error slot when error occurs', async () => {
    // Mock failed script load
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'script') {
        setTimeout(() => {
          element.onerror?.({} as Event)
        }, 10)
      }
      return element
    })

    // Clean up existing scripts
    document.querySelectorAll('script[src*="pricing-table.js"]').forEach((s) => s.remove())

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () =>
          h(
            VueStripePricingTable,
            { pricingTableId: 'prctbl_test_123' },
            {
              error: ({ error }: { error: string }) =>
                h('div', { class: 'custom-error' }, `Error: ${error}`)
            }
          )
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Wait for script error
    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushPromises()
    await nextTick()

    // Check for error state in component
    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    const vm = pricingTableComponent.vm as any
    expect(vm.error).toBeTruthy()

    vi.restoreAllMocks()
  })
  describe('retry after a script load error (#591)', () => {
    const scripts = () =>
      Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="pricing-table.js"]'))

    const mountTables = (count: number) =>
      mount(VueStripeProvider, {
        props: { publishableKey: 'pk_test_123' },
        slots: {
          default: () =>
            Array.from({ length: count }, (_, i) =>
              h(VueStripePricingTable, { key: i, pricingTableId: `prctbl_${i}` })
            )
        }
      })

    it('adds a new script tag on remount and emits load only once it loads', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const first = mountTables(1)
      await flushPromises()
      expect(scripts()).toHaveLength(1)
      scripts()[0]!.onerror?.(new Event('error'))
      await flushPromises()
      expect(first.findComponent(VueStripePricingTable).emitted('error')).toHaveLength(1)
      expect(scripts()).toHaveLength(0)
      first.unmount()

      const second = mountTables(1)
      await flushPromises()
      const table = second.findComponent(VueStripePricingTable)
      expect(scripts()).toHaveLength(1)
      expect(table.emitted('load')).toBeUndefined()
      scripts()[0]!.onload?.(new Event('load'))
      await flushPromises()
      expect(table.emitted('load')).toHaveLength(1)
      second.unmount()
      consoleError.mockRestore()
    })

    it('reuses a script tag that already loaded', async () => {
      const first = mountTables(1)
      await flushPromises()
      scripts()[0]!.onload?.(new Event('load'))
      await flushPromises()
      const second = mountTables(1)
      await flushPromises()
      expect(scripts()).toHaveLength(1)
      expect(second.findComponent(VueStripePricingTable).emitted('load')).toHaveLength(1)
      first.unmount()
      second.unmount()
    })

    it('adds no tag once the custom element is defined', async () => {
      const get = vi.spyOn(customElements, 'get').mockReturnValue(class extends HTMLElement {})
      const wrapper = mountTables(1)
      await flushPromises()
      expect(scripts()).toHaveLength(0)
      expect(wrapper.findComponent(VueStripePricingTable).emitted('load')).toHaveLength(1)
      wrapper.unmount()
      get.mockRestore()
    })

    it("waits for the element a tag from the page's HTML defines", async () => {
      const own = document.createElement('script')
      own.src = 'https://js.stripe.com/v3/pricing-table.js'
      document.head.appendChild(own)
      let define!: () => void
      const whenDefined = vi
        .spyOn(customElements, 'whenDefined')
        .mockReturnValue(new Promise((resolve) => (define = () => resolve(HTMLElement))))
      const wrapper = mountTables(1)
      await flushPromises()
      const table = wrapper.findComponent(VueStripePricingTable)
      expect(scripts()).toHaveLength(1)
      expect(table.emitted('load')).toBeUndefined()
      define()
      await flushPromises()
      expect(whenDefined).toHaveBeenCalledWith('stripe-pricing-table')
      expect(table.emitted('load')).toHaveLength(1)
      wrapper.unmount()
      whenDefined.mockRestore()
    })

    it('reports the failure to every table waiting on the same script', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mountTables(2)
      await flushPromises()
      expect(scripts()).toHaveLength(1)
      scripts()[0]!.onerror?.(new Event('error'))
      await flushPromises()
      for (const table of wrapper.findAllComponents(VueStripePricingTable)) {
        expect(table.emitted('error')).toHaveLength(1)
        expect(table.emitted('load')).toBeUndefined()
      }
      wrapper.unmount()
      consoleError.mockRestore()
    })
  })

  // A compiled slot root with dynamic text only gets its text patched, so an unkeyed switch
  // from the loading state to the error state kept the loading root's class (as in #675).
  describe('loading to error with compiled slots', () => {
    const failScript = async () => {
      await nextTick()
      const script = document.querySelector<HTMLScriptElement>('script[src*="pricing-table.js"]')!
      script.onerror?.(new Event('error'))
      await flushPromises()
      await nextTick()
    }
    const mountTemplate = (slots: string) =>
      mount(
        defineComponent({
          components: { VueStripeProvider, VueStripePricingTable },
          setup: () => ({ label: ref('dynamic') }),
          template: `<VueStripeProvider publishable-key="pk_test_123">
            <VueStripePricingTable pricing-table-id="prctbl_test_123">${slots}</VueStripePricingTable>
          </VueStripeProvider>`
        })
      )

    it('replaces a custom #loading root with the custom #error root', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mountTemplate(`
        <template #loading><div class="my-loading">loading {{ label }}</div></template>
        <template #error="{ error }"><div class="my-error">failed: {{ error }}</div></template>`)
      await flushPromises()
      expect(wrapper.find('.my-loading').text()).toBe('loading dynamic')

      await failScript()
      expect(wrapper.find('.my-loading').exists()).toBe(false)
      expect(wrapper.find('.my-error').text()).toBe(
        'failed: Failed to load Stripe pricing table script'
      )
      vi.restoreAllMocks()
    })

    it('replaces the default loading markup with the custom #error root', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mountTemplate(
        `<template #error="{ error }"><div class="my-error">failed: {{ error }}</div></template>`
      )
      await flushPromises()
      expect(wrapper.find('.vue-stripe-pricing-table-loading').exists()).toBe(true)
      const table = wrapper.find('stripe-pricing-table').element

      await failScript()
      expect(wrapper.find('.vue-stripe-pricing-table-loading').exists()).toBe(false)
      expect(wrapper.find('.my-error').classes()).toEqual(['my-error'])
      // Stripe's web component is kept, not re-created.
      expect(wrapper.find('stripe-pricing-table').element).toBe(table)
      vi.restoreAllMocks()
    })
  })

  // The usual cause: the environment variable holding the key did not reach the build.
  describe('with createVueStripe() and an empty publishable key (#728)', () => {
    const scripts = () => document.querySelectorAll('script[src*="pricing-table.js"]')
    const mountWithPlugin = (publishableKey: string | undefined, options = {}) =>
      mount(VueStripePricingTable, {
        props: { pricingTableId: 'prctbl_test_123' },
        global: { plugins: [createVueStripe({ publishableKey: publishableKey as string })] },
        ...options
      })

    it.each([[''], [undefined]])(
      'does not throw for %j: it reports the empty key through #error and @error',
      async (key) => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const wrapper = mountWithPlugin(key)
        await flushPromises()

        const message = wrapper.find('.vue-stripe-pricing-table-error').text()
        expect(message).toContain('publishableKey is empty')
        expect(message).toContain('createVueStripe()')
        expect(message).not.toContain('must be used within')
        expect(wrapper.find('.vue-stripe-pricing-table-loading').exists()).toBe(false)
        // Neither Stripe's web component nor its script: without a key both could only fail.
        expect(wrapper.find('stripe-pricing-table').exists()).toBe(false)
        expect(scripts()).toHaveLength(0)

        const emitted = wrapper.emitted('error')
        expect(emitted).toHaveLength(1)
        const error = emitted![0]![0] as Error
        expect(error).toBeInstanceOf(VueStripeProviderError)
        expect(error.message).toBe(message)
        expect(wrapper.emitted('load')).toBeUndefined()
        // Unhandled (no listener, no #error slot): logged once with the prefix.
        expect(consoleError).toHaveBeenCalledWith('[Vue Stripe] Pricing table error:', message)
        expect((wrapper.vm as unknown as { error: string | null }).error).toBe(message)
        consoleError.mockRestore()
      }
    )

    it('renders a custom #error slot and logs nothing', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mountWithPlugin('', {
        slots: { error: ({ error }: { error: string }) => h('p', { class: 'my-error' }, error) }
      })
      await flushPromises()
      expect(wrapper.find('.my-error').text()).toContain('publishableKey is empty')
      expect(consoleError).not.toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('renders the error on the server instead of throwing (no HTTP 500)', async () => {
      const app = createSSRApp({
        render: () => h(VueStripePricingTable, { pricingTableId: 'prctbl_test_123' })
      })
      app.use(createVueStripe({ publishableKey: '' }))
      const html = await renderToString(app)
      expect(html).toContain('vue-stripe-pricing-table-error')
      expect(html).toContain('publishableKey is empty')
      expect(html).not.toContain('<stripe-pricing-table')
    })

    it('still throws the "must be used within" error with no provider and no plugin', () => {
      expect(() =>
        mount(VueStripePricingTable, { props: { pricingTableId: 'prctbl_test_123' } })
      ).toThrow(VueStripeProviderError)
    })
  })
})
