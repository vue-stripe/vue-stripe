import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, h, inject, ref, toRaw, type App } from 'vue-demi'
import { mount } from '@vue/test-utils'
import { createVueStripe } from '../src/plugin'
import {
  stripeConfigInjectionKey,
  stripeInjectionKey,
  type StripeInstance,
  type VueStripeConfig
} from '../src/utils/injection-keys'
import VueStripePricingTable from '../src/components/VueStripePricingTable'
import type { VueStripeOptions } from '../src/types'
import { useStripe } from '../src/composables/useStripe'
import VueStripeCheckoutElementsProvider from '../src/components/VueStripeCheckoutElementsProvider'
import VueStripeElements from '../src/components/VueStripeElements'
import VueStripePaymentElement from '../src/components/VueStripePaymentElement'
import VueStripeProvider from '../src/components/VueStripeProvider'
import { flushPromises, makeMockStripe, type MockStripe, type MockStripeElements } from './setup'
import { useRadarSession } from '../src/composables/useRadarSession'
import { usePaymentIntent } from '../src/composables/usePaymentIntent'
import { useFinancialConnections } from '../src/composables/useFinancialConnections'
import { whenStripeLoaded } from '../src/utils/inject-stripe'
import { useSetupIntent } from '../src/composables/useSetupIntent'
import { useCreatePaymentMethod } from '../src/composables/useCreatePaymentMethod'
import { useHandleNextAction } from '../src/composables/useHandleNextAction'
import { useIdentity } from '../src/composables/useIdentity'

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

describe('createVueStripe as a global provider (#424)', () => {
  const StripeConsumer = defineComponent({
    setup() {
      return { ctx: useStripe(), config: inject(stripeConfigInjectionKey) }
    },
    render: () => h('div', 'consumer')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not load Stripe.js at install time', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const app = createApp({ render: () => h('div') })
    app.use(createVueStripe({ publishableKey: 'pk_test_123' }))
    app.mount(document.createElement('div'))
    await flushPromises()

    expect(loadStripe).not.toHaveBeenCalled()
    app.unmount()
  })

  it('resolves useStripe() under the plugin alone, without VueStripeProvider', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const wrapper = mount(StripeConsumer, {
      global: {
        plugins: [
          createVueStripe({
            publishableKey: 'pk_test_123',
            stripeAccount: 'acct_123',
            apiVersion: '2023-10-16',
            locale: 'fr'
          })
        ]
      }
    })
    const { stripe, loading, error } = wrapper.vm.ctx
    expect(loading.value).toBe(true)

    await flushPromises()

    expect(loadStripe).toHaveBeenCalledTimes(1)
    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {
      stripeAccount: 'acct_123',
      apiVersion: '2023-10-16',
      locale: 'fr'
    })
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(stripe.value).not.toBeNull()
    expect(stripe.value?.registerAppInfo).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'vue-stripe' })
    )
  })

  it('forwards developerTools and advancedFraudSignals to the loader', async () => {
    const { loadStripe } = vi.mocked(await import('@stripe/stripe-js/pure'))
    const wrapper = mount(StripeConsumer, {
      global: {
        plugins: [
          createVueStripe({
            publishableKey: 'pk_test_123',
            developerTools: { assistant: { enabled: false } },
            advancedFraudSignals: false
          })
        ]
      }
    })
    expect(wrapper.vm.ctx.loading.value).toBe(true)
    await flushPromises()

    expect(loadStripe.setLoadParameters).toHaveBeenCalledWith({ advancedFraudSignals: false })
    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {
      developerTools: { assistant: { enabled: false } }
    })
    expect(loadStripe.setLoadParameters.mock.invocationCallOrder[0]).toBeLessThan(
      loadStripe.mock.invocationCallOrder[0] ?? 0
    )
  })

  it('loads Stripe once for every consumer in the app', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const wrapper = mount(
      { render: () => h('div', [h(StripeConsumer), h(StripeConsumer)]) },
      { global: { plugins: [createVueStripe({ publishableKey: 'pk_test_123' })] } }
    )
    await flushPromises()

    const [first, second] = wrapper.findAllComponents(StripeConsumer)
    expect(loadStripe).toHaveBeenCalledTimes(1)
    expect(first?.vm.ctx.stripe.value).toBe(second?.vm.ctx.stripe.value)
  })

  it('mounts VueStripeElements and an element without VueStripeProvider', async () => {
    const wrapper = mount(VueStripeElements, {
      props: { clientSecret: 'pi_123_secret_456' },
      slots: { default: () => h(VueStripePaymentElement) },
      global: { plugins: [createVueStripe({ publishableKey: 'pk_test_123' })] }
    })
    await flushPromises()
    await flushPromises()

    const element = wrapper.findComponent(VueStripePaymentElement)
    expect(element.exists()).toBe(true)
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const stripe = (await vi.mocked(loadStripe).mock.results[0]?.value) as MockStripe
    expect(stripe.elements).toHaveBeenCalledWith(
      expect.objectContaining({ clientSecret: 'pi_123_secret_456' })
    )
    const elements = stripe.elements.mock.results[0]?.value as MockStripeElements
    expect(elements.create).toHaveBeenCalledWith('payment', expect.anything())
  })

  it('lets a nested VueStripeProvider win over the plugin', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_provider' },
      slots: { default: () => h(StripeConsumer) },
      global: { plugins: [createVueStripe({ publishableKey: 'pk_test_plugin' })] }
    })
    await flushPromises()

    expect(loadStripe).toHaveBeenCalledTimes(1)
    expect(loadStripe).toHaveBeenCalledWith('pk_test_provider', {})
    const consumer = wrapper.findComponent(StripeConsumer)
    expect(toRaw(consumer.vm.ctx.stripe.value)).toBe(
      await vi.mocked(loadStripe).mock.results[0]?.value
    )
    expect(consumer.vm.config.publishableKey).toBe('pk_test_provider')
  })

  it('reports a load failure through the error ref', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockRejectedValueOnce(new Error('Network error'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(StripeConsumer, {
      global: { plugins: [createVueStripe({ publishableKey: 'pk_test_123' })] }
    })
    await flushPromises()

    expect(wrapper.vm.ctx.error.value).toBe('Network error')
    expect(wrapper.vm.ctx.loading.value).toBe(false)
    expect(wrapper.vm.ctx.stripe.value).toBeNull()
    expect(consoleError).toHaveBeenCalledWith('[Vue Stripe] Initialization error:', 'Network error')
    consoleError.mockRestore()
  })

  it('shows a plugin load failure in VueStripeElements and the Checkout provider', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockRejectedValueOnce(new Error('Network error'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(
      {
        render: () =>
          h('div', [
            h(VueStripeElements, { clientSecret: 'pi_123_secret_456' }),
            h(VueStripeCheckoutElementsProvider, { clientSecret: 'cs_123_secret_456' })
          ])
      },
      { global: { plugins: [createVueStripe({ publishableKey: 'pk_test_123' })] } }
    )
    await flushPromises()

    expect(wrapper.find('.vue-stripe-elements-error').text()).toBe('Network error')
    expect(wrapper.find('.vue-stripe-checkout-error').text()).toBe('Network error')
    consoleError.mockRestore()
  })

  it('reports loadStripe resolving null as an error', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    vi.mocked(loadStripe).mockResolvedValueOnce(null)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(StripeConsumer, {
      global: { plugins: [createVueStripe({ publishableKey: 'pk_test_123' })] }
    })
    await flushPromises()

    expect(wrapper.vm.ctx.error.value).toBe('Failed to initialize Stripe')
    consoleError.mockRestore()
  })
})

