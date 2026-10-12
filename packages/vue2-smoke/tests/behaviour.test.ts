import { mount } from '@vue/test-utils'
import {
  VueStripeCardNumberElement,
  VueStripeCheckout,
  VueStripeElements,
  VueStripePricingTable,
  VueStripeProvider,
  useConfirmCardPayment,
  useCreateConfirmationToken,
  usePaymentRequest
} from '@vue-stripe/vue-stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateElement } from 'vue'
import { element, elements, flush, paymentRequest, stripe } from './setup'

const settle = async () => {
  await flush()
  await flush()
  await flush()
}

beforeEach(() => vi.clearAllMocks())

it('re-emits Stripe events to Vue 2 listeners and renders the change error', async () => {
  const onChange = vi.fn()
  const onReady = vi.fn()
  const wrapper = mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h(VueStripeElements as never, { props: { clientSecret: 'pi_x_secret_y' } }, [
          h(VueStripeCardNumberElement as never, { on: { change: onChange, ready: onReady } })
        ])
      ])
    }
  })
  await settle()
  const handler = (name: string) =>
    element.on.mock.calls.find((call) => call[0] === name)?.[1] as (e?: unknown) => void
  handler('ready')()
  handler('change')({ error: { message: 'Your card number is incomplete.' } })
  await flush()
  expect(onReady).toHaveBeenCalledWith(element)
  expect(onChange).toHaveBeenCalledWith({ error: { message: 'Your card number is incomplete.' } })
  expect(wrapper.find('.vue-stripe-element-error').text()).toBe('Your card number is incomplete.')
})

it('renders the provider #loading scoped slot under Vue 2', () => {
  const wrapper = mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, {
        props: { publishableKey: 'pk_test_x' },
        scopedSlots: { loading: () => h('p', { class: 'custom-loading' }, 'Wait') }
      })
    }
  })
  expect(wrapper.find('.custom-loading').text()).toBe('Wait')
})

describe('VueStripeCheckout', () => {
  const original = window.location
  let replace: ReturnType<typeof vi.fn>
  beforeEach(() => {
    replace = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...original, replace },
      writable: true,
      configurable: true
    })
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: original,
      writable: true,
      configurable: true
    })
  })

  it('redirects to the session URL on click and emits success', async () => {
    const onSuccess = vi.fn()
    const wrapper = mount({
      render(h: CreateElement) {
        return h(VueStripeCheckout as never, {
          props: { sessionUrl: 'https://checkout.stripe.com/c/pay/cs_test' },
          on: { success: onSuccess }
        })
      }
    })
    expect(wrapper.find('button').text()).toBe('Checkout')
    await wrapper.find('button').trigger('click')
    expect(replace).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test')
    expect(onSuccess).toHaveBeenCalled()
  })
})

it('renders <stripe-pricing-table> with its attributes', async () => {
  const script = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    ;(node as HTMLScriptElement).onload?.(new Event('load'))
    return node
  })
  const wrapper = mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h(VueStripePricingTable as never, {
          props: { pricingTableId: 'prctbl_123', customerEmail: 'a@b.co' }
        })
      ])
    }
  })
  await settle()
  const table = wrapper.find('stripe-pricing-table')
  expect(table.attributes('pricing-table-id')).toBe('prctbl_123')
  expect(table.attributes('publishable-key')).toBe('pk_test_x')
  expect(table.attributes('customer-email')).toBe('a@b.co')
  script.mockRestore()
})

it('runs a method confirmer composable under Vue 2', async () => {
  const result = { paymentIntent: { id: 'pi_123', status: 'succeeded' } }
  stripe.confirmCardPayment.mockResolvedValueOnce(result)
  let api!: ReturnType<typeof useConfirmCardPayment>
  mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h({
          setup() {
            api = useConfirmCardPayment()
            return {}
          },
          render: (h2: CreateElement) => h2('div')
        })
      ])
    }
  })
  await settle()

  const call = api.confirmCardPayment('pi_x_secret_y', { payment_method: 'pm_123' })
  expect(api.loading.value).toBe(true)
  await expect(call).resolves.toBe(result)
  expect(stripe.confirmCardPayment).toHaveBeenCalledWith('pi_x_secret_y', {
    payment_method: 'pm_123'
  })
  expect(api.loading.value).toBe(false)
  expect(api.error.value).toBe(null)
})

it('creates a ConfirmationToken from the injected Elements under Vue 2', async () => {
  const result = { confirmationToken: { id: 'ctoken_123' } }
  elements.submit.mockResolvedValueOnce({})
  stripe.createConfirmationToken.mockResolvedValueOnce(result)
  let api!: ReturnType<typeof useCreateConfirmationToken>
  mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h(
          VueStripeElements as never,
          { props: { mode: 'payment', amount: 1099, currency: 'usd' } },
          [
            h({
              setup() {
                api = useCreateConfirmationToken()
                return {}
              },
              render: (h2: CreateElement) => h2('div')
            })
          ]
        )
      ])
    }
  })
  await settle()

  await expect(api.createConfirmationToken()).resolves.toBe(result)
  expect(elements.submit).toHaveBeenCalledTimes(1)
  expect(stripe.createConfirmationToken).toHaveBeenCalledWith({ elements })
  expect(api.loading.value).toBe(false)
  expect(api.error.value).toBe(null)
})

it('runs usePaymentRequest under Vue 2 and detaches its handlers on destroy', async () => {
  const options = { country: 'US', currency: 'usd', total: { label: 'Total', amount: 1099 } }
  let api!: ReturnType<typeof usePaymentRequest>
  const wrapper = mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h({
          setup() {
            api = usePaymentRequest(options)
            return {}
          },
          render: (h2: CreateElement) => h2('div')
        })
      ])
    }
  })
  await settle()

  expect(stripe.paymentRequest).toHaveBeenCalledWith(options)
  expect(api.paymentRequest.value).toBe(paymentRequest)
  expect(api.canMakePayment.value).toEqual({ googlePay: true })
  expect(api.loading.value).toBe(false)

  const onPaymentMethod = vi.fn()
  api.on('paymentmethod', onPaymentMethod)
  expect(paymentRequest.on).toHaveBeenCalledWith('paymentmethod', onPaymentMethod)
  api.show()
  expect(paymentRequest.show).toHaveBeenCalled()

  wrapper.destroy()
  expect(paymentRequest.off).toHaveBeenCalledWith('paymentmethod', onPaymentMethod)
})
