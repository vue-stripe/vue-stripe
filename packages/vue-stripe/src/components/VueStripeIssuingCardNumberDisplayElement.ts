import type {
  StripeIssuingCardNumberDisplayElement,
  StripeIssuingCardNumberDisplayElementOptions
} from '@stripe/stripe-js'
import { createStripeElement } from '../utils/element-factory'

type IssuingCardNumberDisplayEvents = { ready: [element: StripeIssuingCardNumberDisplayElement] }

/**
 * Issuing card number display: shows the card number of an issued card in a Stripe-hosted iframe.
 * Pass `{ issuingCard, nonce, ephemeralKeySecret }` (nonce from `stripe.createEphemeralKeyNonce()`,
 * ephemeral key minted server-side for that nonce). Use within `<VueStripeElements>`.
 * Emits `ready` (Stripe.js 10 declares no other event for it).
 * @see https://docs.stripe.com/issuing/elements
 */
export default /* @__PURE__ */ createStripeElement<
  StripeIssuingCardNumberDisplayElementOptions,
  StripeIssuingCardNumberDisplayElement,
  Record<never, never>,
  IssuingCardNumberDisplayEvents
>({
  elementType: 'issuingCardNumberDisplay',
  componentName: 'VueStripeIssuingCardNumberDisplayElement',
  events: ['ready'],
  className: 'vue-stripe-issuing-card-number-display-element',
  loadingText: 'Loading card number...'
})
