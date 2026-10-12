import type {
  StripeIssuingAddToWalletButtonElement,
  StripeIssuingAddToWalletButtonElementOptions
} from '@stripe/stripe-js'
import { createStripeElement } from '../utils/element-factory'

type WalletEvent = [event: { elementType: 'issuingAddToWalletButton' }]
type IssuingAddToWalletButtonEvents = { click: WalletEvent; success: WalletEvent }

/**
 * Issuing Add to Wallet button (Stripe private preview): provisions an issued card into a wallet
 * (`:options="{ issuingCard, nonce, ephemeralKeySecret, wallet: 'apple' }"`). Needs the betas
 * `issuing_add_to_wallet_button_element_1` and `issuing_elements_2` on `<VueStripeProvider>`.
 * Emits `click`, then `success` when the wallet flow completes. Use within `<VueStripeElements>`.
 *
 * Stripe.js 10.0.0 lists 'issuingAddToWalletButton' in `StripeElementType` but has no typed
 * `elements.create()` overload for it; the factory calls `create()` through its own
 * string-typed signature, so the element and option types are applied here instead.
 * @see https://docs.stripe.com/issuing/cards/digital-wallets
 */
export default /* @__PURE__ */ createStripeElement<
  StripeIssuingAddToWalletButtonElementOptions,
  StripeIssuingAddToWalletButtonElement,
  Record<never, never>,
  IssuingAddToWalletButtonEvents
>({
  elementType: 'issuingAddToWalletButton',
  componentName: 'VueStripeIssuingAddToWalletButtonElement',
  events: ['click', 'success'],
  className: 'vue-stripe-issuing-add-to-wallet-button-element',
  loadingText: 'Loading Add to Wallet button...'
})
