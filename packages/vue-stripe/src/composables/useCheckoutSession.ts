import { inject, readonly } from 'vue-demi'
import type { Appearance, StripeCheckoutSession } from '@stripe/stripe-js'
import type { UseCheckoutSessionReturn } from '../types'
import { stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeCheckoutError } from '../utils/errors'

/**
 * Composable for driving a Custom Checkout session.
 *
 * Exposes the reactive session state plus the Checkout Session methods
 * (`confirm`, `applyPromotionCode`, `updateEmail`, …). Must be used within a
 * `<VueStripeCheckoutProvider>`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCheckoutSession } from '@vue-stripe/vue-stripe'
 *
 * const { session, confirm, updateEmail, applyPromotionCode } = useCheckoutSession()
 *
 * const pay = () => confirm({ returnUrl: window.location.href })
 * </script>
 * ```
 */
export function useCheckoutSession(): UseCheckoutSessionReturn {
  const ctx = inject(stripeCheckoutInjectionKey)

  if (!ctx) {
    throw new VueStripeCheckoutError(
      'useCheckoutSession must be used within a VueStripeCheckoutProvider component'
    )
  }

  // Wrap each Checkout method so it forwards to the live instance and fails
  // gracefully (rather than throwing) if called before the session is ready.
  const call = (name: string) => (...args: unknown[]) => {
    const instance = ctx.checkout.value as unknown as
      | Record<string, ((...a: unknown[]) => unknown) | undefined>
      | null
    const fn = instance?.[name]
    if (typeof fn !== 'function') {
      return Promise.resolve({
        type: 'error',
        error: { message: 'Checkout session is not ready yet' }
      })
    }
    return fn(...args)
  }

  return {
    checkout: readonly(ctx.checkout),
    session: readonly(ctx.session),
    loading: readonly(ctx.loading),
    error: readonly(ctx.error),

    /** Current session snapshot (imperative; prefer the reactive `session` ref). */
    getSession: (): StripeCheckoutSession | null => ctx.checkout.value?.session() ?? null,

    confirm: call('confirm'),
    applyPromotionCode: call('applyPromotionCode'),
    removePromotionCode: call('removePromotionCode'),
    updateEmail: call('updateEmail'),
    updatePhoneNumber: call('updatePhoneNumber'),
    updateBillingAddress: call('updateBillingAddress'),
    updateShippingAddress: call('updateShippingAddress'),
    updateLineItemQuantity: call('updateLineItemQuantity'),
    updateShippingOption: call('updateShippingOption'),
    updateTaxIdInfo: call('updateTaxIdInfo'),
    runServerUpdate: call('runServerUpdate'),

    /** Update the appearance of all Checkout Elements at runtime. */
    changeAppearance: (appearance: Appearance): void =>
      ctx.checkout.value?.changeAppearance(appearance)
  } as UseCheckoutSessionReturn
}
