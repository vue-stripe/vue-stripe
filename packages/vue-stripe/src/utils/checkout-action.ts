import type { Ref } from 'vue-demi'

const errorResult = (message: string) =>
  Promise.resolve({ type: 'error' as const, error: { message, code: null } })

/**
 * Forwards a Checkout SDK session action by name (useCheckoutSession, useCheckoutForm)
 * and keeps Stripe's `{ type: 'success' | 'error' }` result contract for every
 * outcome: before `loadActions()` resolves, when the loaded session has no such
 * action, and when Stripe.js throws an integration error instead of resolving.
 */
export function forwardCheckoutAction(actions: Ref<object | null>, name: string) {
  return (...args: unknown[]): Promise<unknown> => {
    const current = actions.value
    if (!current) return errorResult('Checkout session is not ready yet')
    const fn = (current as Record<string, unknown>)[name]
    if (typeof fn !== 'function') {
      return errorResult(`${name} is not available for this Checkout Session`)
    }
    try {
      return Promise.resolve(fn.apply(current, args)).catch((err: unknown) =>
        errorResult(err instanceof Error ? err.message : String(err))
      )
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  }
}
