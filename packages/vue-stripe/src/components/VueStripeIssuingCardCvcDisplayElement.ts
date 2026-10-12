import type {
  StripeIssuingCardCvcDisplayElement,
  StripeIssuingCardCvcDisplayElementOptions
} from '@stripe/stripe-js'
import { createStripeElement } from '../utils/element-factory'

/**
 * Issuing CVC display: shows the CVC of an issued card in a Stripe-hosted iframe.
 * Pass `{ issuingCard, nonce, ephemeralKeySecret }` (nonce from `stripe.createEphemeralKeyNonce()`,
 * ephemeral key minted server-side for that nonce). Use within `<VueStripeElements>`.
 * Stripe.js 10 declares no events for it, so it is shown as soon as it is mounted.
 * @see https://docs.stripe.com/issuing/elements
 */
export default /* @__PURE__ */ createStripeElement<
  StripeIssuingCardCvcDisplayElementOptions,
  StripeIssuingCardCvcDisplayElement,
  Record<never, never>,
  Record<never, never>
>({
  elementType: 'issuingCardCvcDisplay',
  componentName: 'VueStripeIssuingCardCvcDisplayElement',
  events: [],
  className: 'vue-stripe-issuing-card-cvc-display-element',
  loadingText: 'Loading CVC...'
})
