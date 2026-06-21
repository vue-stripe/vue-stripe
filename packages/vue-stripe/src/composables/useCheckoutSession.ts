import { inject, readonly } from 'vue-demi'
import type { Appearance, StripeCheckoutSession } from '@stripe/stripe-js'
import type { UseCheckoutSessionReturn } from '../types'
import { stripeCheckoutInjectionKey, type StripeCheckoutActions } from '../utils/injection-keys'
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

  // Forward a Checkout session action by name. In stripe-js 8.x the session
  // methods live on the object returned by `checkout.loadActions()`, exposed
  // here as `ctx.actions`. Generic over the key so an invalid name fails the
  // build (instead of silently resolving to the not-ready result if
  // `@stripe/stripe-js` ever renames a method). When called before the actions
  // are loaded it resolves a graceful sentinel matching Stripe's result-union
  // shape ({ type: 'error', error: { message, code } }).
  const call = <K extends keyof StripeCheckoutActions>(name: K): StripeCheckoutActions[K] => {
    const wrapped = (...args: unknown[]) => {
      const actions = ctx.actions.value
      const fn = actions?.[name]
      if (typeof fn !== 'function') {
        return Promise.resolve({
          type: 'error',
          error: { message: 'Checkout session is not ready yet', code: null }
        })
      }
      return (fn as (...a: unknown[]) => unknown).apply(actions, args)
    }
    return wrapped as StripeCheckoutActions[K]
  }

  return {
    // Cast bridges Vue's DeepReadonly<Ref<…>> to the interface's shallow
    // Readonly<Ref<…>> (the session contains nested arrays). `satisfies` below
    // still structurally verifies every method against StripeCheckout.
    checkout: readonly(ctx.checkout) as UseCheckoutSessionReturn['checkout'],
    session: readonly(ctx.session) as UseCheckoutSessionReturn['session'],
    loading: readonly(ctx.loading),
    error: readonly(ctx.error),

    /** Current session snapshot (imperative; prefer the reactive `session` ref). */
    getSession: (): StripeCheckoutSession | null => ctx.actions.value?.getSession() ?? null,

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
    changeAppearance: (appearance: Appearance): void => {
      if (!ctx.checkout.value) {
        console.warn('[Vue Stripe] changeAppearance called before the Checkout session is ready')
        return
      }
      ctx.checkout.value.changeAppearance(appearance)
    }
  } satisfies UseCheckoutSessionReturn
}
