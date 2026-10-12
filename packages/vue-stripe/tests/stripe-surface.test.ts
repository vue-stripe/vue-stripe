import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  coverage,
  type CoverageCategory,
  type CoverageItem
} from '../../../apps/docs/.vitepress/theme/data/stripe-coverage'

/**
 * Stripe.js surface guard (#508).
 *
 * Parses the installed `@stripe/stripe-js` type definitions and fails unless every
 * public method and element type is classified in the coverage matrix
 * (apps/docs/.vitepress/theme/data/stripe-coverage.ts) as `covered` or `deprecated`,
 * so a Stripe.js release cannot add surface without the matrix noticing. It also
 * fails when a matrix row names surface the installed types no longer declare.
 *
 * Surface keys are `<declaring type>.<member>`, exactly as in the `.d.ts`:
 *
 * - members of `Stripe`, `StripeElements`, the Checkout Elements / Form SDKs, the
 *   Checkout session actions, `StripeEmbeddedCheckout` and `PaymentRequest`;
 * - `loadStripe` and the `/pure` entry's `loadStripe.setLoadParameters`;
 * - every `StripeElementType` (`StripeElementType.payment`);
 * - element instance members: `StripeElementBase.<m>` for the shared base,
 *   `StripeElement.<m>` for the per-element `on` / `once` / `off` / `update`
 *   overloads, and `<ElementType>.<m>` for the rest (`StripePaymentElement.collapse`).
 *
 * Members are top-level method signatures (`  name(`) and function-typed properties
 * (`  name: (`). Event payload helpers (`event.resolve()`) and option callbacks are
 * not instance surface and are not collected.
 */

const here = dirname(fileURLToPath(import.meta.url))
const STRIPE_DIST = resolve(here, '../node_modules/@stripe/stripe-js/dist')

type DtsFile = { path: string; content: string }

/** Declarations whose members are public Stripe.js API, keyed as `<name>.<member>`. */
const OWNERS = [
  'Stripe',
  'StripeElements',
  'StripeCheckoutElementsSdk',
  'StripeCheckoutFormSdk',
  'StripeCheckoutLoadActionsSuccess',
  'StripeEmbeddedCheckout',
  'PaymentRequest',
  'loadStripe'
]

/** Every element type declares its own overloads of these, so they are pooled. */
const POOLED_ELEMENT_MEMBERS = ['on', 'once', 'off', 'update']

const ALLOWED: Array<CoverageItem['status']> = ['covered', 'deprecated']

function readDts(dir: string): DtsFile[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return readDts(path)
    // The .d.mts copies are identical; read each declaration once.
    if (!name.endsWith('.d.ts')) return []
    return [{ path: relative(STRIPE_DIST, path), content: readFileSync(path, 'utf8') }]
  })
}

interface Declaration {
  name: string
  /** Text between `=` and `{` of a type alias, e.g. `StripeElementBase & `. */
  base: string
  members: string[]
}

