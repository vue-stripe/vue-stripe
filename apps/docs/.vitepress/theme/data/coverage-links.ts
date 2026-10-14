// Quick links for the /coverage page: where each Vue Stripe export is documented
// (API reference), explained (guide) and running (live demo).
//
// API pages are derived from the export name (./api-links.ts), so a new component or composable
// gets its link without an entry here. Guides and demos are listed explicitly below.
// packages/vue-stripe/tests/coverage-matrix.test.ts checks that every link points at an
// existing page (and, for the confirm composables, at an existing heading).

import { apiLinkIn } from './api-links'

export interface DocLinks {
  api?: string
  guide?: string
  demo?: string
}

// The method-confirmer family pages, read as text so the anchor can be found by heading.
const confirmPages = import.meta.glob<string>('../../../api/composables/confirm/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

/** API reference path for a Vue Stripe export, or undefined when it has none. */
export const apiLink = (artifact: string): string | undefined => apiLinkIn(artifact, confirmPages)

const GUIDES: Record<string, string> = {
  VueStripeProvider: '/guide/installation',
  VueStripeElements: '/guide/payment-element',
  useStripe: '/guide/architecture',
  useStripeElements: '/guide/deferred-intent',
  createVueStripe: '/guide/plugin',
  VueStripePaymentElement: '/guide/payment-element',
  usePaymentIntent: '/guide/payment-element',
  VueStripeExpressCheckoutElement: '/guide/express-checkout',
  VueStripeCardElement: '/guide/card-element',
  VueStripeCardNumberElement: '/guide/card-element',
  VueStripeCardExpiryElement: '/guide/card-element',
  VueStripeCardCvcElement: '/guide/card-element',
  VueStripeAddressElement: '/guide/address-element',
  VueStripeLinkAuthenticationElement: '/guide/link-authentication',
  VueStripePaymentMethodMessagingElement: '/guide/payment-method-messaging',
  VueStripeIbanElement: '/guide/iban-element',
  VueStripeAuBankAccountElement: '/guide/au-bank-account-element',
  useConfirmCardPayment: '/guide/card-element',
  useConfirmSepaDebitPayment: '/guide/iban-element',
  useConfirmAuBecsDebitPayment: '/guide/au-bank-account-element',
  VueStripeCheckout: '/guide/checkout',
  useStripeCheckout: '/guide/checkout',
  VueStripeCheckoutElementsProvider: '/guide/custom-checkout',
  useCheckoutSession: '/guide/custom-checkout',
  VueStripeTaxIdElement: '/guide/custom-checkout',
  VueStripeCurrencySelectorElement: '/guide/custom-checkout',
  VueStripeContactDetailsElement: '/guide/custom-checkout',
  VueStripeTermsElement: '/guide/custom-checkout',
  VueStripeLinkSignupElement: '/guide/custom-checkout',
  VueStripeEmbeddedCheckout: '/guide/embedded-checkout',
  VueStripeCheckoutFormProvider: '/guide/checkout-form',
  VueStripeCheckoutForm: '/guide/checkout-form',
  useCheckoutForm: '/guide/checkout-form',
  VueStripePricingTable: '/guide/pricing-table',
  VueStripeIssuingCardNumberDisplayElement: '/guide/issuing',
  VueStripeIssuingCardCvcDisplayElement: '/guide/issuing',
  VueStripeIssuingCardExpiryDisplayElement: '/guide/issuing',
  VueStripeIssuingCardPinDisplayElement: '/guide/issuing',
  VueStripeIssuingCardCopyButtonElement: '/guide/issuing',
  VueStripeIssuingAddToWalletButtonElement: '/guide/issuing',
  VueStripeIssuingDisclosure: '/guide/issuing',
  useEphemeralKeyNonce: '/guide/issuing',
  useSetupIntent: '/guide/setup-intent',
  useHandleNextAction: '/guide/confirming-payments',
  useHandleCardAction: '/guide/confirming-payments',
  useFinancialConnections: '/guide/ach-debit',
  useConfirmUsBankAccountPayment: '/guide/ach-debit',
  useConfirmUsBankAccountSetup: '/guide/ach-debit',
  useVerifyMicrodepositsForPayment: '/guide/ach-debit',
  useVerifyMicrodepositsForSetup: '/guide/ach-debit',
  useIdentity: '/guide/identity',
  useCreateToken: '/guide/tokens',
  useCreateConfirmationToken: '/guide/tokens',
  useCreatePaymentMethod: '/guide/tokens',
  useRadarSession: '/guide/tokens'
}

const DEMOS: Record<string, string> = {
  VueStripePaymentElement: '/live-demo/payment-element',
  usePaymentIntent: '/live-demo/payment-element',
  VueStripeExpressCheckoutElement: '/live-demo/express-checkout',
  VueStripeCardElement: '/live-demo/card-element',
  useConfirmCardPayment: '/live-demo/card-element',
  VueStripeCardNumberElement: '/live-demo/split-card-elements',
  VueStripeCardExpiryElement: '/live-demo/split-card-elements',
  VueStripeCardCvcElement: '/live-demo/split-card-elements',
  VueStripeAddressElement: '/live-demo/address-element',
  VueStripeLinkAuthenticationElement: '/live-demo/link-authentication',
  VueStripePaymentMethodMessagingElement: '/live-demo/payment-method-messaging',
  VueStripeIbanElement: '/live-demo/iban-element',
  useConfirmSepaDebitPayment: '/live-demo/iban-element',
  VueStripeAuBankAccountElement: '/live-demo/becs-payment',
  useConfirmAuBecsDebitPayment: '/live-demo/becs-payment',
  VueStripeCheckout: '/live-demo/checkout-redirect',
  useStripeCheckout: '/live-demo/checkout-redirect',
  VueStripeCheckoutElementsProvider: '/live-demo/custom-checkout',
  useCheckoutSession: '/live-demo/custom-checkout',
  VueStripeCurrencySelectorElement: '/live-demo/custom-checkout',
  VueStripeEmbeddedCheckout: '/live-demo/embedded-checkout',
  VueStripeCheckoutFormProvider: '/live-demo/checkout-form',
  VueStripeCheckoutForm: '/live-demo/checkout-form',
  useCheckoutForm: '/live-demo/checkout-form',
  useSetupIntent: '/live-demo/setup-intent',
  useCreatePaymentMethod: '/live-demo/create-payment-method',
  useCreateToken: '/live-demo/tokens',
  useCreateConfirmationToken: '/live-demo/tokens',
  useRadarSession: '/live-demo/tokens',
  useFinancialConnections: '/live-demo/ach-debit',
  useConfirmUsBankAccountPayment: '/live-demo/ach-debit',
  useIdentity: '/live-demo/identity',
  usePaymentRequest: '/live-demo/payment-request'
}

/** All doc links for an export; the guide falls back to the confirming-payments guide for confirmers. */
export function docLinks(artifact: string | undefined): DocLinks {
  if (!artifact) return {}
  const links: DocLinks = {}
  const api = apiLink(artifact)
  if (api) links.api = api
  const guide =
    GUIDES[artifact] ??
    (/^useConfirm\w+(Payment|Setup)$/.test(artifact) ? '/guide/confirming-payments' : undefined)
  if (guide) links.guide = guide
  const demo = DEMOS[artifact]
  if (demo) links.demo = demo
  return links
}
