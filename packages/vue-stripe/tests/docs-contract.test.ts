import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as VueStripe from '../src'

/**
 * Doc/API contract test (issues #421, #498).
 *
 * Extracts the real public surface of each component from source and checks the
 * matching VitePress API doc page documents it:
 *
 * - events (`events:` of a factory definition, `emits` / `defineEmits` otherwise):
 *   every event appears as `@event` somewhere on the page;
 * - props (the factory's `props:` for element definitions, the component's own
 *   `props:` otherwise): the `## Props` table lists exactly these props;
 * - exposed members (the factory's standard `expose({ ... })` plus the definition's
 *   `expose: () => ({ ... })` extras, or the component's own `expose({ ... })`):
 *   the `## Exposed ...` table lists exactly these members.
 *
 * ENFORCING MODE: fails on any mismatch by default. Set DOCS_CONTRACT_STRICT=0 to
 * temporarily downgrade mismatches to warnings.
 */

const STRICT = process.env.DOCS_CONTRACT_STRICT !== '0'

const here = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = resolve(here, '../src/components')
const FACTORY = resolve(here, '../src/utils/element-factory.ts')
const DOCS_DIR = resolve(here, '../../../apps/docs/api/components')
const DISCLOSURE = resolve(here, '../src/utils/disclosure.ts')
const factorySource = existsSync(FACTORY) ? readFileSync(FACTORY, 'utf8') : ''
const disclosureSource = existsSync(DISCLOSURE) ? readFileSync(DISCLOSURE, 'utf8') : ''

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
  {
    component: 'VueStripeContactDetailsElement.ts',
    doc: 'stripe-contact-details-element.md'
  },
  { component: 'VueStripeTermsElement.ts', doc: 'stripe-terms-element.md' },
  { component: 'VueStripeLinkSignupElement.ts', doc: 'stripe-link-signup-element.md' },
  {
    component: 'VueStripeFinancialAccountDisclosure.ts',
    doc: 'stripe-financial-account-disclosure.md'
  },
  { component: 'VueStripeIssuingDisclosure.ts', doc: 'stripe-issuing-disclosure.md' },
  { component: 'VueStripeTreasuryDisclosure.ts', doc: 'stripe-treasury-disclosure.md' },
  { component: 'VueStripeCheckout.ts', doc: 'stripe-checkout.md' },
  { component: 'VueStripeCheckoutElementsProvider.ts', doc: 'stripe-checkout-provider.md' },
  { component: 'VueStripeCheckoutFormProvider.ts', doc: 'stripe-checkout-form-provider.md' },
  { component: 'VueStripeCheckoutForm.ts', doc: 'stripe-checkout-form.md' },
  { component: 'VueStripePricingTable.ts', doc: 'stripe-pricing-table.md' },
  { component: 'VueStripeEmbeddedCheckout.ts', doc: 'stripe-embedded-checkout.md' }
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

/** Drop comments so braces and keys inside them do not count. */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Body of the `{ ... }` whose opening brace ends the first match of `opener`. */
function objectBody(source: string, opener: RegExp): string | null {
  const m = opener.exec(source)
  if (!m) return null
  const start = m.index + m[0].length
  let depth = 1
  for (let i = start; i < source.length; i++) {
    const c = source[i]
    if (c === "'" || c === '"' || c === '`') {
      i = source.indexOf(c, i + 1)
      if (i < 0) return null
    } else if (c === '{' || c === '(' || c === '[') depth++
    else if (c === '}' || c === ')' || c === ']') {
      depth--
      if (depth === 0) return source.slice(start, i)
    }
  }
  return null
}

