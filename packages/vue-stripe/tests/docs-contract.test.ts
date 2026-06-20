import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Doc/API contract test (scaffold — issue #421).
 *
 * Extracts the real event surface (`defineEmits`) of each component from source
 * and checks the matching VitePress API doc page documents each event. This
 * guards against the docs drift catalogued in milestone "v5.4 Documentation
 * Accuracy" (e.g. missing @escape rows, undocumented @loaderror).
 *
 * ENFORCING MODE: the milestone #4 doc-accuracy fixes have landed, so this now
 * fails on any event documented/emitted mismatch by default. Set
 * DOCS_CONTRACT_STRICT=0 to temporarily downgrade mismatches to warnings.
 *
 * TODO (follow-ups): extend the contract to props (defineProps), exposed
 * members (defineExpose) and composable return shapes.
 */

const STRICT = process.env.DOCS_CONTRACT_STRICT !== '0'

const here = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = resolve(here, '../src/components')
const FACTORY = resolve(here, '../src/utils/element-factory.ts')
const DOCS_DIR = resolve(here, '../../../apps/docs/api/components')

/** Component file -> API doc page. Factory-based split-card share one page. */
const MAP: Array<{ component: string; doc: string; viaFactory?: boolean }> = [
  { component: 'VueStripeProvider.vue', doc: 'stripe-provider.md' },
  { component: 'VueStripeElements.vue', doc: 'stripe-elements.md' },
  { component: 'VueStripePaymentElement.vue', doc: 'stripe-payment-element.md' },
  { component: 'VueStripeExpressCheckoutElement.vue', doc: 'stripe-express-checkout-element.md' },
  { component: 'VueStripeCardElement.vue', doc: 'stripe-card-element.md' },
  { component: 'VueStripeCardNumberElement.vue', doc: 'stripe-split-card-elements.md', viaFactory: true },
  { component: 'VueStripeCardExpiryElement.vue', doc: 'stripe-split-card-elements.md', viaFactory: true },
  { component: 'VueStripeCardCvcElement.vue', doc: 'stripe-split-card-elements.md', viaFactory: true },
  { component: 'VueStripeLinkAuthenticationElement.vue', doc: 'stripe-link-authentication-element.md' },
  { component: 'VueStripeAddressElement.vue', doc: 'stripe-address-element.md' },
  { component: 'VueStripeIbanElement.vue', doc: 'stripe-iban-element.md' },
  { component: 'VueStripeIdealBankElement.vue', doc: 'stripe-ideal-bank-element.md' },
  { component: 'VueStripeP24BankElement.vue', doc: 'stripe-p24-bank-element.md' },
  { component: 'VueStripeEpsBankElement.vue', doc: 'stripe-eps-bank-element.md' },
  { component: 'VueStripeFpxBankElement.vue', doc: 'stripe-fpx-bank-element.md' },
  { component: 'VueStripeAuBankAccountElement.vue', doc: 'stripe-au-bank-account-element.md' },
  { component: 'VueStripeCheckout.vue', doc: 'stripe-checkout.md' },
  { component: 'VueStripePricingTable.vue', doc: 'stripe-pricing-table.md' }
]

/** Normalize an event name for naming-style-insensitive comparison. */
const canon = (name: string) => name.toLowerCase().replace(/-/g, '')

/** Extract emitted event names from a component (or the factory). */
function extractEmits(source: string): string[] {
  const names = new Set<string>()
  // setup() / interface form: `(e: 'ready', ...)`
  for (const m of source.matchAll(/\(\s*e:\s*['"]([\w-]+)['"]/g)) names.add(m[1])
  // array form: `emits: ['ready', 'change', ...]`
  const arr = source.match(/emits:\s*\[([^\]]*)\]/)
  if (arr) for (const m of arr[1].matchAll(/['"]([\w-]+)['"]/g)) names.add(m[1])
  return [...names]
}

/** Collect every `@event` token mentioned anywhere in a doc page. */
function documentedEvents(doc: string): Set<string> {
  const set = new Set<string>()
  for (const m of doc.matchAll(/@([\w-]+)/g)) set.add(canon(m[1]))
  return set
}

const factorySource = existsSync(FACTORY) ? readFileSync(FACTORY, 'utf8') : ''

describe('docs/API contract: component events', () => {
  it('source and docs directories exist', () => {
    expect(existsSync(COMPONENTS_DIR)).toBe(true)
    expect(existsSync(DOCS_DIR)).toBe(true)
  })

  it.each(MAP)('$component events are documented in $doc', ({ component, doc, viaFactory }) => {
    const componentPath = resolve(COMPONENTS_DIR, component)
    const docPath = resolve(DOCS_DIR, doc)
    expect(existsSync(componentPath), `missing component ${component}`).toBe(true)
    expect(existsSync(docPath), `missing doc page ${doc}`).toBe(true)

    const source = viaFactory ? factorySource : readFileSync(componentPath, 'utf8')
    const emits = extractEmits(source)
    const documented = documentedEvents(readFileSync(docPath, 'utf8'))

    const missing = emits.filter((e) => !documented.has(canon(e)))

    if (missing.length > 0) {
      const msg = `[docs-contract] ${component}: events not documented in ${doc}: ${missing.map((e) => '@' + e).join(', ')}`
      if (STRICT) {
        expect.fail(msg)
      } else {
        // Scaffold mode: report drift without failing CI. Flip STRICT after
        // milestone #4 doc fixes land.
        console.warn(msg)
      }
    }

    // Always assert extraction worked (the component declares >= 0 events and
    // the page was parsed) so the harness itself is verified.
    expect(Array.isArray(emits)).toBe(true)
  })
})
