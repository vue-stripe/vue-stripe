import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Conventions guard (#511). Each rule from CLAUDE.md is a checker that returns
 * `file:line` violations; it runs over the real tree and over a negative fixture
 * that must fail, so a rule cannot silently stop checking.
 */

const here = dirname(fileURLToPath(import.meta.url))
const PKG = resolve(here, '..')
const ROOT = resolve(PKG, '../..')
const SRC = join(PKG, 'src')
const STRIPE_ELEMENTS_DTS = join(PKG, 'node_modules/@stripe/stripe-js/dist/stripe-js/elements')

type Source = { path: string; content: string }
type Violation = string

function listFiles(
  dir: string,
  exts: string[],
  skip = /node_modules|[\\/]dist[\\/]|\.vitepress[\\/](cache|dist)/
): string[] {
  if (!existsSync(dir) || skip.test(dir)) return []
  if (statSync(dir).isFile()) return exts.includes(extname(dir)) ? [dir] : []
  return readdirSync(dir).flatMap((name) => listFiles(join(dir, name), exts, skip))
}
const read = (path: string): Source => ({
  path: relative(ROOT, path),
  content: readFileSync(path, 'utf8')
})
const srcFiles = () => listFiles(SRC, ['.ts']).map(read)

/** Comment lines (incl. JSDoc @example blocks showing user code) are not checked. */
const isComment = (line: string) => /^\s*(\*|\/\*|\/\/)/.test(line)

/**
 * Report each regex match as `file:line: text`. Matches may span lines (the regex
 * runs on the whole file); a match starting on a comment line is ignored.
 */
function scan(
  source: Source,
  re: RegExp,
  message: (match: RegExpMatchArray) => string | null,
  { skipComments = true } = {}
): Violation[] {
  const lines = source.content.split('\n')
  const out: Violation[] = []
  for (const match of source.content.matchAll(
    new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  )) {
    const line = source.content.slice(0, match.index).split('\n').length
    if (skipComments && isComment(lines[line - 1] ?? '')) continue
    const msg = message(match)
    if (msg) out.push(`${source.path}:${line}: ${msg}`)
  }
  return out
}

// --- Rules -----------------------------------------------------------------

/** 1. No .vue files under src/ (render-function components only, Vue 2.7 + 3). */
const noVueFiles = (paths: string[]): Violation[] =>
  paths.filter((p) => p.endsWith('.vue')).map((p) => `${p}: .vue file in src`)

/** 2. Vue APIs come from vue-demi, never from 'vue'. */
const vueDemiOnly = (s: Source) =>
  scan(s, /from\s+['"]vue['"]/, () => "import from 'vue' (use 'vue-demi')")

/** 3. Components are factory definitions unless allow-listed (providers and non-element components). */
const COMPONENT_ALLOW_LIST = [
  'VueStripeProvider',
  'VueStripeElements',
  'VueStripeCheckoutElementsProvider',
  'VueStripeCheckoutFormProvider',
  'VueStripeEmbeddedCheckout',
  'VueStripeCheckout',
  'VueStripePricingTable'
]
const factoryOnly = (s: Source): Violation[] => {
  const name = s.path.split(/[\\/]/).pop()!.replace(/\.ts$/, '')
  if (
    name === 'index' ||
    COMPONENT_ALLOW_LIST.includes(name) ||
    /^VueStripe\w+Disclosure$/.test(name)
  )
    return []
  return /createStripeElement[<(]/.test(s.content)
    ? []
    : [`${s.path}: component is not a createStripeElement definition`]
}

/** 4. console.error / console.warn messages start with "[Vue Stripe]"; other console methods are banned. */
const consolePrefix = (s: Source) =>
  scan(s, /console\.(\w+)\((?=\s*([\s\S]{0,14}))/, (m) => {
    const [, method, arg = ''] = m
    if (method !== 'error' && method !== 'warn') return `console.${method} is not allowed`
    return /^(['"`])\[Vue Stripe\]/.test(arg)
      ? null
      : `console.${method} message must start with "[Vue Stripe]"`
  })

/** 5. Only the typed error classes are thrown. */
const TYPED_ERRORS = ['VueStripeProviderError', 'VueStripeElementsError', 'VueStripeCheckoutError']
const typedErrors = (s: Source) =>
  scan(s, /throw new (\w+)/, (m) =>
    TYPED_ERRORS.includes(m[1]!) ? null : `throws ${m[1]} (use a typed error from utils/errors.ts)`
  )

/** 6. No `as any`, no @ts-ignore, @ts-expect-error only with a `-- reason`. */
const noEscapeHatches = (s: Source) => [
  ...scan(s, /\bas any\b/, () => '`as any`'),
  ...scan(s, /@ts-ignore/, () => '@ts-ignore', { skipComments: false }),
  ...scan(s, /@ts-expect-error(?!.*--\s*\S)/, () => '@ts-expect-error without a `-- reason`', {
    skipComments: false
  })
]

/** 7. Every component / composable module is exported from its index. */
const exportedFromIndex = (
  dir: 'components' | 'composables',
  files: string[],
  index: string
): Violation[] =>
  files
    .map((f) => f.split(/[\\/]/).pop()!.replace(/\.ts$/, ''))
    .filter((name) => name !== 'index' && !index.includes(`'./${name}'`))
    .map((name) => `src/${dir}/${name}.ts is not exported from src/${dir}/index.ts`)

/** 8. Element `events` are a subset of the Stripe.js `.d.ts` union for that element type. */
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
/** Element types whose `.d.ts` is not named after them. */
const DTS_FILE: Record<string, string> = { checkoutForm: 'payment-form' }
const stripeEventUnion = (elementType: string): Set<string> | null => {
  const file = join(STRIPE_ELEMENTS_DTS, `${DTS_FILE[elementType] ?? kebab(elementType)}.d.ts`)
  if (!existsSync(file)) return null
  return new Set(
    [...readFileSync(file, 'utf8').matchAll(/eventType: '([a-z-]+)'/g)].map((m) => m[1]!)
  )
}
const BASE_EVENTS = ['ready', 'change', 'focus', 'blur', 'escape']
const eventsMatchStripe = (
  s: Source,
  union: (type: string) => Set<string> | null = stripeEventUnion
): Violation[] => {
  if (!/createStripeElement[<(]/.test(s.content)) return []
  const type = s.content.match(/elementType:\s*'(\w+)'/)?.[1]
  if (!type) return [`${s.path}: no elementType`]
  const list = s.content.match(/events:\s*\[([^\]]*)\]/)?.[1]
  const events =
    list === undefined
      ? BASE_EVENTS
      : [
          ...(list.includes('...BASE_EVENTS') ? BASE_EVENTS : []),
          ...[...list.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]!)
        ]
  const allowed = union(type)
  if (!allowed) return [`${s.path}: no Stripe.js type definitions for '${type}'`]
  return events
    .filter((e) => !allowed.has(e))
    .map((e) => `${s.path}: '${e}' is not a Stripe.js '${type}' event`)
}

/** 9. Every exported component and composable has an API page. */
const COMPONENT_PAGE: Record<string, string> = {
  VueStripeCardNumberElement: 'stripe-split-card-elements',
  VueStripeCardExpiryElement: 'stripe-split-card-elements',
  VueStripeCardCvcElement: 'stripe-split-card-elements',
  VueStripeCheckoutElementsProvider: 'stripe-checkout-provider',
  VueStripeCheckoutProvider: 'stripe-checkout-provider'
}
const COMPOSABLE_PAGE: Record<string, string> = {
  useCheckout: 'use-stripe-checkout',
  useElements: 'use-stripe-elements'
}
const exportNames = (index: string) =>
  [...index.matchAll(/export \{([^}]*)\}/g)]
    .flatMap((m) =>
      m[1]!.split(',').map((part) =>
        part
          .trim()
          .split(/\s+as\s+/)
          .pop()!
          .trim()
      )
    )
    .filter(Boolean)
const documented = (
  names: string[],
  kind: 'components' | 'composables',
  exists: (page: string) => boolean
): Violation[] =>
  names
    .map((name) => {
      const page =
        kind === 'components'
          ? (COMPONENT_PAGE[name] ?? 'stripe' + kebab(name.replace(/^VueStripe/, '')))
          : (COMPOSABLE_PAGE[name] ?? kebab(name))
      return exists(`apps/docs/api/${kind}/${page}.md`)
        ? null
        : `${name} has no API page apps/docs/api/${kind}/${page}.md`
    })
    .filter((v): v is string => v !== null)

/** 10. No emoji in docs, demo apps, library source or READMEs (maintainer rule). */
const EMOJI = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|‍|[\u{1F000}-\u{1FAFF}]/u
const noEmoji = (s: Source) => {
  const out: Violation[] = []
  s.content.split('\n').forEach((line, i) => {
    const col = [...line].findIndex((ch) => EMOJI.test(ch))
    if (col >= 0) out.push(`${s.path}:${i + 1}:${col + 1}: emoji "${[...line][col]}"`)
  })
  return out
}
const EMOJI_ROOTS = [
  'apps/docs',
  'apps/playground/src',
  'apps/backend/src',
  'packages/vue-stripe/src',
  'packages/vue-stripe/README.md',
  'README.md',
  'CONTRIBUTING.md',
  '.github'
]
const EMOJI_EXTS = ['.md', '.vue', '.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html', '.yml']

// --- Tree checks -----------------------------------------------------------

const rel = (p: string) => relative(ROOT, p)
const componentsIndex = readFileSync(join(SRC, 'components/index.ts'), 'utf8')
const composablesIndex = readFileSync(join(SRC, 'composables/index.ts'), 'utf8')

describe('conventions (enforced by tests/conventions.test.ts)', () => {
  it('1. no .vue files under packages/vue-stripe/src', () => {
    expect(noVueFiles(listFiles(SRC, ['.vue', '.ts']).map(rel))).toEqual([])
  })

  it("2. Vue APIs are imported from 'vue-demi' only", () => {
    expect(srcFiles().flatMap(vueDemiOnly)).toEqual([])
  })

  it('3. components are createStripeElement definitions unless allow-listed', () => {
    expect(listFiles(join(SRC, 'components'), ['.ts']).map(read).flatMap(factoryOnly)).toEqual([])
  })

  it('4. console.error / console.warn start with "[Vue Stripe]"; no other console methods', () => {
    expect(srcFiles().flatMap(consolePrefix)).toEqual([])
  })

  it('5. only typed error classes are thrown', () => {
    expect(srcFiles().flatMap(typedErrors)).toEqual([])
  })

  it('6. no `as any`, @ts-ignore, or unexplained @ts-expect-error', () => {
    expect(srcFiles().flatMap(noEscapeHatches)).toEqual([])
  })

  it('7. every component and composable is exported from its index', () => {
    expect([
      ...exportedFromIndex(
        'components',
        listFiles(join(SRC, 'components'), ['.ts']),
        componentsIndex
      ),
      ...exportedFromIndex(
        'composables',
        listFiles(join(SRC, 'composables'), ['.ts']),
        composablesIndex
      )
    ]).toEqual([])
  })

  it('8. element events are a subset of the installed Stripe.js .d.ts unions', () => {
    expect(
      listFiles(join(SRC, 'components'), ['.ts'])
        .map(read)
        .flatMap((s) => eventsMatchStripe(s))
    ).toEqual([])
  })

  it('9. every exported component and composable has an API page', () => {
    const exists = (page: string) => existsSync(join(ROOT, page))
    expect([
      ...documented(exportNames(componentsIndex), 'components', exists),
      ...documented(exportNames(composablesIndex), 'composables', exists)
    ]).toEqual([])
  })

  it('10. no emoji in docs, demo apps, library source or READMEs', () => {
    const files = EMOJI_ROOTS.flatMap((root) => listFiles(join(ROOT, root), EMOJI_EXTS))
    expect(files.length).toBeGreaterThan(100)
    expect(files.map(read).flatMap(noEmoji)).toEqual([])
  })
})

// --- Negative fixtures: every rule must be able to fail --------------------

const fixture = (content: string, path = 'packages/vue-stripe/src/fixture.ts'): Source => ({
  path,
  content
})

describe('conventions: each rule rejects a violating fixture', () => {
  it('1. flags a .vue file', () => {
    expect(noVueFiles(['packages/vue-stripe/src/components/Bad.vue'])).toHaveLength(1)
  })
  it("2. flags import from 'vue'", () => {
    expect(vueDemiOnly(fixture("import { ref } from 'vue'"))).toEqual([
      "packages/vue-stripe/src/fixture.ts:1: import from 'vue' (use 'vue-demi')"
    ])
  })
  it('3. flags a hand-written element component', () => {
    expect(
      factoryOnly(
        fixture('export default defineComponent({})', 'src/components/VueStripeFooElement.ts')
      )
    ).toHaveLength(1)
    expect(
      factoryOnly(
        fixture(
          'export default defineComponent({})',
          'src/components/VueStripeIssuingDisclosure.ts'
        )
      )
    ).toEqual([])
  })
  it('4. flags console.log and unprefixed console.error, also across lines; ignores comments', () => {
    expect(
      consolePrefix(
        fixture(
          "console.log('x')\nconsole.error('oops')\nconsole.warn(\n  `[Vue Stripe] ok`\n)\n * console.log(example)"
        )
      )
    ).toHaveLength(2)
  })
  it('5. flags throw new Error', () => {
    expect(
      typedErrors(fixture("throw new Error('x')\nthrow new VueStripeElementsError('y')"))
    ).toHaveLength(1)
  })
  it('6. flags as any, @ts-ignore and bare @ts-expect-error', () => {
    expect(
      noEscapeHatches(
        fixture(
          'const a = b as any\n// @ts-ignore\n// @ts-expect-error\n// @ts-expect-error -- Stripe types lag'
        )
      )
    ).toHaveLength(3)
  })
  it('7. flags an unexported module', () => {
    expect(
      exportedFromIndex(
        'components',
        ['src/components/VueStripeOrphan.ts'],
        "export { default as A } from './A'"
      )
    ).toHaveLength(1)
  })
  it('8. flags an event Stripe.js does not emit', () => {
    const union = () => new Set(['ready', 'change'])
    expect(
      eventsMatchStripe(
        fixture("createStripeElement({ elementType: 'card', events: ['ready', 'loaderstop'] })"),
        union
      )
    ).toEqual(["packages/vue-stripe/src/fixture.ts: 'loaderstop' is not a Stripe.js 'card' event"])
  })
  it('9. flags an export without an API page', () => {
    expect(documented(['VueStripeFooElement', 'useFoo'], 'components', () => false)).toHaveLength(2)
  })
  it('10. flags a pictograph with file:line:column', () => {
    expect(noEmoji(fixture('ok\nPaid ✅ done', 'apps/docs/x.md'))).toEqual([
      'apps/docs/x.md:2:6: emoji "✅"'
    ])
  })
})
