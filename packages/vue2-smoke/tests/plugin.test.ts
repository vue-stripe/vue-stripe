import { createLocalVue, mount } from '@vue/test-utils'
import { loadStripe } from '@stripe/stripe-js/pure'
import type { Stripe } from '@stripe/stripe-js'
import {
  createVueStripe,
  useConfirmCardPayment,
  useStripe,
  VueStripeCardElement,
  VueStripeElements,
  VueStripeProvider
} from '@vue-stripe/vue-stripe'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { CreateElement } from 'vue'
import { element, elements, flush, stripe } from './setup'

const settle = async () => {
  await flush()
  await flush()
  await flush()
}

// createLocalVue() keeps the plugin's global mixin out of the other smoke tests.
const withPlugin = () => {
  const localVue = createLocalVue()
  localVue.use(createVueStripe({ publishableKey: 'pk_test_plugin' }))
  return localVue
}

beforeEach(() => vi.clearAllMocks())
afterEach(() =>
  vi.mocked(loadStripe).mockImplementation(() => Promise.resolve(stripe as unknown as Stripe))
)

it('mounts VueStripeElements and an element with only the plugin installed', async () => {
  const wrapper = mount(
    {
      render(h: CreateElement) {
        return h(VueStripeElements as never, { props: { clientSecret: 'pi_x_secret_y' } }, [
          h(VueStripeCardElement as never)
        ])
      }
    },
    { localVue: withPlugin() }
  )
  await settle()
  expect(loadStripe).toHaveBeenCalledTimes(1)
  expect(loadStripe).toHaveBeenCalledWith('pk_test_plugin', {})
  expect(stripe.elements).toHaveBeenCalledWith(
    expect.objectContaining({ clientSecret: 'pi_x_secret_y' })
  )
  expect(elements.create).toHaveBeenCalledWith('card', expect.anything())
  expect(element.mount).toHaveBeenCalled()
  expect(wrapper.find('.vue-stripe-card-element-mount').exists()).toBe(true)
})

it('resolves useStripe() under the plugin, and a nested VueStripeProvider wins', async () => {
  vi.mocked(loadStripe).mockImplementation((key) =>
    Promise.resolve({ ...stripe, key } as unknown as Stripe)
  )
  const seen: { value: { key: string } | null }[] = []
  const Consumer = {
    setup() {
      seen.push(useStripe().stripe as unknown as (typeof seen)[number])
      return () => null
    }
  }
  mount(
    {
      render(h: CreateElement) {
        return h('div', [
          h(Consumer),
          h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_provider' } }, [
            h(Consumer)
          ])
        ])
      }
    },
    { localVue: withPlugin() }
  )
  await settle()
  expect(loadStripe).toHaveBeenCalledTimes(2)
  expect(
    vi
      .mocked(loadStripe)
      .mock.calls.map((call) => call[0])
      .sort()
  ).toEqual(['pk_test_plugin', 'pk_test_provider'])
  // First consumer sits outside the provider, second inside it.
  expect(seen.map((ref) => ref.value?.key)).toEqual(['pk_test_plugin', 'pk_test_provider'])
})

it('starts the plugin load from a method composable and waits for it (#565)', async () => {
  const result = { paymentIntent: { id: 'pi_123', status: 'succeeded' } }
  stripe.confirmCardPayment.mockResolvedValueOnce(result)
  let api!: ReturnType<typeof useConfirmCardPayment>
  mount(
    {
      setup() {
        api = useConfirmCardPayment()
        return {}
      },
      render: (h: CreateElement) => h('div')
    },
    { localVue: withPlugin() }
  )
  expect(loadStripe).toHaveBeenCalledTimes(1)
  // Called before the load settles: waits instead of failing.
  await expect(api.confirmCardPayment('pi_x_secret_y')).resolves.toBe(result)
})
