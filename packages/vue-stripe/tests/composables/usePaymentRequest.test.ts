import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import {
  defineComponent,
  effectScope,
  h,
  isReadonly,
  nextTick,
  provide,
  ref,
  shallowRef,
  type ShallowRef
} from 'vue-demi'
import { usePaymentRequest } from '../../src/composables/usePaymentRequest'
import { stripeInjectionKey } from '../../src/utils/injection-keys'
import type { PaymentRequestEventType } from '../../src'
import { flushPromises, makeMockStripe } from '../setup'

type Handler = (event?: unknown) => unknown

// A stand-in for Stripe's PaymentRequest that keeps real on/off bookkeeping.
function makeMockPaymentRequest(
  canMakePayment: unknown = { applePay: false, googlePay: true, link: false }
) {
  const listeners = new Map<string, Set<Handler>>()
  const pr = {
    canMakePayment: vi.fn(() => Promise.resolve(canMakePayment)),
    show: vi.fn(),
    abort: vi.fn(),
    isShowing: vi.fn(() => false),
    update: vi.fn(),
    on: vi.fn((event: string, handler: Handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)?.add(handler)
      return pr
    }),
    off: vi.fn((event: string, handler?: Handler) => {
      if (handler) listeners.get(event)?.delete(handler)
      else listeners.delete(event)
      return pr
    }),
    emit: (event: string, payload?: unknown) =>
      listeners.get(event)?.forEach((handler) => handler(payload)),
    count: () => [...listeners.values()].reduce((n, set) => n + set.size, 0)
  }
  return pr
}

const options = {
  country: 'US',
  currency: 'usd',
  total: { label: 'Demo total', amount: 1099 }
}

function makeStripe(pr: ReturnType<typeof makeMockPaymentRequest>) {
  return { ...makeMockStripe(), paymentRequest: vi.fn(() => pr) }
}

// Run usePaymentRequest() under a hand-provided Stripe context.
function withStripe(stripe: ShallowRef<unknown>) {
  let api!: ReturnType<typeof usePaymentRequest>
  const wrapper = mount(
    defineComponent({
      setup() {
        provide(stripeInjectionKey, {
          stripe: stripe as never,
          loading: ref(false),
          error: ref(null)
        })
        return () =>
          h(
            defineComponent({
              setup() {
                api = usePaymentRequest(options)
                return () => h('div')
              }
            })
          )
      }
    })
  )
  return { api, wrapper }
}

