import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, inject } from 'vue-demi'
import VueStripeCheckoutProvider from '../../src/components/VueStripeCheckoutProvider.vue'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import { stripeCheckoutInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockStripe, makeMockCheckout, makeMockCheckoutSession } from '../setup'

// Mount Provider > CheckoutProvider with a stripe whose initCheckout resolves to
// the given checkout mock; returns the wrapper.
async function mountWith(checkout = makeMockCheckout(), providerProps: Record<string, unknown> = { clientSecret: 'cs_test_123_secret' }, slots = {}) {
  const stripe = { ...makeMockStripe(), initCheckout: vi.fn(() => Promise.resolve(checkout)) }
  const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
  mockLoadStripe.mockResolvedValueOnce(stripe as any)

  const wrapper = mount(VueStripeProvider, {
    props: { publishableKey: 'pk_test_123' },
    slots: {
      default: () => h(VueStripeCheckoutProvider, providerProps, slots)
    }
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return { wrapper, stripe, checkout }
}

describe('VueStripeCheckoutProvider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when used outside VueStripeProvider', () => {
    expect(() =>
      mount(VueStripeCheckoutProvider, { props: { clientSecret: 'cs_test' } })
    ).toThrow('VueStripeCheckoutProvider must be used within VueStripeProvider')
  })

  it('calls stripe.initCheckout, wrapping a raw clientSecret in fetchClientSecret', async () => {
    const { stripe } = await mountWith()
    expect(stripe.initCheckout).toHaveBeenCalledTimes(1)
    const arg = stripe.initCheckout.mock.calls[0][0]
    expect(typeof arg.fetchClientSecret).toBe('function')
    await expect(arg.fetchClientSecret()).resolves.toBe('cs_test_123_secret')
  })

  it('prefers fetchClientSecret over clientSecret', async () => {
    const fetchClientSecret = vi.fn(() => Promise.resolve('cs_from_fn'))
    const { stripe } = await mountWith(makeMockCheckout(), { fetchClientSecret })
    const arg = stripe.initCheckout.mock.calls[0][0]
    expect(arg.fetchClientSecret).toBe(fetchClientSecret)
  })

  it('forwards elementsOptions to initCheckout', async () => {
    const elementsOptions = { appearance: { theme: 'night' } }
    const { stripe } = await mountWith(makeMockCheckout(), { clientSecret: 'cs_test_123_secret', elementsOptions })
    expect(stripe.initCheckout.mock.calls[0][0].elementsOptions).toEqual(elementsOptions)
  })

  it('seeds the session and provides the checkout context to children', async () => {
    let injected: any = null
    const checkout = makeMockCheckout()
    checkout.session = vi.fn(() => makeMockCheckoutSession({ email: 'a@b.com' }))

    const Child = {
      setup() {
        injected = inject(stripeCheckoutInjectionKey)
        return () => h('div', 'child')
      }
    }
    await mountWith(checkout, { clientSecret: 'cs_test_123_secret' }, { default: () => h(Child) })

    expect(injected).toBeTruthy()
    expect(injected.checkout.value).toBe(checkout)
    expect(injected.session.value.email).toBe('a@b.com')
    expect(injected.loading.value).toBe(false)
  })

  it('updates the reactive session when the checkout emits a change', async () => {
    let injected: any = null
    const checkout = makeMockCheckout()
    const Child = {
      setup() {
        injected = inject(stripeCheckoutInjectionKey)
        return () => h('div')
      }
    }
    await mountWith(checkout, { clientSecret: 'cs_test_123_secret' }, { default: () => h(Child) })

    // grab the change handler registered via checkout.on('change', handler)
    const onCall = checkout.on.mock.calls.find((c: any[]) => c[0] === 'change')
    expect(onCall).toBeTruthy()
    const handler = onCall![1]
    handler(makeMockCheckoutSession({ email: 'changed@b.com', canConfirm: false }))

    expect(injected.session.value.email).toBe('changed@b.com')
    expect(injected.session.value.canConfirm).toBe(false)
  })

  it('renders the error slot when initCheckout rejects', async () => {
    const stripe = { ...makeMockStripe(), initCheckout: vi.fn(() => Promise.reject(new Error('bad session'))) }
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce(stripe as any)

    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () => h(VueStripeCheckoutProvider, { clientSecret: 'cs_test_123_secret' }, {
          error: ({ error }: { error: string }) => h('div', { class: 'custom-checkout-error' }, error)
        })
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.custom-checkout-error').exists()).toBe(true)
    expect(wrapper.find('.custom-checkout-error').text()).toContain('bad session')
  })

  it('shows an error when neither clientSecret nor fetchClientSecret is provided', async () => {
    const stripe = makeMockStripe()
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce(stripe as any)

    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(VueStripeCheckoutProvider, {}) }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(stripe.initCheckout).not.toHaveBeenCalled()
    expect(wrapper.find('.vue-stripe-checkout-error').text()).toContain('clientSecret')
  })
})
