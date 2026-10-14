// Measures the built library for /guide/bundle-size and the home page (through
// bundle-size.data.ts) and their Markdown copies (config.ts buildEnd). Node only.
//
// Every figure is what an app's bundler adds for `import { ... } from '@vue-stripe/vue-stripe'`:
// the import is bundled from dist/es/index.js with Rolldown, tree-shaken and minified, with
// Vue and @stripe/stripe-js left external, then gzipped. These are the settings size-limit
// uses for the CI budgets (packages/vue-stripe/.size-limit.json), so the two agree to the
// byte. A library that was not built leaves every figure empty; the build goes on.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { VERSION as ROLLDOWN_VERSION, rolldown } from 'rolldown'
import { apiLinkIn } from './api-links'
import {
  emptyBundleSizes,
  groupOf,
  type BundleSizes,
  type Combination,
  type ExportSize,
  type Size
} from './bundle-size'

/** Integrations measured as a whole: everything each one imports together. */
export const COMBINATIONS: Omit<Combination, 'size'>[] = [
  {
    id: 'payment-element',
    title: 'Payment Element checkout',
    imports: [
      'VueStripeProvider',
      'VueStripeElements',
      'VueStripePaymentElement',
      'usePaymentIntent'
    ]
  },
  {
    id: 'card-element',
    title: 'Card Element payment',
    imports: [
      'VueStripeProvider',
      'VueStripeElements',
      'VueStripeCardElement',
      'useConfirmCardPayment'
    ]
  },
  {
    id: 'embedded-checkout',
    title: 'Embedded Checkout',
    imports: ['VueStripeProvider', 'VueStripeEmbeddedCheckout']
  },
  {
    id: 'checkout-redirect',
    title: 'Redirect to Stripe Checkout',
    imports: ['useStripeCheckout']
  }
]

/** The element measured first; every other element is measured as the one after it. */
const BASE_ELEMENT = 'VueStripePaymentElement'
const SECOND_ELEMENT = 'VueStripeCardElement'

/** Exports documented on a shared page rather than one of their own. */
const SHARED_PAGES: Record<string, string> = {
  loadStripe: '/api/#plugin',
  stripeConfigInjectionKey: '/api/plugin#provided-values',
  VueStripeProviderError: '/api/types#error-classes',
  VueStripeElementsError: '/api/types#error-classes',
  VueStripeCheckoutError: '/api/types#error-classes'
}

/** Vue and Stripe.js come from the app, as size-limit's `ignore` list has them. */
const EXTERNAL = /^(vue-demi|vue|@stripe\/stripe-js)($|\/)/
const ENTRY = 'vue-stripe-size-entry'
const CONCURRENCY = 8

const gzip = (code: string | Buffer) => gzipSync(code, { level: 9 }).length

/** Rolldown with size-limit's settings, on an entry module given as source. */
async function bundle(code: string, options: { cwd: string; external?: RegExp }) {
  const build = await rolldown({
    input: ENTRY,
    cwd: options.cwd,
    treeshake: true,
    ...(options.external ? { external: options.external } : {}),
    // An import that does not resolve or a name the build does not export would shrink the
    // number silently; fail instead.
    onLog(_level, log) {
      if (log.code === 'UNRESOLVED_IMPORT' || log.code === 'MISSING_EXPORT') {
        throw new Error(log.message)
      }
    },
    plugins: [
      {
        name: 'vue-stripe-size-entry',
        resolveId: (id) => (id === ENTRY ? `\0${ENTRY}` : null),
        load: (id) => (id === `\0${ENTRY}` ? code : null)
      }
    ]
  })
  try {
    const { output } = await build.generate({
      format: 'esm',
      minify: true,
      comments: { annotation: false }
    })
    const chunks = output.filter((o) => o.type === 'chunk')
    return {
      code: chunks.map((c) => c.code).join(''),
      exports: chunks.flatMap((c) => c.exports),
      modules: chunks.flatMap((c) => c.moduleIds)
    }
  } finally {
    await build.close()
  }
}

/** Runs `run` over `items`, a few at a time. */
async function pool<T, R>(items: T[], run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await run(items[i]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  return results
}

/**
 * The built file's closing `export { local as name, ... }` clause, as exported name -> local
 * binding. Two names on one binding are the same export (`useCheckout`, `useStripeCheckout`).
 */
export function exportBindings(source: string): Map<string, string> {
  const clause = /export\s*\{([^}]*)\}\s*;?\s*$/.exec(source.trim())?.[1] ?? ''
  const bindings = new Map<string, string>()
  for (const part of clause.split(',')) {
    const [local, name = local] = part.trim().split(/\s+as\s+/)
    if (local && name) bindings.set(name, local)
  }
  return bindings
}