const DECLARATION =
  /^export (?:interface (\w+)\b[^{]*|type (\w+) = ([^{]*)|const (\w+): [^{]*)\{\s*$/
const MEMBER = /^ {2}(\w+)\??(?:\(|<|: \()/

/** Exported interfaces / object types / consts with a body, and their top-level function members. */
function declarations(file: DtsFile): Declaration[] {
  const lines = file.content.split('\n')
  const out: Declaration[] = []
  lines.forEach((line, i) => {
    const m = DECLARATION.exec(line)
    if (!m) return
    const members = new Set<string>()
    for (let j = i + 1; j < lines.length && !/^\}/.test(lines[j]!); j++) {
      const member = MEMBER.exec(lines[j]!)
      if (member) members.add(member[1]!)
    }
    out.push({ name: (m[1] ?? m[2] ?? m[4])!, base: m[3] ?? '', members: [...members] })
  })
  return out
}

/** Members of a `export type Name = | A | B;` union: string literals or type names. */
function union(files: DtsFile[], name: string, item: RegExp): string[] {
  for (const file of files) {
    const body = new RegExp(`^export type ${name} =([^;]+);`, 'm').exec(file.content)?.[1]
    if (body) return [...body.matchAll(item)].map((m) => m[1]!)
  }
  return []
}

/** Every public Stripe.js surface key declared by the given type definitions. */
function stripeSurface(files: DtsFile[]): Set<string> {
  const decls = files.flatMap(declarations)
  const keys = new Set<string>()

  for (const file of files) {
    for (const m of file.content.matchAll(/^export const (\w+)\b/gm)) keys.add(m[1]!)
  }
  for (const decl of decls.filter((d) => OWNERS.includes(d.name))) {
    for (const member of decl.members) keys.add(`${decl.name}.${member}`)
  }

  for (const type of union(files, 'StripeElementType', /'(\w+)'/g)) {
    keys.add(`StripeElementType.${type}`)
  }

  const base = decls.find((d) => d.name === 'StripeElementBase')?.members ?? []
  const instances = new Set(union(files, 'StripeElement', /\b(\w+)\b/g))
  const isElement = (d: Declaration) =>
    d.name === 'StripeElementBase' || d.base.includes('StripeElementBase') || instances.has(d.name)
  for (const decl of decls.filter(isElement)) {
    for (const member of decl.members) {
      if (base.includes(member)) keys.add(`StripeElementBase.${member}`)
      else if (POOLED_ELEMENT_MEMBERS.includes(member)) keys.add(`StripeElement.${member}`)
      else keys.add(`${decl.name}.${member}`)
    }
  }
  return keys
}

/** Every way the matrix disagrees with the installed surface, one line each. */
function surfaceProblems(surface: Set<string>, matrix: CoverageCategory[]): string[] {
  const rowsByKey = new Map<string, CoverageItem[]>()
  for (const item of matrix.flatMap((c) => c.items)) {
    for (const key of item.surface ?? []) {
      rowsByKey.set(key, [...(rowsByKey.get(key) ?? []), item])
    }
  }

  const problems: string[] = []
  for (const key of [...surface].sort()) {
    const rows = rowsByKey.get(key) ?? []
    if (rows.length === 0) {
      problems.push(`${key}: not in the coverage matrix`)
    } else if (rows.length > 1) {
      problems.push(`${key}: listed by more than one row (${rows.map((r) => r.name).join(', ')})`)
    } else if (!ALLOWED.includes(rows[0]!.status)) {
      problems.push(
        `${key}: "${rows[0]!.name}" is ${rows[0]!.status}; wrap it (covered) or mark it deprecated`
      )
    }
  }
  for (const [key, rows] of rowsByKey) {
    if (!surface.has(key)) {
      problems.push(
        `${key}: named by "${rows[0]!.name}", but @stripe/stripe-js no longer declares it`
      )
    }
  }
  return problems
}

const report = (problems: string[]) =>
  `${problems.length} Stripe.js surface problem(s):\n  ${problems.join('\n  ')}`

const files = readDts(STRIPE_DIST)
const surface = stripeSurface(files)

describe('Stripe.js surface guard', () => {
  it('reads every surface owner from the installed type definitions', () => {
    // A renamed or moved declaration would otherwise shrink the surface silently.
    for (const owner of OWNERS) {
      expect(
        [...surface].some((k) => k.startsWith(`${owner}.`)),
        `${owner} not found in @stripe/stripe-js`
      ).toBe(true)
    }
    for (const prefix of ['StripeElementType.', 'StripeElementBase.', 'StripeElement.']) {
      expect(
        [...surface].some((k) => k.startsWith(prefix)),
        prefix
      ).toBe(true)
    }
    expect(surface.has('loadStripe')).toBe(true)
    expect(surface.has('Stripe.confirmPayment')).toBe(true)
    expect(surface.has('StripeCheckoutLoadActionsSuccess.confirm')).toBe(true)
    expect(surface.has('StripePaymentElement.collapse')).toBe(true)
    // Event payload helpers are not instance surface.
    expect([...surface].some((k) => k.endsWith('.resolve'))).toBe(false)
  })

  it('every Stripe.js method and element type is covered or deprecated in the matrix', () => {
    const problems = surfaceProblems(surface, coverage)
    expect(problems, report(problems)).toEqual([])
  })

  it('the coverage tracker reads 100% (no accessible or planned rows)', () => {
    const items = coverage.flatMap((c) => c.items)
    const trackable = items.filter((i) => i.status !== 'deprecated')
    const open = trackable
      .filter((i) => i.status !== 'covered')
      .map((i) => `${i.name} (${i.status})`)
    expect(open, `not covered: ${open.join(', ')}`).toEqual([])
    expect(trackable.length).toBeGreaterThan(0)
  })
})

describe('Stripe.js surface guard self-test (stubbed matrix)', () => {
  // A matrix that classifies exactly the installed surface, one covered row per key.
  const stub = (keys: Iterable<string>): CoverageCategory[] => [
    {
      group: 'stub',
      items: [...keys].map((key) => ({
        name: key,
        api: key,
        status: 'covered' as const,
        artifact: 'stub',
        surface: [key]
      }))
    }
  ]
  const withoutRow = (matrix: CoverageCategory[], name: string): CoverageCategory[] =>
    matrix.map((c) => ({ ...c, items: c.items.filter((i) => i.name !== name) }))

  it('passes a matrix that classifies the whole surface', () => {
    expect(surfaceProblems(surface, stub(surface))).toEqual([])
  })

  it('fails when a row is removed', () => {
    const problems = surfaceProblems(surface, withoutRow(stub(surface), 'Stripe.confirmPayment'))
    expect(problems).toEqual(['Stripe.confirmPayment: not in the coverage matrix'])
  })

  it('fails when a row is removed from the real matrix', () => {
    const problems = surfaceProblems(surface, withoutRow(coverage, 'Card Element'))
    expect(problems).toContain('StripeElementType.card: not in the coverage matrix')
  })

  it('fails when a row is only accessible or planned', () => {
    const matrix = stub(surface)
    const row = matrix[0]!.items.find((i) => i.name === 'Stripe.createToken')!
    row.status = 'accessible'
    delete row.artifact
    expect(surfaceProblems(surface, matrix)).toEqual([
      'Stripe.createToken: "Stripe.createToken" is accessible; wrap it (covered) or mark it deprecated'
    ])
    row.status = 'planned'
    expect(surfaceProblems(surface, matrix)[0]).toContain('is planned')
  })

  it('fails when a row names a method Stripe.js no longer declares', () => {
    const problems = surfaceProblems(surface, stub([...surface, 'Stripe.redirectToCheckout']))
    expect(problems).toEqual([
      'Stripe.redirectToCheckout: named by "Stripe.redirectToCheckout", but @stripe/stripe-js no longer declares it'
    ])
  })

  it('fails when two rows claim the same key', () => {
    const matrix = stub(surface)
    matrix[0]!.items.push({
      name: 'duplicate',
      api: 'x',
      status: 'covered',
      artifact: 'stub',
      surface: ['StripeElements.submit']
    })
    expect(surfaceProblems(surface, matrix)).toEqual([
      'StripeElements.submit: listed by more than one row (StripeElements.submit, duplicate)'
    ])
  })

  it('fails when a Stripe.js release adds a method, a function property or an element type', () => {
    const patched = files.map((file) => {
      let content = file.content
      if (file.path.endsWith('stripe-js/stripe.d.ts')) {
        content = content.replace(
          /^export interface Stripe \{$/m,
          'export interface Stripe {\n  confirmNewMethodPayment(clientSecret: string): void;'
        )
      }
      if (file.path.endsWith('stripe-js/checkout.d.ts')) {
        content = content.replace(
          /^export interface StripeCheckoutElementsSdk \{$/m,
          'export interface StripeCheckoutElementsSdk {\n  newAction: () => void;'
        )
      }
      if (file.path.endsWith('stripe-js/elements-group.d.ts')) {
        content = content.replace(
          /^export type StripeElementType =$/m,
          "export type StripeElementType =\n  | 'newElement'"
        )
      }
      return { ...file, content }
    })
    expect(surfaceProblems(stripeSurface(patched), stub(surface))).toEqual([
      'Stripe.confirmNewMethodPayment: not in the coverage matrix',
      'StripeCheckoutElementsSdk.newAction: not in the coverage matrix',
      'StripeElementType.newElement: not in the coverage matrix'
    ])
  })
})
