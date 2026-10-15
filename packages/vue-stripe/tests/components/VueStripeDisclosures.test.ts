import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref, type Component } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeFinancialAccountDisclosure from '../../src/components/VueStripeFinancialAccountDisclosure'
import VueStripeIssuingDisclosure from '../../src/components/VueStripeIssuingDisclosure'
import VueStripeTreasuryDisclosure from '../../src/components/VueStripeTreasuryDisclosure'
import { VueStripeProviderError } from '../../src/utils/errors'
import { flushPromises, makeMockStripe } from '../setup'

// The React Stripe.js 7 disclosures call an (untyped) Stripe.js method and append the
// returned `htmlElement`; the Vue ports do the same.
const CASES: Array<[string, Component, string, string, Record<string, string>]> = [
  [
    'VueStripeFinancialAccountDisclosure',
    VueStripeFinancialAccountDisclosure,
    'createFinancialAccountDisclosure',
    'financial-account',
    { businessName: 'Rocket Rides', learnMoreLink: 'https://example.com/learn' }
  ],
  [
    'VueStripeIssuingDisclosure',
    VueStripeIssuingDisclosure,
    'createIssuingDisclosure',
    'issuing',
    {
      issuingProgramID: 'iprg_123',
      publicCardProgramName: 'Rocket Card',
      learnMoreLink: 'https://example.com/learn'
    }
  ],
  [
    'VueStripeTreasuryDisclosure',
    VueStripeTreasuryDisclosure,
    'createTreasuryDisclosure',
    'treasury',
    { businessName: 'Rocket Rides', learnMoreLink: 'https://example.com/learn' }
  ]
]

const legalText = (text: string) => {
  const el = document.createElement('p')
  el.className = 'stripe-disclosure-content'
  el.textContent = text
  return el
}

function stripeWith(method: string, impl: (...args: unknown[]) => unknown) {
  return { ...makeMockStripe(), [method]: vi.fn(impl) } as ReturnType<typeof makeMockStripe> &
    Record<string, ReturnType<typeof vi.fn>>
}