describe('createVueStripe lazy loading', () => {
  const installInto = () => {
    const provided = new Map<unknown, unknown>()
    const app = { provide: (key: unknown, value: unknown) => provided.set(key, value) }
    createVueStripe({ publishableKey: 'pk_test_123' }).install?.(app as unknown as App)
    return provided.get(stripeInjectionKey) as StripeInstance
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('never loads Stripe.js on the server, and loads once in the browser', async () => {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const instance = installInto()

    vi.stubGlobal('window', undefined)
    expect(instance.loading.value).toBe(true)
    expect(loadStripe).not.toHaveBeenCalled()
    vi.unstubAllGlobals()

    void instance.error
    void instance.stripe
    expect(loadStripe).toHaveBeenCalledTimes(1)
  })
})

describe('createVueStripe: composables without a provider (#565)', () => {
  const withStripe = async () => {
    const { loadStripe } = vi.mocked(await import('@stripe/stripe-js/pure'))
    const stripe = {
      ...makeMockStripe(),
      createRadarSession: vi.fn(() => Promise.resolve({ radarSession: { id: 'rse_123' } })),
      retrievePaymentIntent: vi.fn(() =>
        Promise.resolve({ paymentIntent: { id: 'pi_123', status: 'succeeded' } })
      ),
      collectBankAccountForSetup: vi.fn(() => Promise.resolve({ setupIntent: { id: 'seti_1' } })),
      retrieveSetupIntent: vi.fn(() => Promise.resolve({ setupIntent: { id: 'seti_2' } })),
      createPaymentMethod: vi.fn(() => Promise.resolve({ paymentMethod: { id: 'pm_1' } })),
      handleNextAction: vi.fn(() => Promise.resolve({ paymentIntent: { id: 'pi_2' } })),
      verifyIdentity: vi.fn(() => Promise.resolve({ verificationSession: { id: 'vs_1' } }))
    }
    loadStripe.mockResolvedValueOnce(stripe as never)
    return { loadStripe, stripe }
  }

  const mountConsumer = () => {
    const api: {
      radar?: ReturnType<typeof useRadarSession>
      intent?: ReturnType<typeof usePaymentIntent>
      bank?: ReturnType<typeof useFinancialConnections>
      setup?: ReturnType<typeof useSetupIntent>
      method?: ReturnType<typeof useCreatePaymentMethod>
      next?: ReturnType<typeof useHandleNextAction>
      identity?: ReturnType<typeof useIdentity>
    } = {}
    const Consumer = defineComponent({
      setup() {
        api.radar = useRadarSession()
        api.intent = usePaymentIntent()
        api.bank = useFinancialConnections()
        api.setup = useSetupIntent()
        api.method = useCreatePaymentMethod()
        api.next = useHandleNextAction()
        api.identity = useIdentity()
        return () => h('div')
      }
    })
    mount(Consumer, { global: { plugins: [createVueStripe({ publishableKey: 'pk_test_123' })] } })
    return api
  }

  beforeEach(() => vi.clearAllMocks())

  it('starts loading Stripe.js when a composable reads the context in setup()', async () => {
    const { loadStripe } = await withStripe()
    mountConsumer()
    expect(loadStripe).toHaveBeenCalledTimes(1)
    await flushPromises()
  })

  it('waits for the load in progress instead of failing the first call', async () => {
    const { stripe } = await withStripe()
    const api = mountConsumer()
    const radar = api.radar!.createRadarSession()
    const intent = api.intent!.retrievePaymentIntent('pi_123_secret_456')
    const bank = api.bank!.collectBankAccountForSetup({ clientSecret: 'seti_1_secret_2' } as never)
    await expect(radar).resolves.toEqual({ radarSession: { id: 'rse_123' } })
    await expect(intent).resolves.toEqual({ paymentIntent: { id: 'pi_123', status: 'succeeded' } })
    await expect(bank).resolves.toEqual({ setupIntent: { id: 'seti_1' } })
    expect(stripe.createRadarSession).toHaveBeenCalledTimes(1)
    expect(api.intent!.error.value).toBe(null)
  })

  it('waits for the load in every composable method', async () => {
    const { stripe } = await withStripe()
    const api = mountConsumer()
    const calls = [
      api.intent!.confirmPayment({ clientSecret: 'pi_1_secret_2', skipSubmit: true }),
      api.setup!.confirmSetup({ clientSecret: 'seti_1_secret_2', skipSubmit: true }),
      api.setup!.retrieveSetupIntent('seti_1_secret_2'),
      api.method!.createPaymentMethod({ type: 'card' } as never),
      api.next!.handleNextAction({ clientSecret: 'pi_1_secret_2' }),
      api.identity!.verifyIdentity('vs_1_secret_2')
    ]
    const results = await Promise.all(calls)
    expect(results.every((result) => !('error' in result) || !result.error)).toBe(true)
    expect(stripe.confirmPayment).toHaveBeenCalledTimes(1)
    expect(stripe.confirmSetup).toHaveBeenCalledTimes(1)
    expect(stripe.retrieveSetupIntent).toHaveBeenCalledTimes(1)
    expect(stripe.createPaymentMethod).toHaveBeenCalledTimes(1)
    expect(stripe.handleNextAction).toHaveBeenCalledTimes(1)
    expect(stripe.verifyIdentity).toHaveBeenCalledTimes(1)
  })

  it('does not wait on the server, where the plugin never loads', async () => {
    const instance = { stripe: ref(null), loading: ref(true), error: ref(null) }
    vi.stubGlobal('window', undefined)
    const result = whenStripeLoaded(instance)
    vi.unstubAllGlobals()
    await expect(result).resolves.toBe(null)
  })

  it('reports a failed load to a waiting call', async () => {
    const { loadStripe } = vi.mocked(await import('@stripe/stripe-js/pure'))
    loadStripe.mockRejectedValueOnce(new Error('Failed to load Stripe.js'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const api = mountConsumer()
    await expect(api.radar!.createRadarSession()).rejects.toThrow('Stripe.js is not loaded yet')
    await expect(api.intent!.retrievePaymentIntent('pi_1_secret_2')).resolves.toEqual({
      error: { message: 'Stripe not initialized' }
    })
    consoleError.mockRestore()
  })
})
