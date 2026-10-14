// Where each Vue Stripe export is documented in the API reference. The pages are derived from
// the export name, so a new component or composable gets its link without an entry here.
// Kept free of Vite-only APIs: the /coverage page (./coverage-links.ts) and the build-time
// bundle size measurement (./measure-bundle.ts) both use it.

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// Components whose API page is not stripe-<kebab name>.
const COMPONENT_PAGES: Record<string, string> = {
  VueStripeCardNumberElement: 'stripe-split-card-elements',
  VueStripeCardExpiryElement: 'stripe-split-card-elements',
  VueStripeCardCvcElement: 'stripe-split-card-elements',
  VueStripeCheckoutElementsProvider: 'stripe-checkout-provider',
  VueStripeIssuingCardNumberDisplayElement: 'stripe-issuing-elements',
  VueStripeIssuingCardCvcDisplayElement: 'stripe-issuing-elements',
  VueStripeIssuingCardExpiryDisplayElement: 'stripe-issuing-elements',
  VueStripeIssuingCardPinDisplayElement: 'stripe-issuing-elements',
  VueStripeIssuingCardCopyButtonElement: 'stripe-issuing-elements',
  VueStripeIssuingAddToWalletButtonElement: 'stripe-issuing-elements'
}

/**
 * API reference path for a Vue Stripe export, or undefined when it has none. `confirmPages`
 * holds the method-confirmer family pages (api/composables/confirm/*.md) by file path, as
 * text: a confirmer links to the heading that documents it.
 */
export function apiLinkIn(
  artifact: string,
  confirmPages: Record<string, string>
): string | undefined {
  if (artifact === 'createVueStripe') return '/api/plugin'
  if (artifact.startsWith('VueStripe')) {
    const page = COMPONENT_PAGES[artifact] ?? `stripe-${kebab(artifact.slice('VueStripe'.length))}`
    return `/api/components/${page}`
  }
  if (/^useConfirm\w+(Payment|Setup)$/.test(artifact)) {
    const heading = new RegExp(`^#{2,3} ${artifact}$`, 'm')
    for (const [file, text] of Object.entries(confirmPages)) {
      if (heading.test(text)) {
        const family = file.split('/').pop()!.replace(/\.md$/, '')
        return `/api/composables/confirm/${family}#${artifact.toLowerCase()}`
      }
    }
    return undefined
  }
  if (artifact.startsWith('use')) return `/api/composables/${kebab(artifact)}`
  return undefined
}
