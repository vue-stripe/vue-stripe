// The numbers on /guide/bundle-size and the home page: what each Vue Stripe export adds to an
// app, minified and gzipped. The build measures them from the library's own dist through
// bundle-size.data.ts (see ./measure-bundle.ts), so they cannot drift from the code. This file
// holds what the pages need in the browser too: the data's shape, grouping and formatting.

/** Bytes of one measured bundle. */
export interface Size {
  minified: number
  gzip: number
}

export type ExportGroup =
  'providers' | 'elements' | 'checkout' | 'disclosures' | 'composables' | 'confirmers' | 'utilities'

/** The table's groups, in the order the API reference lists them. */
export const EXPORT_GROUPS: { id: ExportGroup; title: string }[] = [
  { id: 'providers', title: 'Providers and plugin' },
  { id: 'elements', title: 'Element components' },
  { id: 'checkout', title: 'Checkout and pricing table' },
  { id: 'disclosures', title: 'Disclosures' },
  { id: 'composables', title: 'Composables' },
  { id: 'confirmers', title: 'Method confirmers' },
  { id: 'utilities', title: 'Utilities and errors' }
]

/** Which table group an export belongs to, from its name. */
export function groupOf(name: string): ExportGroup {
  if (/^VueStripe\w*Error$/.test(name)) return 'utilities'
  if (['VueStripeProvider', 'VueStripeElements', 'createVueStripe'].includes(name)) {
    return 'providers'
  }
  if (/^VueStripe\w*Disclosure$/.test(name)) return 'disclosures'
  if (/^VueStripe(Checkout|EmbeddedCheckout|PricingTable)/.test(name)) return 'checkout'
  if (name.startsWith('VueStripe')) return 'elements'
  if (/^useConfirm\w+(Payment|Setup)$/.test(name)) return 'confirmers'
  if (name.startsWith('use')) return 'composables'
  return 'utilities'
}

/** One export, imported on its own. */
export interface ExportSize extends Size {
  name: string
  group: ExportGroup
  /** The export it is another name for (`useCheckout` for `useStripeCheckout`). */
  aliasOf?: string | undefined
  /** Its API reference page, when it has one. */
  link?: string | undefined
  /** Element components: gzipped bytes it adds to an app that already has another element. */
  added?: number | undefined
}

/** A set of imports a real integration needs together. */
export interface Combination {
  id: string
  title: string
  imports: string[]
  size: Size
}

export interface BundleSizes {
  /** When the sizes were measured (ISO); null when the library was not built. */
  measuredAt: string | null
  /** The `@vue-stripe/vue-stripe` version measured. */
  version: string | null
  /** The bundler and version that measured them. */
  bundler: string | null
  /** Every export of the ESM build at once. */
  total: Size | null
  combinations: Combination[]
  /**
   * The first element component against each one after it. `first` is `base` imported on
   * its own, `own` what `base` adds when another element is already imported; the rest is
   * the element factory and provider plumbing every element shares.
   */
  elements: { base: string; first: number; own: number } | null
  exports: ExportSize[]
  /** dist/vue-stripe.css, as shipped (`raw`) and gzipped. */
  stylesheet: { raw: number; gzip: number } | null
  /** The CommonJS and UMD builds, whole (they are minified already, so `minified` is the file). */
  builds: { cjs: Size | null; umd: Size | null }
  /** The `@stripe/stripe-js/pure` loader the library imports, bundled on its own. */
  stripeLoader: { version: string; size: Size } | null
  /** The CI budgets in packages/vue-stripe/.size-limit.json, with the size measured here. */
  budgets: { name: string; limit: number; size: number }[]
}

export const emptyBundleSizes = (): BundleSizes => ({
  measuredAt: null,
  version: null,
  bundler: null,
  total: null,
  combinations: [],
  elements: null,
  exports: [],
  stylesheet: null,
  builds: { cjs: null, umd: null },
  stripeLoader: null,
  budgets: []
})

