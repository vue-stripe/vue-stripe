import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue-demi'
import { useStripeCheckout } from '../../src/composables/useStripeCheckout'
import { VueStripeCheckoutError } from '../../src/utils/errors'

// jsdom's Location is unforgeable (vi.spyOn(window.location, 'replace') throws),
// so swap the whole window.location for a stub and restore it afterwards.
const originalLocation = window.location
let replace: ReturnType<typeof vi.fn>

function useComposable() {
  let api!: ReturnType<typeof useStripeCheckout>
  mount(
    defineComponent({
      setup() {
        api = useStripeCheckout()
        return () => h('div')
      }
    })
  )
  return api
}

describe('useStripeCheckout (hosted Checkout redirect, Stripe.js 10)', () => {
  beforeEach(() => {
    replace = vi.fn()
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

  it('works without a VueStripeProvider (no Stripe instance is needed)', () => {
    expect(() => useComposable()).not.toThrow()
  })

  it('redirectToCheckout({ url }) replaces the location with the session URL', async () => {
    const { redirectToCheckout, loading, error } = useComposable()
    await redirectToCheckout({ url: 'https://checkout.stripe.com/c/pay/cs_test' })
    expect(replace).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test')
    expect(loading.value).toBe(true)
    expect(error.value).toBe(null)
  })

  it('redirectToCheckout rejects with a typed error and sets error when url is missing', async () => {
    const { redirectToCheckout, error } = useComposable()
    await expect(redirectToCheckout({} as never)).rejects.toBeInstanceOf(VueStripeCheckoutError)
    expect(error.value).toContain('`url` is required')
    expect(replace).not.toHaveBeenCalled()
  })

  it('redirectToUrl(url) replaces the location and clears a previous error', async () => {
    const api = useComposable()
    await api.redirectToCheckout({} as never).catch(() => undefined)
    api.redirectToUrl('https://checkout.stripe.com/c/pay/cs_test_2')
    expect(replace).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_2')
    expect(api.error.value).toBe(null)
  })

  it('returns readonly state refs', () => {
    const { loading, error } = useComposable()
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('no longer exposes the removed Stripe.js redirectToCheckout session/lineItems options', () => {
    const api = useComposable() as unknown as Record<string, unknown>
    expect(Object.keys(api).sort()).toEqual([
      'error',
      'loading',
      'redirectToCheckout',
      'redirectToUrl'
    ])
  })
})
