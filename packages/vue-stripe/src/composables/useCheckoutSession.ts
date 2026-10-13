import { computed, inject, readonly } from 'vue-demi'
import type {
  Appearance,
  CssFontSource,
  CustomFontSource,
  StripeCheckoutElementsSdk,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession
} from '@stripe/stripe-js'
import type { UseCheckoutSessionReturn } from '../types'
import { stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeCheckoutError } from '../utils/errors'

type ElementGetter = Extract<keyof StripeCheckoutElementsSdk, `get${string}Element`>

/**
 * Drive an Elements-with-Checkout-Sessions integration (Stripe.js Checkout Elements SDK).
 *
 * Exposes the reactive session plus every session action (`confirm`,
 * `applyPromotionCode`, `updateEmail`, `validateElements`, ...) and the SDK's
 * element getters (`getPaymentElement`, ...). Must be used
 * within `<VueStripeCheckoutElementsProvider>`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCheckoutSession } from '@vue-stripe/vue-stripe'
 *
 * const { session, confirm, loading } = useCheckoutSession()
 *
 * const pay = () => confirm({ returnUrl: window.location.href })
 * </script>
 * ```
 */
export function useCheckoutSession(): UseCheckoutSessionReturn {
  const ctx = inject(stripeCheckoutInjectionKey, null)

  if (!ctx) {
    throw new VueStripeCheckoutError(
      'useCheckoutSession must be used within a VueStripeCheckoutElementsProvider component'
    )
  }

  // Forward an action by name. Generic over the key so a renamed Stripe action
  // fails the build. Before loadActions() resolves, return Stripe's own
  // error-result shape instead of throwing.
  const call = <K extends keyof StripeCheckoutLoadActionsSuccess>(
    name: K
  ): StripeCheckoutLoadActionsSuccess[K] => {
    const wrapped = (...args: unknown[]) => {
      const current = ctx.actions.value
      const fn = current?.[name]
      if (typeof fn !== 'function') {
        return Promise.resolve({
          type: 'error',
          error: { message: 'Checkout session is not ready yet', code: null }
        })
      }
      return (fn as (...a: unknown[]) => unknown).apply(current, args)
    }
    return wrapped as StripeCheckoutLoadActionsSuccess[K]
  }

  // Appearance and fonts live on the SDK handle, which exists before actions load.
  const withCheckout = (method: string, run: () => void) => {
    if (!ctx.checkout.value) {
      console.warn(`[Vue Stripe] ${method} called before the Checkout session is ready`)
      return
    }
    run()
  }

  // Element getters also live on the SDK handle; null until it exists.
  const getter = <K extends ElementGetter>(name: K) =>
    (() => ctx.checkout.value?.[name]() ?? null) as StripeCheckoutElementsSdk[K]

  return {
    // computed, not readonly(): Vue 2.7's readonly() copies plain objects, so Stripe's
    // objects would reach callers as copies (identity lost, methods run on the copy).
    checkout: computed(() => ctx.checkout.value),
    actions: computed(() => ctx.actions.value),
    session: computed(() => ctx.session.value),
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
    validateElements: call('validateElements'),
    addOptionalLineItem: call('addOptionalLineItem'),
    removeOptionalLineItem: call('removeOptionalLineItem'),

    /** Update the appearance of all Checkout elements at runtime. */
    changeAppearance: (appearance: Appearance): void =>
      withCheckout('changeAppearance', () => ctx.checkout.value?.changeAppearance(appearance)),
    /** Load additional fonts into the Checkout elements. */
    loadFonts: (fonts: Array<CssFontSource | CustomFontSource>): void =>
      withCheckout('loadFonts', () => ctx.checkout.value?.loadFonts(fonts)),

    /** Elements created on this Checkout session (`checkout.get*Element()`). */
    getPaymentElement: getter('getPaymentElement'),
    getBillingAddressElement: getter('getBillingAddressElement'),
    getShippingAddressElement: getter('getShippingAddressElement'),
    getExpressCheckoutElement: getter('getExpressCheckoutElement'),
    getCurrencySelectorElement: getter('getCurrencySelectorElement'),
    getTaxIdElement: getter('getTaxIdElement'),
    getTermsElement: getter('getTermsElement'),
    getLinkSignupElement: getter('getLinkSignupElement')
  } satisfies UseCheckoutSessionReturn
}
