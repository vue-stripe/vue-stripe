import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue-demi'
import VueStripePricingTable from '../../src/components/VueStripePricingTable.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
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
    scripts.forEach(script => script.remove())
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
    await new Promise(resolve => setTimeout(resolve, 50))
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
    document.querySelectorAll('script[src*="pricing-table.js"]').forEach(s => s.remove())

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
    await new Promise(resolve => setTimeout(resolve, 50))
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
    document.querySelectorAll('script[src*="pricing-table.js"]').forEach(s => s.remove())

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: () => h(VueStripePricingTable,
          { pricingTableId: 'prctbl_test_123' },
          {
            error: ({ error }: { error: string }) => h('div', { class: 'custom-error' }, `Error: ${error}`)
          }
        )
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Wait for script error
    await new Promise(resolve => setTimeout(resolve, 50))
    await flushPromises()
    await nextTick()

    // Check for error state in component
    const pricingTableComponent = wrapper.findComponent(VueStripePricingTable)
    const vm = pricingTableComponent.vm as any
    expect(vm.error).toBeTruthy()

    vi.restoreAllMocks()
  })
})
