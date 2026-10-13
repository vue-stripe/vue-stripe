import {
  computed,
  getCurrentScope,
  onScopeDispose,
  readonly,
  ref,
  shallowRef,
  watch
} from 'vue-demi'
import type {
  CanMakePaymentResult,
  PaymentRequest,
  PaymentRequestOptions,
  Stripe
} from '@stripe/stripe-js'
import type {
  PaymentRequestEventHandler,
  PaymentRequestEventType,
  UsePaymentRequestReturn
} from '../types'
import { injectStripe } from '../utils/inject-stripe'

type Listener = { event: PaymentRequestEventType; handler: (event: never) => unknown }

// PaymentRequest.on/off are overloaded per event; this is the shape they share.
type Emitter = {
  on: (event: string, handler: Listener['handler']) => unknown
  off: (event: string, handler: Listener['handler']) => unknown
}

const messageOf = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

/**
 * Composable for the Payment Request API (`stripe.paymentRequest()`): Apple Pay,
 * Google Pay and browser-saved cards behind your own button.
 *
 * Creates the `PaymentRequest` once Stripe.js has loaded, resolves `canMakePayment()`
 * into a ref, forwards `show` / `update` / `abort`, and detaches every handler
 * registered through `on` when the calling component unmounts. Stripe recommends the
 * Express Checkout Element (`VueStripeExpressCheckoutElement`) for new integrations.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePaymentRequest } from '@vue-stripe/vue-stripe'
 *
 * const { canMakePayment, show, on } = usePaymentRequest({
 *   country: 'US',
 *   currency: 'usd',
 *   total: { label: 'Order total', amount: 1099 }
 * })
 *
 * on('paymentmethod', async (event) => {
 *   // Confirm the PaymentIntent with event.paymentMethod.id, then:
 *   event.complete('success')
 * })
 * </script>
 *
 * <template>
 *   <button v-if="canMakePayment" @click="show">Pay with a wallet</button>
 * </template>
 * ```
 */
export function usePaymentRequest(options: PaymentRequestOptions): UsePaymentRequestReturn {
  const stripeInstance = injectStripe('usePaymentRequest')

  // shallowRef: Stripe's object must never be made deeply reactive.
  const paymentRequest = shallowRef<PaymentRequest | null>(null)
  const canMakePayment = ref<CanMakePaymentResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const listeners: Listener[] = []
  // Bumped whenever the current request is replaced, so a stale canMakePayment() is ignored.
  let generation = 0

  const emitter = (pr: PaymentRequest) => pr as unknown as Emitter

  const release = () => {
    generation++
    const pr = paymentRequest.value
    if (pr) {
      for (const { event, handler } of listeners) emitter(pr).off(event, handler)
    }
    paymentRequest.value = null
    canMakePayment.value = null
    loading.value = false
  }

  const create = (stripe: Stripe) => {
    release()
    error.value = null

    let pr: PaymentRequest
    try {
      pr = stripe.paymentRequest(options)
    } catch (err) {
      error.value = messageOf(err, 'Failed to create the PaymentRequest')
      return
    }

    paymentRequest.value = pr
    for (const { event, handler } of listeners) emitter(pr).on(event, handler)

    const current = generation
    loading.value = true
    pr.canMakePayment().then(
      (result) => {
        if (current !== generation) return
        canMakePayment.value = result
        loading.value = false
      },
      (err: unknown) => {
        if (current !== generation) return
        error.value = messageOf(err, 'Failed to check for a wallet')
        loading.value = false
      }
    )
  }

  watch(
    () => stripeInstance.stripe.value,
    (stripe) => (stripe ? create(stripe) : release()),
    { immediate: true }
  )

  // Run a PaymentRequest method; errors land on the error ref instead of throwing
  // inside the caller's click handler.
  const call = (name: string, run: (pr: PaymentRequest) => void) => {
    const pr = paymentRequest.value
    if (!pr) {
      error.value = 'PaymentRequest is not ready'
      return
    }
    try {
      run(pr)
      error.value = null
    } catch (err) {
      error.value = messageOf(err, `Failed to call ${name}()`)
    }
  }

  const off = <K extends PaymentRequestEventType>(
    event: K,
    handler?: PaymentRequestEventHandler<K>
  ) => {
    const removed = listeners.filter(
      (listener) => listener.event === event && (!handler || listener.handler === handler)
    )
    for (const listener of removed) {
      listeners.splice(listeners.indexOf(listener), 1)
      if (paymentRequest.value) emitter(paymentRequest.value).off(event, listener.handler)
    }
  }

  const on = <K extends PaymentRequestEventType>(
    event: K,
    handler: PaymentRequestEventHandler<K>
  ) => {
    listeners.push({ event, handler })
    if (paymentRequest.value) emitter(paymentRequest.value).on(event, handler)
    return () => off(event, handler)
  }

  // Stripe's own once() would bypass the listener list that moves handlers to a new
  // request and detaches them on dispose, so build it on on() / off().
  const once = <K extends PaymentRequestEventType>(
    event: K,
    handler: PaymentRequestEventHandler<K>
  ) => {
    const deliver = handler as (...args: unknown[]) => unknown
    const wrapper = ((...args: unknown[]) => {
      off(event, wrapper)
      return deliver(...args)
    }) as PaymentRequestEventHandler<K>
    return on(event, wrapper)
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      const pr = paymentRequest.value
      // A sheet left open would deliver its payment to handlers that no longer exist.
      if (pr?.isShowing()) pr.abort()
      release()
      listeners.length = 0
    })
  }

  return {
    // computed, not readonly(): Vue 2.7's readonly() would wrap Stripe's object in a copy.
    paymentRequest: computed(() => paymentRequest.value),
    canMakePayment: computed(() => canMakePayment.value),
    show: () => call('show', (pr) => pr.show()),
    update: (updateOptions) => call('update', (pr) => pr.update(updateOptions)),
    abort: () => call('abort', (pr) => pr.abort()),
    isShowing: () => paymentRequest.value?.isShowing() ?? false,
    on,
    once,
    off,
    loading: readonly(loading),
    error: readonly(error)
  }
}
