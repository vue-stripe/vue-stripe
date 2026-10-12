import type {
  StripeIssuingCardCopyButtonElement,
  StripeIssuingCardCopyButtonElementOptions
} from '@stripe/stripe-js'
import { createStripeElement } from '../utils/element-factory'

type IssuingCardCopyButtonEvents = { click: [event: { elementType: 'issuingCardCopyButton' }] }

/**
 * Issuing card copy button: copies one detail of the issued card shown by the display elements
 * in the same `<VueStripeElements>` to the clipboard, e.g. `:options="{ toCopy: 'number' }"`
 * (`'number' | 'cvc' | 'expiry' | 'pin'`). Emits `click`.
 * @see https://docs.stripe.com/issuing/elements
 */
export default /* @__PURE__ */ createStripeElement<
  StripeIssuingCardCopyButtonElementOptions,
  StripeIssuingCardCopyButtonElement,
  Record<never, never>,
  IssuingCardCopyButtonEvents
>({
  elementType: 'issuingCardCopyButton',
  componentName: 'VueStripeIssuingCardCopyButtonElement',
  events: ['click'],
  className: 'vue-stripe-issuing-card-copy-button-element',
  loadingText: 'Loading copy button...'
})
