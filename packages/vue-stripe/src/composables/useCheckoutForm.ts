import { inject, readonly } from 'vue-demi'
import type {
  Appearance,
  CssFontSource,
  CustomFontSource,
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutSession
} from '@stripe/stripe-js'
import type { UseCheckoutFormReturn } from '../types'
import { stripeCheckoutFormInjectionKey } from '../utils/injection-keys'
import { VueStripeCheckoutError } from '../utils/errors'

/**
 * Drive a Checkout Form integration (Stripe.js Checkout Form SDK, `ui_mode: 'form'`;
 * Stripe beta).
 *
 * Exposes the reactive session plus the Form SDK's actions (`confirm`,
 * `applyPromotionCode`, `updateLineItemQuantity`, ...). The form itself collects
 * email, phone, addresses and tax IDs, so those update actions do not exist here.
 * Must be used within `<VueStripeCheckoutFormProvider>`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCheckoutForm } from '@vue-stripe/vue-stripe'
 *
 * const { confirm } = useCheckoutForm()
 *
 * const onConfirm = (event) => confirm({ formConfirmEvent: event })
 * </script>
 * ```
 */
export function useCheckoutForm(): UseCheckoutFormReturn {
  const ctx = inject(stripeCheckoutFormInjectionKey, null)

  if (!ctx) {
    throw new VueStripeCheckoutError(
      'useCheckoutForm must be used within a VueStripeCheckoutFormProvider component'
    )
  }

  // Forward an action by name. Generic over the key so a renamed Stripe action
  // fails the build. Before loadActions() resolves, return Stripe's own
  // error-result shape instead of throwing.
  const call = <K extends keyof StripeCheckoutFormLoadActionsSuccess>(
    name: K
  ): StripeCheckoutFormLoadActionsSuccess[K] => {
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
    return wrapped as StripeCheckoutFormLoadActionsSuccess[K]
  }

  // Appearance and fonts live on the SDK handle, which exists before actions load.
  const withCheckout = (method: string, run: () => void) => {
    if (!ctx.checkout.value) {
      console.warn(`[Vue Stripe] ${method} called before the Checkout Form is ready`)
      return
    }
    run()
  }

  return {
    // Casts bridge Vue's DeepReadonly<Ref<...>> to the interface's Readonly<Ref<...>>.
    checkout: readonly(ctx.checkout) as UseCheckoutFormReturn['checkout'],
    actions: readonly(ctx.actions) as UseCheckoutFormReturn['actions'],
    session: readonly(ctx.session) as UseCheckoutFormReturn['session'],
    loading: readonly(ctx.loading),
    error: readonly(ctx.error),

    /** Current session snapshot (imperative; prefer the reactive `session` ref). */
    getSession: (): StripeCheckoutSession | null => ctx.actions.value?.getSession() ?? null,

    /** Pass the form's `@confirm` event as `{ formConfirmEvent }`. */
    confirm: call('confirm'),
    applyPromotionCode: call('applyPromotionCode'),
    removePromotionCode: call('removePromotionCode'),
    updateLineItemQuantity: call('updateLineItemQuantity'),
    updateShippingOption: call('updateShippingOption'),
    runServerUpdate: call('runServerUpdate'),
    validateElements: call('validateElements'),
    addOptionalLineItem: call('addOptionalLineItem'),
    removeOptionalLineItem: call('removeOptionalLineItem'),

    /** Update the appearance of the form at runtime (no `rules`). */
    changeAppearance: (appearance: Omit<Appearance, 'rules'>): void =>
      withCheckout('changeAppearance', () => ctx.checkout.value?.changeAppearance(appearance)),
    /** Load additional fonts into the form. */
    loadFonts: (fonts: Array<CssFontSource | CustomFontSource>): void =>
      withCheckout('loadFonts', () => ctx.checkout.value?.loadFonts(fonts)),

    /** The form created on this SDK (`checkoutFormSdk.getForm()`); null until it exists. */
    getForm: () => ctx.checkout.value?.getForm() ?? null,
    /** The Currency Selector created on this SDK; null until it exists. */
    getCurrencySelectorElement: () => ctx.checkout.value?.getCurrencySelectorElement() ?? null
  } satisfies UseCheckoutFormReturn
}
