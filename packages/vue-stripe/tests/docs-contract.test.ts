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
const factorySource = existsSync(FACTORY) ? readFileSync(FACTORY, 'utf8') : ''

/** Component file -> API doc page. The split card elements share one page. */
const MAP: Array<{ component: string; doc: string }> = [
  { component: 'VueStripeProvider.ts', doc: 'stripe-provider.md' },
  { component: 'VueStripeElements.ts', doc: 'stripe-elements.md' },
  { component: 'VueStripePaymentElement.ts', doc: 'stripe-payment-element.md' },
  { component: 'VueStripeExpressCheckoutElement.ts', doc: 'stripe-express-checkout-element.md' },
  { component: 'VueStripeCardElement.ts', doc: 'stripe-card-element.md' },
  { component: 'VueStripeCardNumberElement.ts', doc: 'stripe-split-card-elements.md' },
  { component: 'VueStripeCardExpiryElement.ts', doc: 'stripe-split-card-elements.md' },
  { component: 'VueStripeCardCvcElement.ts', doc: 'stripe-split-card-elements.md' },
  {
    component: 'VueStripeLinkAuthenticationElement.ts',
    doc: 'stripe-link-authentication-element.md'
  },
  { component: 'VueStripeAddressElement.ts', doc: 'stripe-address-element.md' },
  { component: 'VueStripeIbanElement.ts', doc: 'stripe-iban-element.md' },
  { component: 'VueStripeAuBankAccountElement.ts', doc: 'stripe-au-bank-account-element.md' },
  {
    component: 'VueStripePaymentMethodMessagingElement.ts',
    doc: 'stripe-payment-method-messaging-element.md'
  },
  { component: 'VueStripeTaxIdElement.ts', doc: 'stripe-tax-id-element.md' },
  {
    component: 'VueStripeCurrencySelectorElement.ts',
    doc: 'stripe-currency-selector-element.md'
  },
  { component: 'VueStripeCheckout.ts', doc: 'stripe-checkout.md' },
  { component: 'VueStripeCheckoutElementsProvider.ts', doc: 'stripe-checkout-provider.md' },
  { component: 'VueStripePricingTable.ts', doc: 'stripe-pricing-table.md' }
]

/** Normalize an event name for naming-style-insensitive comparison. */
const canon = (name: string) => name.toLowerCase().replace(/-/g, '')

const quoted = (list: string) => [...list.matchAll(/['"]([\w-]+)['"]/g)].map((m) => m[1] as string)

/** BASE_EVENTS as declared in the element factory. */
function baseEvents(): string[] {
  const decl = factorySource.match(/BASE_EVENTS\s*=\s*\[([^\]]*)\]/)
  return decl ? quoted(decl[1] as string) : []
}

/**
 * Extract the emitted event names of a component: the `events:` list of a factory
 * definition (`...BASE_EVENTS` expanded; no list means BASE_EVENTS), or the
 * `defineEmits` / `emits` declarations of a component with its own setup.
 */
function extractEmits(source: string): string[] {
  const names = new Set<string>()
  if (/createStripeElement[<(]/.test(source)) {
    const list = source.match(/events:\s*\[([^\]]*)\]/)
    if (!list || (list[1] as string).includes('...BASE_EVENTS'))
      baseEvents().forEach((e) => names.add(e))
    if (list) quoted(list[1] as string).forEach((e) => names.add(e))
    return [...names]
  }
  // setup() / interface form: `(e: 'ready', ...)` and tuple form `ready: [...]` in defineEmits<{}>
  for (const m of source.matchAll(/\(\s*e:\s*['"]([\w-]+)['"]/g)) names.add(m[1] as string)
  const typed = source.match(/defineEmits<\{([\s\S]*?)\}>/)
  if (typed)
    for (const m of (typed[1] as string).matchAll(/^\s*['"]?([\w-]+)['"]?\s*:/gm))
      names.add(m[1] as string)
  // array form: `emits: ['ready', 'change', ...]`
  const arr = source.match(/emits:\s*\[([^\]]*)\]/)
  if (arr) quoted(arr[1] as string).forEach((e) => names.add(e))
  return [...names]
}

/** Collect every `@event` token mentioned anywhere in a doc page. */
function documentedEvents(doc: string): Set<string> {
  const set = new Set<string>()
  for (const m of doc.matchAll(/@([\w-]+)/g)) set.add(canon(m[1]))
  return set
}

describe('docs/API contract: component events', () => {
  it('source and docs directories exist', () => {
    expect(existsSync(COMPONENTS_DIR)).toBe(true)
    expect(existsSync(DOCS_DIR)).toBe(true)
  })

  it.each(MAP)('$component events are documented in $doc', ({ component, doc }) => {
    const componentPath = resolve(COMPONENTS_DIR, component)
    const docPath = resolve(DOCS_DIR, doc)
    expect(existsSync(componentPath), `missing component ${component}`).toBe(true)
    expect(existsSync(docPath), `missing doc page ${doc}`).toBe(true)

    const source = readFileSync(componentPath, 'utf8')
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

    // The harness itself must have found the component's events.
    expect(emits.length, `no events extracted from ${component}`).toBeGreaterThan(0)
  })
})
