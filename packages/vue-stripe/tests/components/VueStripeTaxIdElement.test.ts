import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref, nextTick, defineComponent, provide } from 'vue-demi'
import VueStripeTaxIdElement from '../../src/components/VueStripeTaxIdElement.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeCheckoutProvider from '../../src/components/VueStripeCheckoutProvider.vue'
import { stripeCheckoutInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockStripe, makeMockCheckout, makeMockElement } from '../setup'

// Mount Provider > CheckoutProvider > TaxIdElement; returns wrapper + the checkout mock.
async function mountElement(checkout = makeMockCheckout(), elProps = {}, elSlots = {}) {
  const stripe = { ...makeMockStripe(), initCheckout: vi.fn(() => Promise.resolve(checkout)) }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () => h(VueStripeCheckoutProvider, { clientSecret: 'cs_test_123_secret' }, {
        default: () => h(VueStripeTaxIdElement, elProps, elSlots)
      })
    }
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return { wrapper, checkout }
}

describe('VueStripeTaxIdElement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside VueStripeCheckoutProvider', () => {
    expect(() => mount(VueStripeTaxIdElement)).toThrow(
      'VueStripeTaxIdElement must be used within VueStripeCheckoutProvider'
    )
  })

  it('renders the element container', async () => {
    const { wrapper } = await mountElement()
    expect(wrapper.find('.vue-stripe-tax-id-element').exists()).toBe(true)
    expect(wrapper.find('.vue-stripe-tax-id-element-mount').exists()).toBe(true)
  })

  it('creates the element with the provided options and mounts it', async () => {
    const options = { fields: { businessName: 'always' as const } }
    const { checkout } = await mountElement(makeMockCheckout(), { options })
    expect(checkout.createTaxIdElement).toHaveBeenCalledWith(options)
    const created = checkout.createTaxIdElement.mock.results[0].value
    expect(created.mount).toHaveBeenCalledTimes(1)
  })

  it('reuses an existing element instead of creating a second one', async () => {
    const checkout = makeMockCheckout()
    const existing = makeMockElement()
    checkout.getTaxIdElement = vi.fn(() => existing)
    await mountElement(checkout)
    expect(checkout.getTaxIdElement).toHaveBeenCalled()
    expect(checkout.createTaxIdElement).not.toHaveBeenCalled()
    expect(existing.mount).toHaveBeenCalledTimes(1)
  })

  it('attaches named listeners including change and emits change', async () => {
    const { wrapper, checkout } = await mountElement()
    const created = checkout.createTaxIdElement.mock.results[0].value
    const events = created.on.mock.calls.map((c: any[]) => c[0])
    expect(events).toEqual(
      expect.arrayContaining(['ready', 'change', 'focus', 'blur', 'escape', 'loaderstart', 'loaderror'])
    )

    const changeHandler = created.on.mock.calls.find((c: any[]) => c[0] === 'change')![1]
    changeHandler({ complete: true, value: { taxId: 'DE123' } })
    const el = wrapper.findComponent(VueStripeTaxIdElement)
    expect(el.emitted('change')).toBeTruthy()
  })

  it('calls element.update() when the options prop changes', async () => {
    // Provide the checkout context directly so the TaxId element is the rendered
    // child of a host that owns a reactive `options` ref we can mutate.
    const checkout = makeMockCheckout()
    const created = makeMockElement()
    checkout.createTaxIdElement = vi.fn(() => created)
    const options = ref({ fields: { businessName: 'auto' as const } })

    const Host = defineComponent({
      setup() {
        provide(stripeCheckoutInjectionKey, {
          checkout: ref(checkout) as any,
          actions: ref(checkout.actions) as any,
          session: ref(null),
          loading: ref(false),
          error: ref(null)
        })
        return () => h(VueStripeTaxIdElement, { options: options.value })
      }
    })
    mount(Host)
    await nextTick()

    options.value = { fields: { businessName: 'always' as const } }
    await nextTick()
    expect(created.update).toHaveBeenCalledWith({ fields: { businessName: 'always' } })
  })

  it('detaches every listener and destroys the element on unmount', async () => {
    const { wrapper, checkout } = await mountElement()
    const created = checkout.createTaxIdElement.mock.results[0].value
    wrapper.unmount()
    expect(created.off).toHaveBeenCalledTimes(created.on.mock.calls.length)
    expect(created.destroy).toHaveBeenCalledTimes(1)
  })
})