export const hasSizes = (data: BundleSizes): data is BundleSizes & { total: Size } =>
  data.total !== null

/** The table: each group's exports, smallest first; aliases sit after the export they name. */
export function groupExports(
  exports: ExportSize[]
): { id: ExportGroup; title: string; exports: ExportSize[] }[] {
  return EXPORT_GROUPS.map((group) => ({
    ...group,
    exports: exports
      .filter((e) => e.group === group.id)
      .sort(
        (a, b) =>
          a.gzip - b.gzip ||
          Number(Boolean(a.aliasOf)) - Number(Boolean(b.aliasOf)) ||
          a.name.localeCompare(b.name)
      )
  })).filter((group) => group.exports.length > 0)
}

/** The smallest and largest export (aliases left out). */
export function extremes(
  exports: ExportSize[]
): { smallest: ExportSize; largest: ExportSize } | null {
  const named = exports.filter((e) => !e.aliasOf)
  if (!named.length) return null
  const sorted = [...named].sort((a, b) => a.gzip - b.gzip || a.name.localeCompare(b.name))
  return { smallest: sorted[0]!, largest: sorted[sorted.length - 1]! }
}

/** What one more element adds, over every element measured. */
export function addedRange(
  exports: ExportSize[]
): { min: number; median: number; max: number } | null {
  const added = exports
    .filter((e) => !e.aliasOf && e.added !== undefined)
    .map((e) => e.added!)
    .sort((a, b) => a - b)
  if (!added.length) return null
  return {
    min: added[0]!,
    median: added[Math.floor(added.length / 2)]!,
    max: added[added.length - 1]!
  }
}

export const combination = (data: BundleSizes, id: string) =>
  data.combinations.find((c) => c.id === id)

export const exportSize = (data: BundleSizes, name: string) =>
  data.exports.find((e) => e.name === name)

// Formatting, as size-limit prints it: decimal kilobytes (1 kB = 1000 bytes).
/** `375` -> `375 B`, `11583` -> `11.6 kB` (`11.58 kB` with `digits: 2`). */
export function formatSize(bytes: number, digits = 1): string {
  if (Math.abs(bytes) < 1000) return `${bytes} B`
  return `${(bytes / 1000).toFixed(digits)} kB`
}

/**
 * `bytes` in the unit `final` is shown in, for a count up to `final`: towards 11583 the count
 * reads `0.0 kB`, `4.2 kB`, ... rather than switching from bytes to kilobytes on the way.
 */
export function formatSizeLike(bytes: number, final: number): string {
  if (Math.abs(final) < 1000) return `${Math.round(bytes)} B`
  return `${(bytes / 1000).toFixed(1)} kB`
}

const longDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
})
/** An ISO timestamp -> `Oct 14, 2026` (UTC, so the server render and the browser agree). */
export const formatMeasuredAt = (iso: string) => longDate.format(new Date(iso))

/** One home page figure. */
export interface SizeFigure {
  id: string
  bytes: number
  value: string
  label: string
}

/** The home page's size figures: the whole library, two typical integrations, one composable. */
export function homeSizeFigures(data: BundleSizes): SizeFigure[] {
  if (!hasSizes(data)) return []
  const payment = combination(data, 'payment-element')
  const embedded = combination(data, 'embedded-checkout')
  const useStripe = exportSize(data, 'useStripe')
  const figure = (id: string, bytes: number, label: string): SizeFigure => ({
    id,
    bytes,
    value: formatSize(bytes),
    label
  })
  const figures: (SizeFigure | null)[] = [
    figure('total', data.total.gzip, 'the whole library'),
    payment ? figure('payment', payment.size.gzip, 'a Payment Element checkout') : null,
    embedded ? figure('embedded', embedded.size.gzip, 'Embedded Checkout') : null,
    useStripe ? figure('use-stripe', useStripe.gzip, 'useStripe alone') : null
  ]
  return figures.filter((f): f is SizeFigure => f !== null)
}
