import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, inject } from 'vue-demi'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises } from '../setup'

describe('VueStripeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: '<div>Payment Form</div>',
        loading: '<div>Custom Loading</div>'
      }
    })

    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Loading')
  })

  it('should render default content after successful load', async () => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      },
      slots: {
        default: '<div>Payment Form</div>'
      }
    })

    // Wait for loading to complete
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(false)
    expect(wrapper.text()).toContain('Payment Form')
  })

  it('should render error state when Stripe fails to load', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      },
      slots: {
        default: '<div>Payment Form</div>',
        error: '<div>Custom Error</div>'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.vue-stripe-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Error')
  })

  it('should pass correct options to loadStripe', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123',
        stripeAccount: 'acct_123',
        locale: 'en-US'
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123', {
      stripeAccount: 'acct_123',
      locale: 'en-US'
    })
  })

  it('drops apiVersion (prop or options), which versioned Stripe.js refuses, with one warning (#597)', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount({
      render: () =>
        h('div', [
          h(VueStripeProvider, { publishableKey: 'pk_test_prop', apiVersion: '2026-09-30.endive' }),
          h(VueStripeProvider, {
            publishableKey: 'pk_test_options',
            options: { apiVersion: '2020-08-27', locale: 'fr' }
          })
        ])
    })
    await flushPromises()

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_prop', {})
    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_options', { locale: 'fr' })
    expect(wrapper.findAll('.vue-stripe-error')).toHaveLength(0)
    const notices = warn.mock.calls.filter(([m]) => /^\[Vue Stripe\] apiVersion/.test(String(m)))
    expect(notices).toHaveLength(1)
    warn.mockRestore()
  })

  it('reuses the Stripe instance when a provider with the same arguments remounts (#618)', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    const props = { publishableKey: 'pk_test_123', locale: 'fr' }

    const first = mount(VueStripeProvider, { props })
    await flushPromises()
    const instance = first.emitted('load')![0]![0]
    first.unmount()

    const second = mount(VueStripeProvider, { props })
    await flushPromises()
    expect(second.emitted('load')![0]![0]).toBe(instance)
    expect(mockLoadStripe).toHaveBeenCalledTimes(1)

    // Different options are a different instance.
    const third = mount(VueStripeProvider, { props: { ...props, locale: 'de' } })
    await flushPromises()
    expect(third.emitted('load')![0]![0]).not.toBe(instance)
    expect(mockLoadStripe).toHaveBeenCalledTimes(2)
  })

  it('forwards every StripeConstructorOptions key in `options`, explicit props winning', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123',
        locale: 'fr',
        options: { locale: 'de', developerTools: { assistant: { enabled: false } } }
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123', {
      locale: 'fr',
      developerTools: { assistant: { enabled: false } }
    })
  })

  it('forwards the betas prop to loadStripe (required by the Tax ID element)', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe

    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123', betas: ['custom_checkout_tax_id_1'] }
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123', {
      betas: ['custom_checkout_tax_id_1']
    })
  })

  it('forwards the developerTools prop to loadStripe, winning over options', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe

    mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123',
        developerTools: { assistant: { enabled: false } },
        options: { developerTools: { assistant: { enabled: true } } }
      }
    })

    await flushPromises()

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123', {
      developerTools: { assistant: { enabled: false } }
    })
  })

  it('leaves the Stripe.js load parameters alone by default', async () => {
    const { loadStripe } = vi.mocked(await import('@stripe/stripe-js/pure'))

    mount(VueStripeProvider, { props: { publishableKey: 'pk_test_123' } })
    await flushPromises()

    expect(loadStripe).toHaveBeenCalledTimes(1)
    expect(loadStripe.setLoadParameters).not.toHaveBeenCalled()
  })

  it('with advancedFraudSignals false, sets the load parameters before loading Stripe.js', async () => {
    const { loadStripe } = vi.mocked(await import('@stripe/stripe-js/pure'))

    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123', advancedFraudSignals: false },
      slots: { default: '<div>Payment Form</div>' }
    })
    await flushPromises()

    expect(loadStripe.setLoadParameters).toHaveBeenCalledWith({ advancedFraudSignals: false })
    expect(loadStripe).toHaveBeenCalledWith('pk_test_123', {})
    expect(loadStripe.setLoadParameters.mock.invocationCallOrder[0]).toBeLessThan(
      loadStripe.mock.invocationCallOrder[0] ?? 0
    )
    expect(wrapper.text()).toContain('Payment Form')
  })

  it('warns and still loads when Stripe.js already started loading with fraud signals on', async () => {
    const { loadStripe } = vi.mocked(await import('@stripe/stripe-js/pure'))
    loadStripe.setLoadParameters.mockImplementationOnce(() => {
      throw new Error('You cannot change load parameters after calling loadStripe')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123', advancedFraudSignals: false },
      slots: { default: '<div>Payment Form</div>' }
    })
    await flushPromises()

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^\[Vue Stripe\] advancedFraudSignals: false was ignored/)
    )
    expect(loadStripe).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Payment Form')
    warn.mockRestore()
  })

  // === New Tests ===

  it('should emit load event with Stripe instance', async () => {
    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_123'
      }
    })

    await flushPromises()

    const emitted = wrapper.emitted('load')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBeDefined() // Stripe instance
  })

  it('should emit error event when loading fails', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      }
    })

    await flushPromises()

    const emitted = wrapper.emitted('error')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBeInstanceOf(Error)
  })

  it('should provide stripe context to child components', async () => {
    let injectedContext: ReturnType<typeof inject<any>> = null

    const ChildComponent = {
      setup() {
        injectedContext = inject(stripeInjectionKey)
        return () => h('div', 'Child')
      }
    }

    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () => h(ChildComponent)
      }
    })

    await flushPromises()

    expect(injectedContext).toBeDefined()
    expect(injectedContext!.stripe.value).toBeDefined()
    expect(injectedContext!.loading.value).toBe(false)
    expect(injectedContext!.error.value).toBe(null)
  })

  it('should accept stripeKey prop for backwards compatibility', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe

    const wrapper = mount(VueStripeProvider, {
      props: {
        stripeKey: 'pk_test_legacy'
      },
      slots: {
        default: '<div>Payment Form</div>'
      }
    })

    await flushPromises()

    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_legacy', expect.any(Object))
    expect(wrapper.find('.vue-stripe-loading').exists()).toBe(false)
  })

  it('should pass error message to error slot scope', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    mockLoadStripe.mockRejectedValueOnce(new Error('Custom error message'))

    const wrapper = mount(VueStripeProvider, {
      props: {
        publishableKey: 'pk_test_invalid'
      },
      slots: {
        error: ({ error }: { error: string }) => h('div', { class: 'custom-error' }, error)
      }
    })

    await flushPromises()

    expect(wrapper.find('.custom-error').exists()).toBe(true)
    expect(wrapper.find('.custom-error').text()).toContain('Custom error message')
  })

  it('should throw error when no publishableKey or stripeKey provided', () => {
    expect(() => {
      mount(VueStripeProvider, {
        props: {}
      })
    }).toThrow('publishableKey or stripeKey is required')
  })
})
