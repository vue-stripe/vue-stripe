import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeEmbeddedCheckout from '../../src/components/VueStripeEmbeddedCheckout'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockStripe } from '../setup'

type MockFn = ReturnType<typeof vi.fn>
interface MockEmbeddedCheckout {
  mount: MockFn
  unmount: MockFn
  destroy: MockFn
}
interface CreatedOptions {
  clientSecret?: string
  fetchClientSecret?: () => Promise<string>
  onComplete?: () => void
  onAnalyticsEvent?: (event: unknown) => void
  onLineItemsChange?: (event: unknown) => Promise<unknown>
  onShippingDetailsChange?: unknown
}

const makeEmbedded = (): MockEmbeddedCheckout => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  destroy: vi.fn()
})

// Provider > [EmbeddedCheckout...]; `count` instances render side by side.
async function mountWith(
  props: Record<string, unknown> = { clientSecret: 'cs_test_123_secret_456' },
  {
    embedded = makeEmbedded(),
    create,
    slots = {},
    count = 1
  }: {
    embedded?: MockEmbeddedCheckout
    create?: MockFn
    slots?: Record<string, unknown>
    count?: number
  } = {}
) {
  const stripe = makeMockStripe()
  stripe.createEmbeddedCheckoutPage = create ?? vi.fn(() => Promise.resolve(embedded))
  vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

  const shown = ref(count)
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          VueStripeProvider,
          { publishableKey: 'pk_test_123' },
          {
            default: () =>
              Array.from({ length: shown.value }, (_, i) =>
                h(VueStripeEmbeddedCheckout, { key: i, ...props }, slots)
              )
          }
        )
    }
  })
  const wrapper = mount(Host)
  await flushPromises()
  await flushPromises()
  const instances = () => wrapper.findAllComponents(VueStripeEmbeddedCheckout)
  const options = (call = 0) =>
    stripe.createEmbeddedCheckoutPage.mock.calls[call]?.[0] as CreatedOptions
  return { wrapper, stripe, embedded, shown, instances, options }
}

