// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  addedRange,
  emptyBundleSizes,
  extremes,
  formatSize,
  formatSizeLike,
  groupExports,
  groupOf,
  hasSizes,
  homeSizeFigures,
  type ExportSize
} from '../../../apps/docs/.vitepress/theme/data/bundle-size'
import {
  exportBindings,
  measureBundleSizes,
  parseLimit
} from '../../../apps/docs/.vitepress/theme/data/measure-bundle'
import {
  bundleSizeMarkdown,
  homeBundleSizeMarkdown,
  toPlainMarkdown
} from '../../../apps/docs/.vitepress/llms'
import { formatCompact, formatCompactLike } from '../../../apps/docs/.vitepress/theme/data/usage'

/**
 * /guide/bundle-size and the home page show sizes the docs build measures from the library's
 * dist. The docs must still build when the library was not built (a docs-only checkout, a
 * failed library build), so a missing dist has to end in empty figures and the page's
 * fallback, never a thrown error.
 */

const libraryDir = resolve(import.meta.dirname, '..')
const built = existsSync(join(libraryDir, 'dist/es/index.js'))

const size = (name: string, gzip: number, extra: Partial<ExportSize> = {}): ExportSize => ({
  name,
  group: groupOf(name),
  minified: gzip * 2,
  gzip,
  ...extra
})

