import { mount } from '@vue/test-utils'
import {
  VueStripeCheckoutElementsProvider,
  VueStripeElements,
  VueStripeProvider,
  useCheckoutSession,
  usePricing,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'
import { expect, it, vi } from 'vitest'
import type { CreateElement } from 'vue'
import { elements, flush, stripe } from './setup'

// Vue 2.7's readonly() copies plain objects instead of proxying them, so a composable
// that wrapped a Stripe object in readonly() handed out a copy: `===` checks failed and
// Stripe's own methods ran with the copy as `this`. The composables must return the
// very objects Stripe.js created.
const settle = async () => {
  for (let i = 0; i < 4; i++) await flush()
}

const capture = <T>(use: () => T) => {
  const box: { api?: T } = {}
  const Child = {
    setup() {
      box.api = use()
      return () => null
    },
    render(h: CreateElement) {
      return h('i')
    }
  }
  return { box, Child }
}

it('useStripe() and useStripeElements() return the objects Stripe.js created', async () => {
  const { box, Child } = capture(() => ({ s: useStripe(), e: useStripeElements() }))
  mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h(VueStripeElements as never, { props: { clientSecret: 'pi_x_secret_y' } }, [
          h(Child as never)
        ])
      ])
    }
  })
  await settle()
  expect(box.api?.s.stripe.value).toBe(stripe)
  expect(box.api?.e.elements.value).toBe(elements)
})

it('useCheckoutSession() returns the Checkout SDK, actions and session objects', async () => {
  const session = { status: { type: 'open' }, total: { total: { amount: '$10.00' } } }
  const actions = { getSession: vi.fn(() => session), confirm: vi.fn() }
  const sdk = {
    on: vi.fn(),
    loadActions: vi.fn(() => Promise.resolve({ type: 'success', actions }))
  }
  stripe.initCheckoutElementsSdk.mockReturnValueOnce(sdk as never)
  const { box, Child } = capture(() => useCheckoutSession())
  mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h(VueStripeCheckoutElementsProvider as never, { props: { clientSecret: 'cs_x' } }, [
          h(Child as never)
        ])
      ])
    }
  })
  await settle()
  expect(box.api?.checkout.value).toBe(sdk)
  expect(box.api?.actions.value).toBe(actions)
  expect(box.api?.session.value).toBe(session)
})

it('usePricing() exposes the original SDK and methods keep their receiver on Vue 2.7', async () => {
  const sdk = {
    currency: 'kwd',
    async getSelectedCurrency() {
      return { currency: this.currency }
    }
  }
  stripe.initializePricing.mockResolvedValueOnce(sdk)
  const { box, Child } = capture(() => usePricing())
  const wrapper = mount({
    render(h: CreateElement) {
      return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
        h(Child as never)
      ])
    }
  })
  await settle()
  expect(await box.api!.initializePricing({ pricingPolicy: 'prcpol_123' })).toBe(sdk)
  expect(box.api!.pricing.value).toBe(sdk)
  await expect(box.api!.pricing.value!.getSelectedCurrency()).resolves.toEqual({ currency: 'kwd' })
  wrapper.destroy()
})
