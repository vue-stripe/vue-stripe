import type {
  StripeCheckoutForm,
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormOptions,
  StripeCheckoutFormValue
} from '@stripe/stripe-js'
import type { ElementTypeEvent, LoadErrorEvent, LoadStartEvent } from '../utils/element-factory'
import { createStripeElement } from '../utils/element-factory'

type CheckoutFormEvents = {
  ready: [element: StripeCheckoutForm]
  change: [event: StripeCheckoutFormChangeEvent]
  confirm: [event: StripeCheckoutFormConfirmEvent]
  cancel: [event: { elementType: 'checkoutForm' }]
  focus: ElementTypeEvent<'checkoutForm'>
  blur: ElementTypeEvent<'checkoutForm'>
  escape: ElementTypeEvent<'checkoutForm'>
  loaderstart: LoadStartEvent<'checkoutForm'>
  loaderror: LoadErrorEvent<'checkoutForm'>
}

type CheckoutFormExposed = {
  /** The form's current values and section statuses (`form.getValue()`). */
  getValue: () => Promise<StripeCheckoutFormValue | undefined>
  /** Go to a view of the compact layout (index into the change event's `views`). */
  setView: (viewIndex: number) => Promise<void>
}

/**
 * Checkout Form: Stripe's complete checkout form (contact, addresses, shipping, tax ID,
 * express checkout and payment) from `sdk.createForm()`. Stripe beta. Use within
 * `<VueStripeCheckoutFormProvider>`; confirm from `@confirm` with
 * `useCheckoutForm().confirm({ formConfirmEvent: event })`.
 */
export default /* @__PURE__ */ createStripeElement<
  StripeCheckoutFormOptions,
  StripeCheckoutForm,
  CheckoutFormExposed,
  CheckoutFormEvents
>({
  elementType: 'checkoutForm',
  componentName: 'VueStripeCheckoutForm',
  events: [
    'ready',
    'change',
    'confirm',
    'cancel',
    'focus',
    'blur',
    'escape',
    'loaderstart',
    'loaderror'
  ],
  // elements.create() has no Checkout Form; only the Form SDK creates it.
  elements: false,
  checkoutForm: (sdk, options) => sdk.createForm(options),
  expose: (element) => ({
    getValue: async () => element.value?.getValue?.(),
    setView: async (viewIndex: number) =>
      (element.value as StripeCheckoutForm | null)?.setView(viewIndex)
  }),
  className: 'vue-stripe-checkout-form',
  loadingText: 'Loading checkout form...'
})