describe('usePaymentRequest', () => {
  it('throws when used outside a provider', () => {
    expect(() =>
      mount(
        defineComponent({
          setup() {
            usePaymentRequest(options)
            return {}
          },
          render: () => h('div')
        })
      )
    ).toThrow('usePaymentRequest must be called within a VueStripeProvider component')
  })

  it('creates the PaymentRequest with stripe.paymentRequest(options) and stores canMakePayment()', async () => {
    const pr = makeMockPaymentRequest()
    const stripe = makeStripe(pr)
    const { api } = withStripe(shallowRef(stripe))

    expect(stripe.paymentRequest).toHaveBeenCalledTimes(1)
    expect(stripe.paymentRequest).toHaveBeenCalledWith(options)
    expect(api.paymentRequest.value).toBe(pr)
    expect(api.loading.value).toBe(true)
    expect(api.canMakePayment.value).toBe(null)

    await flushPromises()
    expect(pr.canMakePayment).toHaveBeenCalledTimes(1)
    expect(api.canMakePayment.value).toEqual({ applePay: false, googlePay: true, link: false })
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
  })

  it('keeps canMakePayment null when no wallet is available', async () => {
    const pr = makeMockPaymentRequest(null)
    const { api } = withStripe(shallowRef(makeStripe(pr)))

    await flushPromises()
    expect(api.canMakePayment.value).toBe(null)
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
  })

  it('returns read-only refs', () => {
    const { api } = withStripe(shallowRef(makeStripe(makeMockPaymentRequest())))
    expect(isReadonly(api.paymentRequest)).toBe(true)
    expect(isReadonly(api.canMakePayment)).toBe(true)
    expect(isReadonly(api.loading)).toBe(true)
    expect(isReadonly(api.error)).toBe(true)
  })

  it('waits for Stripe.js to load before creating the PaymentRequest', async () => {
    const pr = makeMockPaymentRequest()
    const stripe = makeStripe(pr)
    const stripeRef = shallowRef<unknown>(null)
    const { api } = withStripe(stripeRef)

    expect(api.paymentRequest.value).toBe(null)
    expect(api.loading.value).toBe(false)

    stripeRef.value = stripe
    await nextTick()
    expect(stripe.paymentRequest).toHaveBeenCalledWith(options)
    await flushPromises()
    expect(api.canMakePayment.value).toEqual({ applePay: false, googlePay: true, link: false })
  })

  it('surfaces a rejected canMakePayment() on the error ref', async () => {
    const pr = makeMockPaymentRequest()
    pr.canMakePayment.mockReturnValueOnce(Promise.reject(new Error('Wallet check failed')))
    const { api } = withStripe(shallowRef(makeStripe(pr)))

    await flushPromises()
    expect(api.canMakePayment.value).toBe(null)
    expect(api.error.value).toBe('Wallet check failed')
    expect(api.loading.value).toBe(false)
  })

  it('reports a non-Error rejection with a generic message', async () => {
    const pr = makeMockPaymentRequest()
    pr.canMakePayment.mockReturnValueOnce(Promise.reject('boom'))
    const { api } = withStripe(shallowRef(makeStripe(pr)))

    await flushPromises()
    expect(api.error.value).toBe('Failed to check for a wallet')
  })

  it('surfaces an error thrown by stripe.paymentRequest() (invalid options)', () => {
    const stripe = {
      ...makeMockStripe(),
      paymentRequest: vi.fn(() => {
        throw new Error('Invalid value for paymentRequest(): country should be one of ...')
      })
    }
    const { api } = withStripe(shallowRef(stripe))

    expect(api.paymentRequest.value).toBe(null)
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe('Invalid value for paymentRequest(): country should be one of ...')
  })

  it('reports a non-Error throw from stripe.paymentRequest() with a generic message', () => {
    const stripe = {
      ...makeMockStripe(),
      paymentRequest: vi.fn(() => {
        throw 'boom'
      })
    }
    const { api } = withStripe(shallowRef(stripe))
    expect(api.error.value).toBe('Failed to create the PaymentRequest')
  })

  it('forwards show, update, abort and isShowing to the PaymentRequest', async () => {
    const pr = makeMockPaymentRequest()
    const { api } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    const update = { total: { label: 'New total', amount: 2000 } }
    api.update(update)
    expect(pr.update).toHaveBeenCalledWith(update)

    api.show()
    expect(pr.show).toHaveBeenCalledTimes(1)

    pr.isShowing.mockReturnValueOnce(true)
    expect(api.isShowing()).toBe(true)

    api.abort()
    expect(pr.abort).toHaveBeenCalledTimes(1)
    expect(api.error.value).toBe(null)
  })

  it('does nothing but set the error ref when called before the PaymentRequest exists', () => {
    const { api } = withStripe(shallowRef(null))

    api.show()
    expect(api.error.value).toBe('PaymentRequest is not ready')
    expect(() => api.update({ total: { label: 'x', amount: 1 } })).not.toThrow()
    expect(() => api.abort()).not.toThrow()
    expect(api.isShowing()).toBe(false)
  })

  it('surfaces errors thrown by show() and update() instead of throwing', async () => {
    const pr = makeMockPaymentRequest()
    pr.show.mockImplementationOnce(() => {
      throw new Error('show() must be called from a user gesture handler')
    })
    pr.update.mockImplementationOnce(() => {
      throw 'busy'
    })
    const { api } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    expect(() => api.show()).not.toThrow()
    expect(api.error.value).toBe('show() must be called from a user gesture handler')

    api.update({ total: { label: 'x', amount: 1 } })
    expect(api.error.value).toBe('Failed to call update()')

    // The next successful call clears the stale error.
    api.show()
    expect(api.error.value).toBe(null)
  })

  it('attaches handlers registered with on() and delivers events', async () => {
    const pr = makeMockPaymentRequest()
    const { api } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    const onPaymentMethod = vi.fn()
    api.on('paymentmethod', onPaymentMethod)
    expect(pr.on).toHaveBeenCalledWith('paymentmethod', onPaymentMethod)

    const event = { paymentMethod: { id: 'pm_123' }, complete: vi.fn(), walletName: 'googlePay' }
    pr.emit('paymentmethod', event)
    expect(onPaymentMethod).toHaveBeenCalledWith(event)
  })

  it('queues handlers registered before Stripe.js loads and attaches them on creation', async () => {
    const pr = makeMockPaymentRequest()
    const stripeRef = shallowRef<unknown>(null)
    const { api } = withStripe(stripeRef)

    const onCancel = vi.fn()
    api.on('cancel', onCancel)
    expect(pr.on).not.toHaveBeenCalled()

    stripeRef.value = makeStripe(pr)
    await nextTick()
    expect(pr.on).toHaveBeenCalledWith('cancel', onCancel)
    pr.emit('cancel')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('removes a handler with off() or the function on() returns', async () => {
    const pr = makeMockPaymentRequest()
    const { api } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    const onToken = vi.fn()
    const onShipping = vi.fn()
    api.on('token', onToken)
    const stop = api.on('shippingaddresschange', onShipping)

    api.off('token', onToken)
    expect(pr.off).toHaveBeenCalledWith('token', onToken)
    stop()
    expect(pr.off).toHaveBeenCalledWith('shippingaddresschange', onShipping)

    pr.emit('token', {})
    pr.emit('shippingaddresschange', {})
    expect(onToken).not.toHaveBeenCalled()
    expect(onShipping).not.toHaveBeenCalled()
    expect(pr.count()).toBe(0)
  })

  it('once() delivers the next event only, and its return value removes it early', async () => {
    const pr = makeMockPaymentRequest()
    const { api } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    const onCancel = vi.fn()
    api.once('cancel', onCancel)
    pr.emit('cancel')
    pr.emit('cancel')
    expect(onCancel).toHaveBeenCalledTimes(1)

    const onToken = vi.fn()
    const stop = api.once('token', onToken)
    stop()
    pr.emit('token', {})
    expect(onToken).not.toHaveBeenCalled()
    expect(pr.count()).toBe(0)
  })

  it('off(event) without a handler removes every handler registered for that event', async () => {
    const pr = makeMockPaymentRequest()
    const { api } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    const a = vi.fn()
    const b = vi.fn()
    const other = vi.fn()
    api.on('shippingoptionchange', a)
    api.on('shippingoptionchange', b)
    api.on('source', other)

    api.off('shippingoptionchange')
    expect(pr.off).toHaveBeenCalledWith('shippingoptionchange', a)
    expect(pr.off).toHaveBeenCalledWith('shippingoptionchange', b)
    expect(pr.off).not.toHaveBeenCalledWith('source', other)
    expect(pr.count()).toBe(1)
  })

  it('a handler removed before Stripe.js loads is never attached', async () => {
    const pr = makeMockPaymentRequest()
    const stripeRef = shallowRef<unknown>(null)
    const { api } = withStripe(stripeRef)

    const stop = api.on('cancel', vi.fn())
    stop()
    stripeRef.value = makeStripe(pr)
    await nextTick()
    expect(pr.on).not.toHaveBeenCalled()
  })

  it('detaches every handler registered through on() on unmount', async () => {
    const pr = makeMockPaymentRequest()
    const { api, wrapper } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    const handlers = {
      token: vi.fn(),
      paymentmethod: vi.fn(),
      cancel: vi.fn(),
      shippingaddresschange: vi.fn()
    }
    for (const [event, handler] of Object.entries(handlers)) {
      api.on(event as PaymentRequestEventType, handler)
    }
    expect(pr.count()).toBe(4)

    wrapper.unmount()
    for (const [event, handler] of Object.entries(handlers)) {
      expect(pr.off).toHaveBeenCalledWith(event, handler)
    }
    expect(pr.count()).toBe(0)
    expect(pr.abort).not.toHaveBeenCalled()
  })

  it('closes a payment sheet that is still showing on unmount', async () => {
    const pr = makeMockPaymentRequest()
    const { wrapper } = withStripe(shallowRef(makeStripe(pr)))
    await flushPromises()

    pr.isShowing.mockReturnValue(true)
    wrapper.unmount()
    expect(pr.abort).toHaveBeenCalledTimes(1)
  })

  it('ignores a canMakePayment() that settles after unmount', async () => {
    let resolve!: (value: unknown) => void
    const pr = makeMockPaymentRequest()
    pr.canMakePayment.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    const { api, wrapper } = withStripe(shallowRef(makeStripe(pr)))

    wrapper.unmount()
    resolve({ googlePay: true })
    await flushPromises()
    expect(api.canMakePayment.value).toBe(null)
  })

  it('cleans up when its effect scope stops (usable outside components)', async () => {
    const pr = makeMockPaymentRequest()
    const stripe = makeStripe(pr)
    const scope = effectScope()
    let api!: ReturnType<typeof usePaymentRequest>
    mount(
      defineComponent({
        setup() {
          provide(stripeInjectionKey, {
            stripe: shallowRef(stripe as never),
            loading: ref(false),
            error: ref(null)
          })
          return () =>
            h(
              defineComponent({
                setup() {
                  scope.run(() => {
                    api = usePaymentRequest(options)
                  })
                  return () => h('div')
                }
              })
            )
        }
      })
    )
    await flushPromises()
    const onCancel = vi.fn()
    api.on('cancel', onCancel)

    scope.stop()
    expect(pr.off).toHaveBeenCalledWith('cancel', onCancel)
  })

  it('moves its handlers to a new PaymentRequest when the Stripe instance changes', async () => {
    const first = makeMockPaymentRequest()
    const second = makeMockPaymentRequest(null)
    const stripeRef = shallowRef<unknown>(makeStripe(first))
    const { api } = withStripe(stripeRef)
    await flushPromises()

    const onPaymentMethod = vi.fn()
    api.on('paymentmethod', onPaymentMethod)

    stripeRef.value = makeStripe(second)
    await nextTick()
    expect(first.off).toHaveBeenCalledWith('paymentmethod', onPaymentMethod)
    expect(second.on).toHaveBeenCalledWith('paymentmethod', onPaymentMethod)
    expect(api.paymentRequest.value).toBe(second)
    expect(api.canMakePayment.value).toBe(null)

    await flushPromises()
    expect(api.canMakePayment.value).toBe(null)
    expect(api.loading.value).toBe(false)
  })

  it('drops the PaymentRequest when the Stripe instance goes away', async () => {
    const pr = makeMockPaymentRequest()
    const stripeRef = shallowRef<unknown>(makeStripe(pr))
    const { api } = withStripe(stripeRef)
    await flushPromises()
    const onCancel = vi.fn()
    api.on('cancel', onCancel)

    stripeRef.value = null
    await nextTick()
    expect(api.paymentRequest.value).toBe(null)
    expect(api.canMakePayment.value).toBe(null)
    expect(pr.off).toHaveBeenCalledWith('cancel', onCancel)
  })
})

describe('PaymentRequestEventType', () => {
  it('lists exactly the events the installed Stripe.js PaymentRequest declares', () => {
    // Record<PaymentRequestEventType, true> makes this list exhaustive at compile time.
    const events: Record<PaymentRequestEventType, true> = {
      token: true,
      paymentmethod: true,
      source: true,
      cancel: true,
      shippingaddresschange: true,
      shippingoptionchange: true
    }
    const dts = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../node_modules/@stripe/stripe-js/dist/stripe-js/payment-request.d.ts'
      ),
      'utf8'
    )
    const declared = new Set(
      [...dts.matchAll(/\bon\(\s*eventType: '([a-z]+)'/g)].map((match) => match[1])
    )
    expect(Object.keys(events).sort()).toEqual([...declared].sort())
  })
})