describe('/guide/bundle-size numbers', () => {
  it('without a built library, it resolves with no sizes and the copies say so', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'vue-stripe-no-dist-'))
    const errors: string[] = []
    try {
      const data = await measureBundleSizes({
        libraryDir: empty,
        onError: (message) => errors.push(message)
      })
      expect(data).toEqual(emptyBundleSizes())
      expect(hasSizes(data)).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('dist/es/index.js')
      expect(homeSizeFigures(data)).toEqual([])
      expect(homeBundleSizeMarkdown(data)).toBe('')
      const parts = bundleSizeMarkdown(data)
      expect(parts['BundleSize#summary']).toContain('Sizes are measured when the site is built')
      expect(Object.keys(parts)).toEqual(['BundleSize#summary'])
    } finally {
      rmSync(empty, { recursive: true, force: true })
    }
  })

  it('groups exports as the API reference does', () => {
    expect(groupOf('VueStripeProvider')).toBe('providers')
    expect(groupOf('VueStripeElements')).toBe('providers')
    expect(groupOf('createVueStripe')).toBe('providers')
    expect(groupOf('VueStripePaymentElement')).toBe('elements')
    expect(groupOf('VueStripeIssuingCardNumberDisplayElement')).toBe('elements')
    expect(groupOf('VueStripeEmbeddedCheckout')).toBe('checkout')
    expect(groupOf('VueStripeCheckoutElementsProvider')).toBe('checkout')
    expect(groupOf('VueStripePricingTable')).toBe('checkout')
    expect(groupOf('VueStripeIssuingDisclosure')).toBe('disclosures')
    expect(groupOf('useStripe')).toBe('composables')
    expect(groupOf('useCheckoutSession')).toBe('composables')
    expect(groupOf('useConfirmCardPayment')).toBe('confirmers')
    expect(groupOf('useConfirmSepaDebitSetup')).toBe('confirmers')
    expect(groupOf('VueStripeCheckoutError')).toBe('utilities')
    expect(groupOf('loadStripe')).toBe('utilities')
  })

  it('sorts each group smallest first, an alias after the export it names', () => {
    const groups = groupExports([
      size('usePaymentIntent', 822),
      size('useCheckout', 357, { aliasOf: 'useStripeCheckout' }),
      size('useStripeCheckout', 357),
      size('VueStripeCardElement', 2084, { added: 55 }),
      size('VueStripeProvider', 1641),
      size('VueStripeAddressElement', 2200, { added: 125 })
    ])
    expect(groups.map((g) => g.id)).toEqual(['providers', 'elements', 'composables'])
    expect(groups[2]!.exports.map((e) => e.name)).toEqual([
      'useStripeCheckout',
      'useCheckout',
      'usePaymentIntent'
    ])
    expect(groups[1]!.exports.map((e) => e.name)).toEqual([
      'VueStripeCardElement',
      'VueStripeAddressElement'
    ])
    const exports = groups.flatMap((g) => g.exports)
    expect(extremes(exports)).toMatchObject({
      smallest: { name: 'useStripeCheckout' },
      largest: { name: 'VueStripeAddressElement' }
    })
    expect(addedRange(exports)).toEqual({ min: 55, median: 125, max: 125 })
  })

  it('reads aliases from the build and limits as size-limit writes them', () => {
    const bindings = exportBindings(
      'var a=1;export { Ve as useCheckout, Ve as useStripeCheckout, Re as useStripe };\n'
    )
    expect(bindings.get('useCheckout')).toBe('Ve')
    expect(bindings.get('useStripeCheckout')).toBe('Ve')
    expect(bindings.get('useStripe')).toBe('Re')
    expect(parseLimit('11.59 kB')).toBe(11590)
    expect(parseLimit('380 B')).toBe(380)
    expect(parseLimit('lots')).toBeNull()
    expect(formatSize(375)).toBe('375 B')
    expect(formatSize(11583)).toBe('11.6 kB')
    expect(formatSize(11583, 2)).toBe('11.58 kB')
  })

  it("a count up to a figure keeps that figure's unit on the way", () => {
    // Sizes: kilobytes all the way to 11.6 kB, bytes all the way to 330 B.
    expect(formatSizeLike(0, 11584)).toBe('0.0 kB')
    expect(formatSizeLike(512, 11584)).toBe('0.5 kB')
    expect(formatSizeLike(11584, 11584)).toBe(formatSize(11584))
    expect(formatSizeLike(164.6, 330)).toBe('165 B')
    // Compact counts: millions all the way to 3.9M, thousands to 14.6K.
    expect(formatCompactLike(0, 3_912_345)).toBe('0M')
    expect(formatCompactLike(1_234_567, 3_912_345)).toBe('1.2M')
    expect(formatCompactLike(3_912_345, 3_912_345)).toBe(formatCompact(3_912_345))
    expect(formatCompactLike(500, 14_612)).toBe('0.5K')
    expect(formatCompactLike(563.4, 999)).toBe('563')
  })

  it('a component tag with a part attribute takes that part of the Markdown', () => {
    const body = '# Title\n\n<BundleSize part="summary" />\n\n<BundleSize part="table" />\n'
    expect(toPlainMarkdown(body, { 'BundleSize#summary': 'The summary.' })).toBe(
      '# Title\n\nThe summary.'
    )
  })

  it.skipIf(!built)(
    'measures every runtime export of the built library',
    async () => {
      const errors: string[] = []
      const data = await measureBundleSizes({
        libraryDir,
        onError: (message) => errors.push(message)
      })
      expect(errors).toEqual([])
      expect(hasSizes(data)).toBe(true)
      const pkg = JSON.parse(readFileSync(join(libraryDir, 'package.json'), 'utf8')) as {
        version: string
      }
      expect(data.version).toBe(pkg.version)

      // Every export of dist/es/index.js, and nothing else.
      const names = [
        ...exportBindings(readFileSync(join(libraryDir, 'dist/es/index.js'), 'utf8')).keys()
      ].sort()
      expect(data.exports.map((e) => e.name)).toEqual(names)

      // Tree-shaking works: one import is a fraction of the whole.
      for (const e of data.exports) {
        expect(e.gzip, e.name).toBeGreaterThan(0)
        expect(e.gzip, e.name).toBeLessThan(data.total!.gzip / 2)
      }
      expect(data.exports.find((e) => e.name === 'useCheckout')?.aliasOf).toBe('useStripeCheckout')

      // Everything with a page of its own links to it.
      const unlinked = data.exports.filter((e) => !e.link).map((e) => e.name)
      expect(unlinked).toEqual([])

      // The first element carries the shared factory; the ones after it are small.
      expect(data.elements!.first).toBeGreaterThan(data.elements!.own * 4)
      const range = addedRange(data.exports)!
      expect(range.max).toBeLessThan(data.elements!.first / 4)

      expect(data.combinations.map((c) => c.id)).toEqual([
        'payment-element',
        'card-element',
        'embedded-checkout',
        'checkout-redirect'
      ])
      expect(data.stylesheet!.gzip).toBeLessThan(data.stylesheet!.raw)
      expect(data.stripeLoader?.size.gzip).toBeGreaterThan(0)
      // The CJS and UMD builds hold every export.
      expect(data.builds.cjs!.gzip).toBeGreaterThan(data.total!.gzip * 0.9)
      expect(data.builds.umd!.gzip).toBeGreaterThan(data.total!.gzip * 0.9)

      // One figure per CI budget, measured the way size-limit measures it.
      const budgets = JSON.parse(readFileSync(join(libraryDir, '.size-limit.json'), 'utf8')) as {
        name: string
      }[]
      expect(data.budgets.map((b) => b.name)).toEqual(budgets.map((b) => b.name))
      expect(data.budgets[0]!.size).toBe(data.total!.gzip)

      const parts = bundleSizeMarkdown(data)
      expect(parts['BundleSize#summary']).toContain(formatSize(data.total!.gzip, 2))
      expect(parts['BundleSize#table']).toContain('[`useStripe`](https://vuestripe.com/api/')
      expect(homeBundleSizeMarkdown(data)).toContain(
        `${formatSize(data.total!.gzip)} for the whole library`
      )
    },
    60_000
  )
})