/** Mount `Disclosure` with a `stripe` prop (no provider). */
async function mountWithProp(Disclosure: Component, props: Record<string, unknown>) {
  const wrapper = mount(Disclosure, { props })
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe.each(CASES)('%s', (name, Disclosure, method, slug, options) => {
  beforeEach(() => vi.clearAllMocks())

  it(`calls stripe.${method}() with the options and renders the returned content`, async () => {
    const stripe = stripeWith(method, () =>
      Promise.resolve({ htmlElement: legalText('Legal text') })
    )
    const wrapper = await mountWithProp(Disclosure, { stripe, options })
    expect(stripe[method]).toHaveBeenCalledWith(options)
    expect(stripe[method]!.mock.contexts[0]).toBe(stripe)
    const mountPoint = wrapper.find(`.vue-stripe-${slug}-disclosure-mount`)
    expect(mountPoint.find('.stripe-disclosure-content').text()).toBe('Legal text')
    expect(wrapper.emitted('load')).toEqual([[]])
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.find(`.vue-stripe-${slug}-disclosure-loader`).exists()).toBe(false)
  })

  it('passes every option key, undefined when not set (like React Stripe.js)', async () => {
    const stripe = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('x') }))
    await mountWithProp(Disclosure, { stripe })
    const expected = Object.fromEntries(Object.keys(options).map((key) => [key, undefined]))
    expect(stripe[method]).toHaveBeenCalledWith(expected)
  })

  it('uses the Stripe instance from VueStripeProvider when no stripe prop is given', async () => {
    const stripe = stripeWith(method, () =>
      Promise.resolve({ htmlElement: legalText('From provider') })
    )
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)
    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h(Disclosure, { options }) }
    })
    await flushPromises()
    await flushPromises()
    expect(stripe[method]).toHaveBeenCalledWith(options)
    expect(wrapper.text()).toContain('From provider')
  })

  it('accepts a Promise for the stripe prop (React parity)', async () => {
    const stripe = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('Async') }))
    const wrapper = await mountWithProp(Disclosure, { stripe: Promise.resolve(stripe) })
    expect(wrapper.text()).toContain('Async')
  })

  it('renders nothing and calls nothing while the stripe prop is null', async () => {
    const wrapper = await mountWithProp(Disclosure, { stripe: null })
    expect(wrapper.emitted('load')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
  })

  it('emits error with the Stripe error, shows its message and logs it (#761)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = { type: 'invalid_request_error', message: 'Not enabled for this account' }
    const stripe = stripeWith(method, () => Promise.resolve({ error }))
    const wrapper = await mountWithProp(Disclosure, { stripe })
    expect(wrapper.emitted('error')).toEqual([[error]])
    expect(wrapper.emitted('load')).toBeUndefined()
    expect(wrapper.find(`.vue-stripe-${slug}-disclosure-error`).text()).toContain(
      'Not enabled for this account'
    )
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      `[Vue Stripe] ${name} error:`,
      'Not enabled for this account'
    )
    consoleError.mockRestore()
  })

  it('reports a rejected call as an error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stripe = stripeWith(method, () => Promise.reject(new Error('Network down')))
    const wrapper = await mountWithProp(Disclosure, { stripe })
    expect(wrapper.emitted('error')).toEqual([[{ message: 'Network down' }]])
    expect(wrapper.text()).toContain('Network down')
    expect(consoleError).toHaveBeenCalledWith(`[Vue Stripe] ${name} error:`, 'Network down')
    consoleError.mockRestore()
  })

  it('reports a non-Error rejection and a Stripe error without a message', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rejecting = stripeWith(method, () => Promise.reject('offline'))
    const first = await mountWithProp(Disclosure, { stripe: rejecting })
    expect(first.emitted('error')).toEqual([[{ message: 'offline' }]])

    const silent = stripeWith(method, () => Promise.resolve({ error: { type: 'api_error' } }))
    const second = await mountWithProp(Disclosure, { stripe: silent })
    expect(second.text()).toContain(`${name} failed to load`)
    expect(consoleError).toHaveBeenLastCalledWith(
      `[Vue Stripe] ${name} error:`,
      `${name} failed to load`
    )
    consoleError.mockRestore()
  })

  // #774: a rejected `stripe` promise (loadStripe() with Stripe.js blocked) was an uncaught
  // error plus Vue's "Unhandled error during execution of watcher getter", on a loader for good.
  describe('a stripe prop promise that rejects (#774)', () => {
    const rejected = () => Promise.reject(new Error('Failed to load Stripe.js'))

    it('emits @error with { message }, ends loading and stays out of the console', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await mountWithProp(Disclosure, { stripe: rejected(), onError: () => {} })
      expect(wrapper.emitted('error')).toEqual([[{ message: 'Failed to load Stripe.js' }]])
      expect(wrapper.find(`.vue-stripe-${slug}-disclosure-error`).text()).toBe(
        'Failed to load Stripe.js'
      )
      expect(wrapper.find(`.vue-stripe-${slug}-disclosure-loader`).exists()).toBe(false)
      expect((wrapper.vm as unknown as { loading: boolean }).loading).toBe(false)
      expect(consoleError).not.toHaveBeenCalled()
      expect(consoleWarn).not.toHaveBeenCalled()
      consoleError.mockRestore()
      consoleWarn.mockRestore()
    })

    it('logs one [Vue Stripe] error when nothing handles it', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await mountWithProp(Disclosure, { stripe: rejected() })
      expect(consoleError).toHaveBeenCalledTimes(1)
      expect(consoleError).toHaveBeenCalledWith(
        `[Vue Stripe] ${name} error:`,
        'Failed to load Stripe.js'
      )
      expect(consoleWarn).not.toHaveBeenCalled()
      consoleError.mockRestore()
      consoleWarn.mockRestore()
    })

    it('renders the #error slot for a promise set after mount', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = mount(Disclosure, {
        props: { stripe: null },
        slots: { error: ({ error }: { error: string }) => h('p', `slot: ${error}`) }
      })
      await flushPromises()
      await wrapper.setProps({ stripe: rejected() })
      await flushPromises()
      await flushPromises()
      expect(wrapper.text()).toBe('slot: Failed to load Stripe.js')
      expect(consoleWarn).not.toHaveBeenCalled()
      consoleWarn.mockRestore()
    })

    it('ignores an instance that resolves after a newer stripe prop', async () => {
      let resolveFirst!: (stripe: unknown) => void
      const first = new Promise((resolve) => (resolveFirst = resolve))
      const stale = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('Stale') }))
      const fresh = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('Fresh') }))
      const wrapper = await mountWithProp(Disclosure, { stripe: first })
      await wrapper.setProps({ stripe: fresh })
      await flushPromises()
      resolveFirst(stale)
      await flushPromises()
      expect(stale[method]).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Fresh')
    })

    it('ignores a rejection that arrives after a newer stripe prop', async () => {
      let rejectFirst!: (err: Error) => void
      const first = new Promise<never>((_resolve, reject) => (rejectFirst = reject))
      const stripe = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('Fresh') }))
      const wrapper = await mountWithProp(Disclosure, { stripe: first })
      await wrapper.setProps({ stripe })
      await flushPromises()
      rejectFirst(new Error('Stale failure'))
      await flushPromises()
      expect(wrapper.emitted('error')).toBeUndefined()
      expect(wrapper.text()).toContain('Fresh')
    })
  })

  it('ignores a rejection that arrives after a newer request', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const pending: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []
    const stripe = stripeWith(
      method,
      () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
    )
    const wrapper = await mountWithProp(Disclosure, { stripe, options })
    await wrapper.setProps({ options: { ...options, learnMoreLink: 'https://example.com/v2' } })
    await flushPromises()
    pending[0]!.reject(new Error('Stale failure'))
    pending[1]!.resolve({ htmlElement: legalText('Fresh') })
    await flushPromises()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.text()).toContain('Fresh')
    consoleError.mockRestore()
  })

  it(`reports a Stripe.js build without stripe.${method}()`, async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountWithProp(Disclosure, { stripe: makeMockStripe() })
    const message = `stripe.${method}() is not available in this Stripe.js version`
    expect(wrapper.emitted('error')).toEqual([[{ message }]])
    consoleError.mockRestore()
  })

  it('re-creates the disclosure when the options change', async () => {
    let n = 0
    const stripe = stripeWith(method, () =>
      Promise.resolve({ htmlElement: legalText(`Version ${++n}`) })
    )
    const wrapper = await mountWithProp(Disclosure, { stripe, options })
    await wrapper.setProps({ options: { ...options, learnMoreLink: 'https://example.com/v2' } })
    await flushPromises()
    expect(stripe[method]).toHaveBeenCalledTimes(2)
    expect(stripe[method]).toHaveBeenLastCalledWith({
      ...options,
      learnMoreLink: 'https://example.com/v2'
    })
    expect(wrapper.findAll('.stripe-disclosure-content')).toHaveLength(1)
    expect(wrapper.text()).toContain('Version 2')
    expect(wrapper.text()).not.toContain('Version 1')
  })

  it('does not reload for an inline options object on a parent re-render', async () => {
    const stripe = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('x') }))
    const tick = ref(0)
    const host = mount({
      render: () => h('div', [h(Disclosure, { stripe, options: { ...options } }), `${tick.value}`])
    })
    await flushPromises()
    tick.value++
    await flushPromises()
    expect(host.text()).toContain('1')
    expect(stripe[method]).toHaveBeenCalledTimes(1)
  })

  it('ignores a result that arrives after a newer request or after unmount', async () => {
    const resolvers: Array<(value: unknown) => void> = []
    const stripe = stripeWith(method, () => new Promise((resolve) => resolvers.push(resolve)))
    const wrapper = await mountWithProp(Disclosure, { stripe, options })
    await wrapper.setProps({ options: { ...options, learnMoreLink: 'https://example.com/v2' } })
    await flushPromises()
    resolvers[1]!({ htmlElement: legalText('Newer') })
    await flushPromises()
    resolvers[0]!({ htmlElement: legalText('Stale') })
    await flushPromises()
    expect(wrapper.text()).toContain('Newer')
    expect(wrapper.text()).not.toContain('Stale')
    expect(wrapper.emitted('load')).toHaveLength(1)

    const show = ref(true)
    const host = mount({ render: () => (show.value ? h(Disclosure, { stripe, options }) : null) })
    await flushPromises()
    show.value = false
    await flushPromises()
    resolvers[2]!({ htmlElement: legalText('Late') })
    await flushPromises()
    expect(host.text()).not.toContain('Late')
  })

  it('exposes loading and error', async () => {
    const stripe = stripeWith(method, () => Promise.resolve({ htmlElement: legalText('x') }))
    const wrapper = await mountWithProp(Disclosure, { stripe })
    const vm = wrapper.vm as unknown as { loading: boolean; error: string | null }
    expect(vm.loading).toBe(false)
    expect(vm.error).toBeNull()
  })

  it('throws VueStripeProviderError without a stripe prop or a VueStripeProvider', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(Disclosure)).toThrow(VueStripeProviderError)
    consoleWarn.mockRestore()
  })
})
