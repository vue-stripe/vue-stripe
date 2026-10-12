import type {
  StripeIssuingCardExpiryDisplayElement,
  StripeIssuingCardExpiryDisplayElementOptions
} from '@stripe/stripe-js'
import { createStripeElement } from '../utils/element-factory'

/**
 * Issuing expiry date display: shows the expiry date of an issued card in a Stripe-hosted iframe.
 * Pass `{ issuingCard, nonce, ephemeralKeySecret }` (nonce from `stripe.createEphemeralKeyNonce()`,
 * ephemeral key minted server-side for that nonce). Use within `<VueStripeElements>`.
 * Stripe.js 10 declares no events for it, so it is shown as soon as it is mounted.
 * @see https://docs.stripe.com/issuing/elements
 */
export default /* @__PURE__ */ createStripeElement<
  StripeIssuingCardExpiryDisplayElementOptions,
  StripeIssuingCardExpiryDisplayElement,
  Record<never, never>,
  Record<never, never>
>({
  elementType: 'issuingCardExpiryDisplay',
  componentName: 'VueStripeIssuingCardExpiryDisplayElement',
  events: [],
  className: 'vue-stripe-issuing-card-expiry-display-element',
  loadingText: 'Loading expiry date...'
})
