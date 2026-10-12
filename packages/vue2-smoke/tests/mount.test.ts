import { mount } from '@vue/test-utils'
import {
  VueStripeCardElement,
  VueStripeCardNumberElement,
  VueStripeElements,
  VueStripeProvider
} from '@vue-stripe/vue-stripe'
import { beforeEach, expect, it, vi } from 'vitest'
import type { CreateElement } from 'vue'
import { elements, flush } from './setup'

// Provider > Elements > Leaf, written as a Vue 2 render function.
const tree = (Leaf: unknown) => ({
  render(h: CreateElement) {
    return h(VueStripeProvider as never, { props: { publishableKey: 'pk_test_x' } }, [
      h(VueStripeElements as never, { props: { clientSecret: 'pi_x_secret_y' } }, [
        h(Leaf as never)
      ])
    ])
  }
})

beforeEach(() => vi.clearAllMocks())

it('factory element mounts under Vue 2.7', async () => {
  const wrapper = mount(tree(VueStripeCardNumberElement))
  await flush()
  await flush()
  await flush()
  expect(elements.create).toHaveBeenCalledWith('cardNumber', expect.anything())
  expect(wrapper.find('.vue-stripe-cardNumber-element-mount').exists()).toBe(true)
})

it('card element mounts under Vue 2.7', async () => {
  const wrapper = mount(tree(VueStripeCardElement))
  await flush()
  await flush()
  await flush()
  expect(elements.create).toHaveBeenCalledWith('card', expect.anything())
  expect(wrapper.find('.vue-stripe-card-element-mount').exists()).toBe(true)
})