describe('VueStripeEmbeddedCheckout (stripe.createEmbeddedCheckoutPage)', () => {
  enableAutoUnmount(afterEach)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('throws when used outside VueStripeProvider', () => {
    expect(() => mount(VueStripeEmbeddedCheckout, { props: { clientSecret: 'cs_test' } })).toThrow(
      'VueStripeEmbeddedCheckout must be used within a VueStripeProvider component or an app using createVueStripe()'
    )
  })

  it('creates the embedded page with the client secret and mounts it into its element', async () => {
    const { stripe, embedded, instances, options } = await mountWith()
    expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledTimes(1)
    expect(options().clientSecret).toBe('cs_test_123_secret_456')
    expect(options().fetchClientSecret).toBeUndefined()
    const target = instances()[0]!.find('.vue-stripe-embedded-checkout-mount').element
    expect(embedded.mount).toHaveBeenCalledWith(target)
  })

  it('emits ready with the embedded checkout and exposes it', async () => {
    const { embedded, instances } = await mountWith()
    const component = instances()[0]!
    expect(component.emitted('ready')?.[0]).toEqual([embedded])
    const vm = component.vm as unknown as {
      checkout: unknown
      loading: boolean
      error: string | null
    }
    expect(vm.checkout).toBe(embedded)
    expect(vm.loading).toBe(false)
    expect(vm.error).toBeNull()
  })

  // #684: Stripe reports a failing fetchClientSecret only inside its iframe and as an uncaught
  // IntegrationError, after the page was created, so the component resolves it first.
  it('resolves fetchClientSecret and passes the secret to Stripe', async () => {
    const fetchClientSecret = vi.fn(() => Promise.resolve('cs_fetched'))
    const { options, instances } = await mountWith({ fetchClientSecret })
    expect(fetchClientSecret).toHaveBeenCalledTimes(1)
    expect(options().clientSecret).toBe('cs_fetched')
    expect('fetchClientSecret' in options()).toBe(false)
    expect(instances()[0]!.emitted('ready')).toHaveLength(1)
  })

  describe('a failing fetchClientSecret (#684)', () => {
    const errorSlot = {
      error: ({ error }: { error: string }) => h('p', { class: 'custom-error' }, error)
    }

    it.each([
      [
        'rejects',
        () => Promise.reject(new Error('[POST] "/api/checkout": 404 Page not found')),
        '[POST] "/api/checkout": 404 Page not found'
      ],
      [
        'resolves no client secret',
        () => Promise.resolve(undefined),
        'fetchClientSecret did not resolve to a client secret'
      ]
    ])('reports it through @error and #error when it %s', async (_, fetchClientSecret, message) => {
      const { stripe, instances } = await mountWith({ fetchClientSecret }, { slots: errorSlot })
      const component = instances()[0]!
      expect(stripe.createEmbeddedCheckoutPage).not.toHaveBeenCalled()
      expect(component.emitted('error')).toEqual([[message]])
      expect(component.emitted('ready')).toBeUndefined()
      expect(component.find('.custom-error').text()).toBe(message)
    })

    it('reports a session Stripe refuses (not ui_mode embedded_page)', async () => {
      const message =
        'Invalid Checkout session. Only Checkout sessions with ui_mode=embedded_page can be used with embedded Checkout.'
      const create = vi.fn(() => Promise.reject(new Error(message)))
      const { instances } = await mountWith(
        { fetchClientSecret: () => Promise.resolve('cs_elements_secret') },
        { create, slots: errorSlot }
      )
      const component = instances()[0]!
      expect(create.mock.calls[0]).toEqual([
        expect.objectContaining({ clientSecret: 'cs_elements_secret' })
      ])
      expect(component.emitted('error')).toEqual([[message]])
      expect(component.emitted('ready')).toBeUndefined()
      expect(component.find('.custom-error').text()).toBe(message)
    })

    it('creates nothing when unmounted while the secret is fetched, and frees the page slot', async () => {
      let resolve!: (secret: string) => void
      const fetchClientSecret = () => new Promise<string>((r) => (resolve = r))
      const { stripe, shown, instances } = await mountWith({ fetchClientSecret })
      shown.value = 0
      await flushPromises()
      resolve('cs_late')
      await flushPromises()
      expect(stripe.createEmbeddedCheckoutPage).not.toHaveBeenCalled()

      shown.value = 1
      await flushPromises()
      resolve('cs_next')
      await flushPromises()
      await flushPromises()
      expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledTimes(1)
      expect(instances()[0]!.emitted('error')).toBeUndefined()
    })
  })

  it('emits complete from onComplete and analytics from onAnalyticsEvent', async () => {
    const { instances, options } = await mountWith()
    options().onComplete!()
    const event = { eventType: 'checkoutSubmitted', details: {}, clientMetadata: {} }
    options().onAnalyticsEvent!(event)
    const component = instances()[0]!
    expect(component.emitted('complete')).toHaveLength(1)
    expect(component.emitted('analytics')?.[0]).toEqual([event])
  })

  it('forwards onLineItemsChange and returns its ResultAction', async () => {
    const onLineItemsChange = vi.fn(() => Promise.resolve({ type: 'accept' }))
    const { options } = await mountWith({ clientSecret: 'cs_x', onLineItemsChange })
    const event = { checkoutSessionId: 'cs_x', lineItems: [] }
    await expect(options().onLineItemsChange!(event)).resolves.toEqual({ type: 'accept' })
    expect(onLineItemsChange).toHaveBeenCalledWith(event)
  })

  it('omits onLineItemsChange and the deprecated onShippingDetailsChange when not given', async () => {
    const { options } = await mountWith()
    expect('onLineItemsChange' in options()).toBe(false)
    expect('onShippingDetailsChange' in options()).toBe(false)
  })

  it('reports an error when neither clientSecret nor fetchClientSecret is given', async () => {
    const { stripe, instances } = await mountWith(
      {},
      {
        slots: { error: ({ error }: { error: string }) => h('p', { class: 'custom-error' }, error) }
      }
    )
    expect(stripe.createEmbeddedCheckoutPage).not.toHaveBeenCalled()
    const component = instances()[0]!
    const message = component.emitted('error')?.[0]?.[0] as string
    expect(message).toContain('requires a `clientSecret` or `fetchClientSecret` prop')
    expect(component.find('.custom-error').text()).toBe(message)
  })

  it('shows the loading slot until the embedded page is created', async () => {
    let resolve!: (value: MockEmbeddedCheckout) => void
    const pending = new Promise<MockEmbeddedCheckout>((r) => (resolve = r))
    const embedded = makeEmbedded()
    const { instances } = await mountWith(undefined, {
      create: vi.fn(() => pending),
      slots: { loading: () => h('p', { class: 'custom-loading' }, 'Loading checkout') }
    })
    expect(instances()[0]!.find('.custom-loading').exists()).toBe(true)
    resolve(embedded)
    await flushPromises()
    expect(instances()[0]!.find('.custom-loading').exists()).toBe(false)
    expect(embedded.mount).toHaveBeenCalledTimes(1)
  })

  it('waits for Stripe.js when the provider context has no instance yet', async () => {
    const stripe = makeMockStripe()
    const current = shallowRef<ReturnType<typeof makeMockStripe> | null>(null)
    const Parent = defineComponent({
      setup() {
        provide(stripeInjectionKey, {
          stripe: current as never,
          loading: ref(true),
          error: ref(null)
        })
        return () => h(VueStripeEmbeddedCheckout, { clientSecret: 'cs_late' })
      }
    })
    mount(Parent)
    await flushPromises()
    expect(stripe.createEmbeddedCheckoutPage).not.toHaveBeenCalled()
    current.value = stripe
    await flushPromises()
    await flushPromises()
    expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledTimes(1)
  })

  it('destroys the embedded page on unmount', async () => {
    const { embedded, shown } = await mountWith()
    shown.value = 0
    await flushPromises()
    expect(embedded.destroy).toHaveBeenCalledTimes(1)
  })

  it('errors on a second concurrent instance (Stripe allows one per page)', async () => {
    const { stripe, instances } = await mountWith(undefined, { count: 2 })
    expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledTimes(1)
    // Vue does not promise the order sibling mounted hooks run in; exactly one wins.
    const errors = instances().map((c) => c.emitted('error')?.[0]?.[0] as string | undefined)
    const ready = instances().filter((c) => c.emitted('ready'))
    expect(ready).toHaveLength(1)
    expect(errors.filter(Boolean)).toEqual([
      expect.stringContaining('Only one VueStripeEmbeddedCheckout')
    ])
  })

  it('lets a new instance mount after the previous one is unmounted', async () => {
    const { stripe, shown } = await mountWith()
    shown.value = 0
    await flushPromises()
    shown.value = 1
    await flushPromises()
    await flushPromises()
    expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledTimes(2)
  })

  it('destroys a page that resolves after the component unmounted, and frees the slot', async () => {
    let resolve!: (value: MockEmbeddedCheckout) => void
    const create = vi.fn(() => new Promise<MockEmbeddedCheckout>((r) => (resolve = r)))
    const embedded = makeEmbedded()
    const { shown } = await mountWith(undefined, { create })
    shown.value = 0
    await flushPromises()
    resolve(embedded)
    await flushPromises()
    expect(embedded.mount).not.toHaveBeenCalled()
    expect(embedded.destroy).toHaveBeenCalledTimes(1)

    create.mockImplementation(() => Promise.resolve(makeEmbedded()))
    shown.value = 1
    await flushPromises()
    await flushPromises()
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('reports a rejected createEmbeddedCheckoutPage and frees the slot', async () => {
    const create = vi.fn(() => Promise.reject(new Error('Invalid client secret')))
    const { instances, shown } = await mountWith(undefined, { create })
    expect(instances()[0]!.emitted('error')?.[0]).toEqual(['Invalid client secret'])
    expect(instances()[0]!.find('.vue-stripe-embedded-checkout-error').exists()).toBe(true)

    create.mockImplementation(() => Promise.resolve(makeEmbedded()))
    shown.value = 0
    await flushPromises()
    shown.value = 1
    await flushPromises()
    await flushPromises()
    expect(create).toHaveBeenCalledTimes(2)
    expect(instances()[0]!.emitted('error')).toBeUndefined()
  })
})
