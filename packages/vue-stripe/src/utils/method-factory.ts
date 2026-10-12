import { inject, readonly, ref } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { Stripe } from '@stripe/stripe-js'
import { stripeInjectionKey } from './injection-keys'
import { VueStripeProviderError } from './errors'

/** Names of the methods on the Stripe.js `Stripe` instance. */
export type StripeMethodName = {
  [K in keyof Stripe]: Stripe[K] extends (...args: never[]) => unknown ? K : never
}[keyof Stripe]

/**
 * What a method composable returns: the Stripe method under its own name, typed
 * as `Stripe[K]` (every overload kept in sync with `@stripe/stripe-js`), plus the
 * state of its calls.
 */
export type UseStripeMethodReturn<K extends StripeMethodName> = { [P in K]: Stripe[P] } & {
  /** `true` while a call is in flight. */
  loading: Readonly<Ref<boolean>>
  /** Message of the last call's Stripe `{ error }` result or thrown error; reset on each call. */
  error: Readonly<Ref<string | null>>
}

/**
 * Shared by the method composables. Injects the Stripe instance from
 * `<VueStripeProvider>` (throwing `VueStripeProviderError` naming `composable`
 * outside one) and returns `{ [method], loading, error }`, where `[method](...args)`
 * resolves to `run(stripe, args)` untouched: an `{ error }` result also sets `error`,
 * and a throw is recorded in `error` and rethrown. `loading` stays true until
 * overlapping calls settle.
 */
export function useStripeMethodCall(
  composable: string,
  method: string,
  run: (stripe: Stripe, args: unknown[]) => unknown
) {
  const stripeInstance = inject(stripeInjectionKey)

  if (!stripeInstance) {
    throw new VueStripeProviderError(
      `${composable} must be called within a VueStripeProvider component`
    )
  }

  const loading = ref(false)
  const error = ref<string | null>(null)
  // Overlapping calls: stay loading until the last one settles.
  let pending = 0

  return {
    [method]: async (...args: unknown[]) => {
      pending++
      loading.value = true
      error.value = null

      try {
        const stripe = stripeInstance.stripe.value
        if (!stripe) throw new VueStripeProviderError('Stripe.js is not loaded yet')

        const result = await run(stripe, args)

        const stripeError = (result as { error?: { message?: string } } | undefined)?.error
        if (stripeError) error.value = stripeError.message || `${method} failed`

        return result
      } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
        throw err
      } finally {
        loading.value = --pending > 0
      }
    },
    loading: readonly(loading),
    error: readonly(error)
  }
}

/**
 * Build a composable that wraps one Stripe.js method, e.g.
 * `createStripeMethodComposable('confirmCardPayment')` gives `useConfirmCardPayment()`
 * returning `{ confirmCardPayment, loading, error }`.
 *
 * The composable injects the Stripe instance from `<VueStripeProvider>` (throwing
 * `VueStripeProviderError` outside one). The wrapped method forwards its arguments,
 * resolves to Stripe's result untouched (an `{ error }` result also sets `error`),
 * and rethrows anything Stripe throws after recording it in `error`.
 *
 * `composableName` (default `use<Method>`) names the composable in that error,
 * for composables named differently from the method (`useRadarSession`).
 */
export function createStripeMethodComposable<K extends StripeMethodName>(
  name: K,
  composableName = `use${name.charAt(0).toUpperCase()}${name.slice(1)}`
): () => UseStripeMethodReturn<K> {
  return () =>
    useStripeMethodCall(composableName, name, (stripe, args) =>
      (stripe[name] as unknown as (...params: unknown[]) => unknown).apply(stripe, args)
    ) as unknown as UseStripeMethodReturn<K>
}