/** `11.59 kB` -> 11590, `380 B` -> 380 (size-limit's decimal units). */
export function parseLimit(limit: string): number | null {
  const [, value, unit = 'B'] = /^\s*([\d.]+)\s*(B|kB|KB|MB)?\s*$/.exec(limit) ?? []
  if (!value) return null
  const scale = unit === 'B' ? 1 : unit === 'MB' ? 1_000_000 : 1000
  return Math.round(Number(value) * scale)
}

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export interface MeasureOptions {
  /** The library package (packages/vue-stripe), with its dist built. */
  libraryDir?: string
  /** The docs (apps/docs), for each export's API page. */
  docsDir?: string
  onError?: (message: string) => void
}

export async function measureBundleSizes(options: MeasureOptions = {}): Promise<BundleSizes> {
  const libraryDir = options.libraryDir ?? here('../../../../../packages/vue-stripe/')
  const docsDir = options.docsDir ?? here('../../../')
  const onError = options.onError ?? (() => {})
  const distFile = join(libraryDir, 'dist/es/index.js')
  if (!existsSync(distFile)) {
    onError(`${distFile} does not exist; build the library first. The page shows its fallback.`)
    return emptyBundleSizes()
  }

  try {
    const pkg = JSON.parse(readFileSync(join(libraryDir, 'package.json'), 'utf8')) as {
      version: string
    }
    const library = { cwd: libraryDir, external: EXTERNAL }
    const from = JSON.stringify(distFile)

    // What the entry module itself costs (`console.log()`), taken off every import's size,
    // as size-limit does.
    const wrapper = (await bundle('console.log()', library)).code
    const baseline = { minified: Buffer.byteLength(wrapper), gzip: gzip(wrapper) }
    const measured = new Map<string, Promise<Size>>()
    const sizeOf = (names: string[]): Promise<Size> => {
      const key = names.join(',')
      let size = measured.get(key)
      if (!size) {
        size = bundle(
          `import { ${names.join(', ')} } from ${from}\nconsole.log(${names.join(', ')})\n`,
          library
        ).then(({ code }) => ({
          minified: Buffer.byteLength(code) - baseline.minified,
          gzip: gzip(code) - baseline.gzip
        }))
        measured.set(key, size)
      }
      return size
    }

    // The whole build, and the list of what it exports (runtime exports only: types have no
    // code in dist).
    const all = await bundle(`export * from ${from}`, library)
    const total = { minified: Buffer.byteLength(all.code), gzip: gzip(all.code) - gzip('') }
    const names = [...all.exports].sort()

    // Aliases: the canonical name is the one with an API page.
    const bindings = exportBindings(readFileSync(distFile, 'utf8'))
    const confirmDir = join(docsDir, 'api/composables/confirm')
    const confirmPages = existsSync(confirmDir)
      ? Object.fromEntries(
          readdirSync(confirmDir)
            .filter((f) => f.endsWith('.md'))
            .map((f) => [f, readFileSync(join(confirmDir, f), 'utf8')])
        )
      : {}
    const pageOf = (name: string) => {
      const link = SHARED_PAGES[name] ?? apiLinkIn(name, confirmPages)
      const path = link?.replace(/#.*$/, '')
      if (!path) return undefined
      const file = join(docsDir, path.endsWith('/') ? `${path}index.md` : `${path}.md`)
      return existsSync(file) ? link : undefined
    }
    const canonical = new Map<string, string>()
    for (const name of names) {
      const local = bindings.get(name)
      const same = names.filter((n) => local !== undefined && bindings.get(n) === local)
      if (same.length < 2) continue
      canonical.set(name, same.find((n) => pageOf(n)) ?? same[0]!)
    }

    const exports: ExportSize[] = await pool(names, async (name) => {
      const aliasOf = canonical.get(name) === name ? undefined : canonical.get(name)
      return {
        name,
        group: groupOf(name),
        ...(await sizeOf([name])),
        aliasOf,
        link: pageOf(aliasOf ?? name)
      }
    })

    const has = (name: string) => names.includes(name)
    const combinations: Combination[] = await pool(
      COMBINATIONS.filter((c) => c.imports.every(has)),
      async (c) => ({ ...c, size: await sizeOf(c.imports) })
    )

    // The first element brings the factory and provider plumbing; later ones only themselves.
    let elements: BundleSizes['elements'] = null
    if (has(BASE_ELEMENT) && has(SECOND_ELEMENT)) {
      const first = (await sizeOf([BASE_ELEMENT])).gzip
      await pool(
        exports.filter((e) => e.group === 'elements' && !e.aliasOf),
        async (e) => {
          const [other, before] =
            e.name === BASE_ELEMENT
              ? [SECOND_ELEMENT, SECOND_ELEMENT]
              : [BASE_ELEMENT, BASE_ELEMENT]
          e.added = (await sizeOf([other, e.name])).gzip - (await sizeOf([before])).gzip
        }
      )
      elements = {
        base: BASE_ELEMENT,
        first,
        own: exports.find((e) => e.name === BASE_ELEMENT)!.added!
      }
    }

    const fileSize = (path: string) => {
      const file = join(libraryDir, path)
      return existsSync(file) ? readFileSync(file) : null
    }
    const css = fileSize('dist/vue-stripe.css')
    const cjs = fileSize('dist/cjs/index.cjs')
    const umd = fileSize('dist/umd/index.js')

    // The Stripe.js loader is the app's own dependency (a peer of the library), bundled here
    // on its own. Stripe.js itself comes from js.stripe.com and is in no bundle.
    let stripeLoader: BundleSizes['stripeLoader'] = null
    try {
      const { code, modules } = await bundle(
        `import { loadStripe } from '@stripe/stripe-js/pure'\nconsole.log(loadStripe)\n`,
        { cwd: libraryDir }
      )
      // The version of the copy that was bundled, from the package.json above its files.
      const marker = '/@stripe/stripe-js/'
      const file = modules.map((id) => id.replace(/\\/g, '/')).find((id) => id.includes(marker))
      if (!file) throw new Error('the bundle has no @stripe/stripe-js module')
      const stripePkg = JSON.parse(
        readFileSync(
          `${file.slice(0, file.lastIndexOf(marker) + marker.length)}package.json`,
          'utf8'
        )
      ) as { version: string }
      stripeLoader = {
        version: stripePkg.version,
        size: {
          minified: Buffer.byteLength(code) - baseline.minified,
          gzip: gzip(code) - baseline.gzip
        }
      }
    } catch (error) {
      onError(`the @stripe/stripe-js loader could not be measured: ${String(error)}`)
    }

    const budgets: BundleSizes['budgets'] = []
    const limits = fileSize('.size-limit.json')
    if (limits) {
      const checks = JSON.parse(limits.toString('utf8')) as {
        name: string
        limit: string
        import?: string
      }[]
      for (const check of checks) {
        const limit = parseLimit(check.limit)
        if (limit === null) continue
        const imported = check.import
          ?.replace(/[{}]/g, '')
          .split(',')
          .map((n) => n.trim())
        const size = imported ? (await sizeOf(imported)).gzip : total.gzip
        budgets.push({ name: check.name, limit, size })
      }
    }

    return {
      measuredAt: new Date().toISOString(),
      version: pkg.version,
      bundler: `Rolldown ${ROLLDOWN_VERSION}`,
      total,
      combinations,
      elements,
      exports,
      stylesheet: css ? { raw: css.length, gzip: gzip(css) } : null,
      builds: {
        cjs: cjs ? { minified: cjs.length, gzip: gzip(cjs) } : null,
        umd: umd ? { minified: umd.length, gzip: gzip(umd) } : null
      },
      stripeLoader,
      budgets
    }
  } catch (error) {
    onError(
      `${error instanceof Error ? error.message : String(error)}. The page shows its fallback.`
    )
    return emptyBundleSizes()
  }
}

const SIZES_CACHE = Symbol.for('vue-stripe.docs.bundle-sizes')

/**
 * The build's one measurement: the data loader and the Markdown writer (config.ts buildEnd)
 * run in the same process but import this file separately, so the promise is kept on
 * globalThis.
 */
export function loadBundleSizes(): Promise<BundleSizes> {
  const store = globalThis as typeof globalThis & { [SIZES_CACHE]?: Promise<BundleSizes> }
  store[SIZES_CACHE] ??= measureBundleSizes({
    onError: (message) =>
      console.warn(`[Vue Stripe docs] Bundle size measurement for /guide/bundle-size: ${message}`)
  })
  return store[SIZES_CACHE]
}
