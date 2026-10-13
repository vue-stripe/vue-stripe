import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue-demi'
import { loadStripe } from '@stripe/stripe-js/pure'
import VueStripeProvider from '../../src/components/VueStripeProvider'
import VueStripeElements from '../../src/components/VueStripeElements'
import VueStripeCheckoutElementsProvider from '../../src/components/VueStripeCheckoutElementsProvider'
import VueStripeCheckoutFormProvider from '../../src/components/VueStripeCheckoutFormProvider'
import { createVueStripe } from '../../src/plugin'
import { flushPromises, makeMockCheckout, makeMockCheckoutForm, makeMockStripe } from '../setup'

// #675: a compiled slot root with dynamic text only gets its text patched, so when a
// provider switched state without keys, the slot root kept the library markup's class/id.

const settle = async () => {
  for (let i = 0; i < 4; i++) await flushPromises()
}

/** Mounts a compiled template, the way an app's SFC renders the provider slots. */
const mountTemplate = (template: string, plugin?: string) =>
  mount(
    defineComponent({
      components: {
        VueStripeProvider,
        VueStripeElements,
        VueStripeCheckoutElementsProvider,
        VueStripeCheckoutFormProvider
      },
      setup: () => ({ label: ref('dynamic') }),
      template
    }),
    plugin ? { global: { plugins: [createVueStripe({ publishableKey: plugin })] } } : {}
  )

describe('provider slots render as written after a state switch (#675)', () => {
  it('VueStripeProvider: loading to default', async () => {
    const wrapper = mountTemplate(`
      <VueStripeProvider publishable-key="pk_test_123">
        <div class="provider-content">provider {{ label }}</div>
      </VueStripeProvider>`)
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(true)
    await settle()

    const root = wrapper.find('.provider-content')
    expect(root.exists()).toBe(true)
    expect(root.text()).toBe('provider dynamic')
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(false)
  })

  it('VueStripeElements: loading to default (createVueStripe)', async () => {
    const wrapper = mountTemplate(
      `<VueStripeElements mode="payment" currency="usd" :amount="1000">
        <div class="elements-content">elements {{ label }}</div>
      </VueStripeElements>`,
      'pk_test_675_elements'
    )
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(true)
    await settle()

    expect(wrapper.find('.elements-content').text()).toBe('elements dynamic')
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(false)
  })

  it('VueStripeCheckoutElementsProvider: loading to default, then default to #error', async () => {
    const checkout = makeMockCheckout()
    let fail!: (err: Error) => void
    checkout.loadActions.mockReturnValueOnce(new Promise((_, reject) => (fail = reject)))
    const stripe = makeMockStripe()
    stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

    const wrapper = mountTemplate(
      `<VueStripeCheckoutElementsProvider client-secret="cs_test_1_secret_2">
        <template #default="{ loading }"><p id="slot-props">Loading actions: {{ loading }}</p></template>
        <template #error="{ error }"><p id="prov-error">provider error: {{ error }}</p></template>
      </VueStripeCheckoutElementsProvider>`,
      'pk_test_675_checkout'
    )
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(true)
    await settle()
    expect(wrapper.find('#slot-props').text()).toBe('Loading actions: true')
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(false)

    fail(new Error('You cannot update the email'))
    await settle()
    expect(wrapper.find('#prov-error').text()).toBe('provider error: You cannot update the email')
    expect(wrapper.find('#slot-props').exists()).toBe(false)
  })

  it('VueStripeCheckoutFormProvider: loading to default, then default to #error', async () => {
    const form = makeMockCheckoutForm()
    let fail!: (err: Error) => void
    form.loadActions.mockReturnValueOnce(new Promise((_, reject) => (fail = reject)))
    const stripe = makeMockStripe()
    stripe.initCheckoutFormSdk.mockReturnValue(form)
    vi.mocked(loadStripe).mockResolvedValueOnce(stripe as never)

    const wrapper = mountTemplate(
      `<VueStripeCheckoutFormProvider client-secret="cs_test_1_secret_2">
        <template #default="{ loading }"><p id="slot-props">Loading actions: {{ loading }}</p></template>
        <template #error="{ error }"><p id="prov-error">provider error: {{ error }}</p></template>
      </VueStripeCheckoutFormProvider>`,
      'pk_test_675_form'
    )
    expect(wrapper.find('.vue-stripe-loading-message').exists()).toBe(true)
    await settle()
    expect(wrapper.find('#slot-props').text()).toBe('Loading actions: true')

    fail(new Error('Invalid defaultValues'))
    await settle()
    expect(wrapper.find('#prov-error').text()).toBe('provider error: Invalid defaultValues')
    expect(wrapper.find('#slot-props').exists()).toBe(false)
  })
})
