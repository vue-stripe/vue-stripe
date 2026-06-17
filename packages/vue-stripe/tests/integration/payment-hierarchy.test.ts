import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue-demi'
import VueStripeProvider from '../../src/components/VueStripeProvider.vue'
import VueStripeElements from '../../src/components/VueStripeElements.vue'
import VueStripePaymentElement from '../../src/components/VueStripePaymentElement.vue'
import { useStripe } from '../../src/composables/useStripe'
import { useStripeElements } from '../../src/composables/useStripeElements'
import { usePaymentIntent } from '../../src/composables/usePaymentIntent'
import { useSetupIntent } from '../../src/composables/useSetupIntent'
import { flushPromises, createMockElement } from '../setup'

/**
 * Integration tests (#386): exercise the full provider-based hierarchy
 * Provider -> Elements -> Element + composables end-to-end. The plugin-only
 * pathway is intentionally out of scope here (blocked by #424).
 */
describe('integration: Provider > Elements > PaymentElement + composables', () => {
  beforeEach(() => vi.clearAllMocks())

  const stubStripe = async (overrides: Record<string, unknown> = {}) => {
    const submit = vi.fn(() => Promise.resolve({ error: null }))
    const mockElement = createMockElement()
    const confirmPayment = vi.fn(() =>
      Promise.resolve({ paymentIntent: { id: 'pi_1', status: 'succeeded' } })
    )
    const confirmSetup = vi.fn(() =>
      Promise.resolve({ setupIntent: { id: 'seti_1', status: 'succeeded' } })
    )

    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce({
      elements: vi.fn(() => ({ create: vi.fn(() => mockElement), submit })),
      confirmPayment,
      confirmSetup,
      confirmCardSetup: vi.fn(),
      registerAppInfo: vi.fn(),
      ...overrides
    } as any)

    return { submit, confirmPayment, confirmSetup, mockElement }
  }

  const mountHierarchy = (Inner: ReturnType<typeof defineComponent>) =>
    mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: {
        default: () =>
          h(VueStripeElements, { clientSecret: 'pi_test_secret_123' }, {
            default: () => h(Inner)
          })
      }
    })

  it('resolves the stripe instance and elements group through the hierarchy', async () => {
    await stubStripe()

    const Inner = defineComponent({
      setup() {
        const { stripe } = useStripe()
        const { elements } = useStripeElements()
        return { hasStripe: () => !!stripe.value, hasElements: () => !!elements.value }
      },
      render: () => h(VueStripePaymentElement)
    })

    const wrapper = mountHierarchy(Inner)
    await flushPromises()
    await wrapper.vm.$nextTick()

    const inner = wrapper.findComponent(Inner)
    expect((inner.vm as any).hasStripe()).toBe(true)
    expect((inner.vm as any).hasElements()).toBe(true)
  })

  it('confirms a payment end-to-end (submit then confirmPayment)', async () => {
    const { submit, confirmPayment } = await stubStripe()

    const Inner = defineComponent({
      setup() {
        const { confirmPayment: confirm } = usePaymentIntent()
        const result = ref<any>(null)
        const pay = async () => {
          result.value = await confirm({ clientSecret: 'pi_test_secret_123' })
        }
        return { pay, result }
      },
      render: () => h(VueStripePaymentElement)
    })

    const wrapper = mountHierarchy(Inner)
    await flushPromises()

    const inner = wrapper.findComponent(Inner)
    await (inner.vm as any).pay()

    // usePaymentIntent runs elements.submit() before confirmPayment.
    expect(submit).toHaveBeenCalled()
    expect(confirmPayment).toHaveBeenCalled()
    expect((inner.vm as any).result.paymentIntent.id).toBe('pi_1')
  })

  it('confirms a setup end-to-end via useSetupIntent', async () => {
    const { submit, confirmSetup } = await stubStripe()

    const Inner = defineComponent({
      setup() {
        const { confirmSetup: confirm } = useSetupIntent()
        const result = ref<any>(null)
        const save = async () => {
          result.value = await confirm({ clientSecret: 'seti_test_secret_123' })
        }
        return { save, result }
      },
      render: () => h(VueStripePaymentElement)
    })

    const wrapper = mountHierarchy(Inner)
    await flushPromises()

    const inner = wrapper.findComponent(Inner)
    await (inner.vm as any).save()

    expect(submit).toHaveBeenCalled()
    expect(confirmSetup).toHaveBeenCalled()
    expect((inner.vm as any).result.setupIntent.id).toBe('seti_1')
  })

  it('propagates a Stripe load failure to the provider error state', async () => {
    const mockLoadStripe = vi.mocked(await import('@stripe/stripe-js')).loadStripe
    mockLoadStripe.mockResolvedValueOnce(null as any)

    const wrapper = mount(VueStripeProvider, {
      props: { publishableKey: 'pk_test_123' },
      slots: { default: () => h('div', 'child') }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.vue-stripe-error').exists()).toBe(true)
    expect(wrapper.emitted('error')).toBeTruthy()
  })
})
