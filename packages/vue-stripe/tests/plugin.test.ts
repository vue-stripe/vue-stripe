import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h, inject } from 'vue-demi'
import { createVueStripe } from '../src/plugin'
import type { VueStripeOptions } from '../src/types'

// Mock loadStripe
const mockStripe = {
  elements: vi.fn(),
  confirmPayment: vi.fn(),
  registerAppInfo: vi.fn()
}

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe))
}))

describe('createVueStripe Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a valid Vue plugin', () => {
    const plugin = createVueStripe({
      publishableKey: 'pk_test_123'
    })

    expect(plugin).toHaveProperty('install')
    expect(typeof plugin.install).toBe('function')
  })

  it('should provide vue-stripe-config to the app', async () => {
    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123',
      stripeAccount: 'acct_123',
      locale: 'en'
    }

    let injectedConfig: VueStripeOptions | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedConfig = inject('vue-stripe-config')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    expect(injectedConfig).toEqual(options)

    app.unmount()
  })

  it('should provide vue-stripe-global with lazy stripe instance', async () => {
    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    expect(injectedGlobal).toBeDefined()
    expect(injectedGlobal).toHaveProperty('stripe')

    app.unmount()
  })

  it('should lazy load stripe only when accessed', async () => {
    const { loadStripe } = await import('@stripe/stripe-js')

    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Stripe should not be loaded yet
    expect(loadStripe).not.toHaveBeenCalled()

    // Access stripe to trigger lazy loading
    const stripePromise = injectedGlobal?.stripe
    expect(stripePromise).toBeInstanceOf(Promise)

    // Now loadStripe should have been called
    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {})

    app.unmount()
  })

  it('should pass stripeAccount option to loadStripe', async () => {
    const { loadStripe } = await import('@stripe/stripe-js')

    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123',
      stripeAccount: 'acct_123'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Trigger lazy loading
    injectedGlobal?.stripe

    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {
      stripeAccount: 'acct_123'
    })

    app.unmount()
  })

  it('should pass apiVersion option to loadStripe', async () => {
    const { loadStripe } = await import('@stripe/stripe-js')

    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123',
      apiVersion: '2023-10-16'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Trigger lazy loading
    injectedGlobal?.stripe

    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {
      apiVersion: '2023-10-16'
    })

    app.unmount()
  })

  it('should pass locale option to loadStripe', async () => {
    const { loadStripe } = await import('@stripe/stripe-js')

    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123',
      locale: 'fr'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Trigger lazy loading
    injectedGlobal?.stripe

    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {
      locale: 'fr'
    })

    app.unmount()
  })

  it('should pass all options to loadStripe', async () => {
    const { loadStripe } = await import('@stripe/stripe-js')

    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123',
      stripeAccount: 'acct_123',
      apiVersion: '2023-10-16',
      locale: 'de'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Trigger lazy loading
    injectedGlobal?.stripe

    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {
      stripeAccount: 'acct_123',
      apiVersion: '2023-10-16',
      locale: 'de'
    })

    app.unmount()
  })

  it('should only load stripe once (singleton pattern)', async () => {
    const { loadStripe } = await import('@stripe/stripe-js')

    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Access stripe multiple times
    const stripe1 = injectedGlobal?.stripe
    const stripe2 = injectedGlobal?.stripe
    const stripe3 = injectedGlobal?.stripe

    // Should be the same promise instance
    expect(stripe1).toBe(stripe2)
    expect(stripe2).toBe(stripe3)

    // loadStripe should only be called once
    expect(loadStripe).toHaveBeenCalledTimes(1)

    app.unmount()
  })

  it('should register app info after loading stripe', async () => {
    const options: VueStripeOptions = {
      publishableKey: 'pk_test_123'
    }

    let injectedGlobal: { stripe: Promise<typeof mockStripe | null> } | undefined

    const TestComponent = defineComponent({
      setup() {
        injectedGlobal = inject('vue-stripe-global')
        return () => h('div', 'Test')
      }
    })

    const app = createApp(TestComponent)
    app.use(createVueStripe(options))

    const container = document.createElement('div')
    app.mount(container)

    // Trigger lazy loading and wait for it
    const stripe = await injectedGlobal?.stripe

    expect(stripe).toBeDefined()
    expect(mockStripe.registerAppInfo).toHaveBeenCalled()

    app.unmount()
  })

  it('should export default as createVueStripe', async () => {
    const defaultExport = (await import('../src/plugin')).default
    expect(defaultExport).toBe(createVueStripe)
  })
})
