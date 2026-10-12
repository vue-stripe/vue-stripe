import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue-demi'
import VueStripeCheckout from '../../src/components/VueStripeCheckout.vue'
import { VueStripeCheckoutError } from '../../src/utils/errors'
import { flushPromises } from '../setup'

const SESSION_URL = 'https://checkout.stripe.com/c/pay/cs_test_123'
const originalLocation = window.location
let replace: ReturnType<typeof vi.fn>

describe('VueStripeCheckout (hosted Checkout redirect, Stripe.js 10)', () => {
  beforeEach(() => {
    replace = vi.fn()
    // jsdom's Location is unforgeable; stub the whole object (see review notes on #470).
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, replace },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    })
  })

  it('renders a default button without needing VueStripeProvider', () => {
    const wrapper = mount(VueStripeCheckout, { props: { sessionUrl: SESSION_URL } })
    expect(wrapper.find('button').text()).toBe('Checkout')
  })

  it('renders custom button text and class, and honours disabled', () => {
    const wrapper = mount(VueStripeCheckout, {
      props: {
        sessionUrl: SESSION_URL,
        buttonText: 'Pay now',
        buttonClass: 'pay-btn',
        disabled: true
      }
    })
    const button = wrapper.find('button')
    expect(button.text()).toBe('Pay now')
    expect(button.classes()).toContain('pay-btn')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('emits checkout -> before-redirect -> success and redirects to the session URL', async () => {
    const wrapper = mount(VueStripeCheckout, { props: { sessionUrl: SESSION_URL } })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(replace).toHaveBeenCalledWith(SESSION_URL)
    const order = Object.keys(wrapper.emitted()).filter((name) =>
      ['checkout', 'before-redirect', 'success', 'error'].includes(name)
    )
    expect(order).toEqual(['checkout', 'before-redirect', 'success'])
    expect(wrapper.emitted('before-redirect')?.[0]).toEqual([{ url: SESSION_URL }])
  })

  it('emits a typed error and does not redirect when sessionUrl is missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(VueStripeCheckout, { props: {} })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    const [[err]] = wrapper.emitted('error') as [[Error]]
    expect(err).toBeInstanceOf(VueStripeCheckoutError)
    expect(err.message).toContain('sessionUrl')
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(replace).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('shows the loading text while redirecting', async () => {
    const wrapper = mount(VueStripeCheckout, {
      props: { sessionUrl: SESSION_URL, loadingText: 'Taking you to Stripe...' }
    })
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('button').text()).toContain('Taking you to Stripe...')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('passes { checkout, loading, disabled } to the default slot', async () => {
    let slotProps: Record<string, unknown> = {}
    const wrapper = mount(VueStripeCheckout, {
      props: { sessionUrl: SESSION_URL, disabled: false },
      slots: {
        default: (props: { checkout: () => void; loading: boolean; disabled: boolean }) => {
          slotProps = props
          return h('a', { class: 'custom-pay', onClick: props.checkout }, 'Custom Pay')
        }
      }
    })
    expect(wrapper.find('.custom-pay').exists()).toBe(true)
    expect(slotProps).toMatchObject({ loading: false, disabled: false })
    expect(typeof slotProps['checkout']).toBe('function')

    await wrapper.find('.custom-pay').trigger('click')
    await flushPromises()
    expect(replace).toHaveBeenCalledWith(SESSION_URL)
  })
})