/** Keys of an object literal body: `key: ...`, shorthand `key` and `key() {}`; spreads skipped. */
function topLevelKeys(body: string): string[] {
  const keys: string[] = []
  let depth = 0
  let segment = ''
  const flush = () => {
    const key = segment.trim().match(/^['"]?([A-Za-z_$][\w$]*)['"]?\s*(?::|\(|$)/)
    if (key) keys.push(key[1] as string)
    segment = ''
  }
  for (let i = 0; i < body.length; i++) {
    const c = body[i] as string
    if (c === "'" || c === '"' || c === '`') {
      const end = body.indexOf(c, i + 1)
      segment += body.slice(i, end + 1)
      i = end
      continue
    }
    if (c === '{' || c === '(' || c === '[') depth++
    else if (c === '}' || c === ')' || c === ']') depth--
    if (c === ',' && depth === 0) flush()
    else segment += c
  }
  flush()
  return keys
}

const isFactoryDefinition = (source: string) => /createStripeElement[<(]/.test(source)

/** Props of a component: the factory's `props:` for element definitions, else its own. */
function extractProps(source: string): string[] {
  const from = isFactoryDefinition(source) ? factorySource : source
  const body = objectBody(stripComments(from), /\bprops:\s*\{/)
  return body ? topLevelKeys(body) : []
}

/**
 * Exposed members: for element definitions the factory's standard `expose({ ... })`
 * plus the definition's `expose: (element) => ({ ... })` extras; otherwise the
 * component's own `expose({ ... })` (none when it does not call `expose`).
 */
function extractExposed(source: string): string[] {
  const code = stripComments(source)
  if (!isFactoryDefinition(source)) {
    const body = objectBody(code, /\bexpose\(\s*\{/)
    return body ? topLevelKeys(body) : []
  }
  const standard = objectBody(stripComments(factorySource), /\bexpose\(\s*\{/)
  const extras = objectBody(code, /\bexpose:\s*\([^)]*\)\s*=>\s*\(\s*\{/)
  return [...(standard ? topLevelKeys(standard) : []), ...(extras ? topLevelKeys(extras) : [])]
}

/**
 * Names in the first column of the tables under the first `##` heading matching
 * `heading`, up to the next heading of any level (code fences ignored). Rows like
 * `focus()` or `getValue(options?)` count as `focus` / `getValue`. Null when the
 * page has no such heading.
 */
function documentedTable(doc: string, heading: RegExp): string[] | null {
  const lines = doc.replace(/^```[\s\S]*?^```/gm, '').split('\n')
  const start = lines.findIndex((line) => /^##\s/.test(line) && heading.test(line))
  if (start < 0) return null
  const names: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break
    const cell = line.match(/^\|\s*`([A-Za-z_$][\w$]*)/)
    if (cell) names.push(cell[1] as string)
  }
  return names
}

const PROPS_HEADING = /^##\s+Props\b/
const EXPOSED_HEADING = /^##\s+Exposed\b/

function report(msg: string) {
  if (STRICT) expect.fail(msg)
  // Non-strict: report drift without failing CI.
  else console.warn(msg)
}

/** Fail on rows missing from the docs table and on documented rows the source lacks. */
function checkTable(
  component: string,
  doc: string,
  what: string,
  actual: string[],
  documented: string[]
) {
  const missing = actual.filter((n) => !documented.includes(n))
  const stale = documented.filter((n) => !actual.includes(n))
  const problems: string[] = []
  if (missing.length > 0) problems.push(`${what} not documented: ${missing.join(', ')}`)
  if (stale.length > 0) problems.push(`documented ${what} not in source: ${stale.join(', ')}`)
  if (problems.length > 0) report(`[docs-contract] ${component} vs ${doc}: ${problems.join('; ')}`)
}

const read = (component: string, doc: string) => {
  const componentPath = resolve(COMPONENTS_DIR, component)
  const docPath = resolve(DOCS_DIR, doc)
  expect(existsSync(componentPath), `missing component ${component}`).toBe(true)
  expect(existsSync(docPath), `missing doc page ${doc}`).toBe(true)
  const source = readFileSync(componentPath, 'utf8')
  // A disclosure definition's props, emits and exposed members live in the shared builder.
  return {
    source: /createStripeDisclosure[<(]/.test(source) ? disclosureSource : source,
    page: readFileSync(docPath, 'utf8')
  }
}

describe('docs/API contract: component events', () => {
  it('source and docs directories exist', () => {
    expect(existsSync(COMPONENTS_DIR)).toBe(true)
    expect(existsSync(DOCS_DIR)).toBe(true)
  })

  it.each(MAP)('$component events are documented in $doc', ({ component, doc }) => {
    const { source, page } = read(component, doc)
    const emits = extractEmits(source)
    const documented = documentedEvents(page)

    const missing = emits.filter((e) => !documented.has(canon(e)))
    if (missing.length > 0)
      report(
        `[docs-contract] ${component}: events not documented in ${doc}: ${missing.map((e) => '@' + e).join(', ')}`
      )

    // The harness itself must have found the component's events.
    expect(emits.length, `no events extracted from ${component}`).toBeGreaterThan(0)
  })
})

describe('docs/API contract: component props', () => {
  it.each(MAP)('$component props are the Props table of $doc', ({ component, doc }) => {
    const { source, page } = read(component, doc)
    const props = extractProps(source)
    // The harness itself must have found the component's props.
    expect(props.length, `no props extracted from ${component}`).toBeGreaterThan(0)

    const documented = documentedTable(page, PROPS_HEADING)
    if (!documented) return report(`[docs-contract] ${doc}: no "## Props" section`)
    checkTable(component, doc, 'props', props, documented)
  })
})

describe('docs/API contract: exposed members', () => {
  it.each(MAP)('$component exposed members are the Exposed table of $doc', ({ component, doc }) => {
    const { source, page } = read(component, doc)
    const exposed = extractExposed(source)
    const documented = documentedTable(page, EXPOSED_HEADING)
    if (exposed.length === 0 && !documented) return
    if (!documented) return report(`[docs-contract] ${doc}: no "## Exposed ..." section`)
    checkTable(component, doc, 'exposed members', exposed, documented)
  })
})

describe('docs/API contract: extractors', () => {
  it('reads top-level prop keys and skips nested keys, comments and strings', () => {
    const source = `defineComponent({
      props: {
        /** A comment with { braces: 1 } and key: inside. */
        sessionUrl: { type: String as PropType<string | undefined>, default: undefined },
        // nested: { not: 'a prop' }
        buttonText: { type: String, default: 'a, b: {c}' },
        fetchClientSecret: { type: Function as PropType<(() => Promise<string>) | undefined> }
      },
      setup(props, { expose }) { expose({ checkout, loading: ref(false), clear() {} }) }
    })`
    expect(extractProps(source)).toEqual(['sessionUrl', 'buttonText', 'fetchClientSecret'])
    expect(extractExposed(source)).toEqual(['checkout', 'loading', 'clear'])
  })

  it('reads factory props, the standard exposed set and definition extras', () => {
    const source = `createStripeElement({ expose: (element) => ({ getValue: () => element.value }) })`
    expect(extractProps(source)).toEqual(['options'])
    expect(extractExposed(source)).toEqual([
      'element',
      'loading',
      'error',
      'focus',
      'blur',
      'clear',
      'getValue'
    ])
  })

  it('reads the first-column names of a section table, ignoring code fences and subsections', () => {
    const page = [
      '## Props',
      '',
      '| Prop | Type |',
      '|------|------|',
      '| `options` | `object` |',
      '```md',
      '# not a heading',
      '| `fenced` | x |',
      '```',
      '| `other` | `string` |',
      '',
      '### Options Object',
      '',
      '| `optionKey` | `string` |',
      '',
      '## Exposed Methods & Properties',
      '',
      '| `focus()` | `() => void` |',
      '| `getValue(options?)` | `() => Promise<...>` |'
    ].join('\n')
    expect(documentedTable(page, PROPS_HEADING)).toEqual(['options', 'other'])
    expect(documentedTable(page, EXPOSED_HEADING)).toEqual(['focus', 'getValue'])
    expect(documentedTable('## Events', EXPOSED_HEADING)).toBeNull()
  })
})

describe('docs/API contract: method-specific confirm composables', () => {
  const CONFIRM_DOCS = resolve(here, '../../../apps/docs/api/composables/confirm')
  const pages = existsSync(CONFIRM_DOCS)
    ? readdirSync(CONFIRM_DOCS)
        .filter((f) => f.endsWith('.md'))
        .map((file) => ({ file, doc: readFileSync(resolve(CONFIRM_DOCS, file), 'utf8') }))
    : []
  const confirmComposables = Object.keys(VueStripe).filter((name) =>
    /^useConfirm\w+(Payment|Setup)$/.test(name)
  )

  it('finds the family pages and the exported useConfirm* composables', () => {
    expect(pages.length).toBeGreaterThan(1)
    expect(confirmComposables.length).toBeGreaterThan(0)
  })

  it.each(confirmComposables)('%s has a section in exactly one family page', (name) => {
    const heading = new RegExp(`^#{2,3} ${name}$`, 'm')
    const documentedIn = pages.filter((p) => heading.test(p.doc)).map((p) => p.file)
    expect(documentedIn, `${name} sections`).toHaveLength(1)
  })
})
