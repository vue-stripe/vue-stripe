import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { expect, it } from 'vitest'
// Aliased to vue-demi/lib/v2.7/index.mjs by vitest.config.ts. The allowlist comes
// from vue-demi (not vue) because the bundle legitimately imports vue-demi-only
// names such as isVue2.
import * as VueDemi27 from 'vue-demi'

const require = createRequire(import.meta.url)
// require.resolve() follows the package's "require" condition: the CommonJS entry.
const cjsEntry = require.resolve('@vue-stripe/vue-stripe')
const distDir = dirname(dirname(cjsEntry))
const esEntry = `${distDir}/es/index.js`

it('the published ESM bundle only imports vue-demi names that the Vue 2.7 build exports', () => {
  const bundle = readFileSync(esEntry, 'utf8')
  const imported = [...bundle.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]vue-demi['"]/g)]
    .flatMap((match) => (match[1] ?? '').split(','))
    .map((name) => name.trim().split(/\s+as\s+/)[0] ?? '')
    .filter(Boolean)
  expect(imported.length).toBeGreaterThan(0)
  const available = new Set(Object.keys(VueDemi27))
  const missing = imported.filter((name) => !available.has(name))
  expect(missing, `Vue-3-only imports in dist: ${missing.join(', ')}`).toEqual([])
})

it('the published bundles load Stripe.js only through the side-effect-free pure entry', () => {
  // The default @stripe/stripe-js entry injects a Stripe.js <script> as soon as it
  // is imported, before advancedFraudSignals: false could reach setLoadParameters().
  for (const entry of [cjsEntry, esEntry]) {
    const bundle = readFileSync(entry, 'utf8')
    const specifiers = [
      ...bundle.matchAll(/(?:from\s*|require\()\s*['"](@stripe\/stripe-js[^'"]*)['"]/g)
    ].map((match) => match[1])
    expect(specifiers.length, entry).toBeGreaterThan(0)
    // The ES build names the file: @stripe/stripe-js has no "exports" map, and Node's ESM
    // loader rejects the bare directory import '@stripe/stripe-js/pure'.
    const expected =
      entry === cjsEntry ? '@stripe/stripe-js/pure' : '@stripe/stripe-js/pure/index.mjs'
    expect(new Set(specifiers), entry).toEqual(new Set([expected]))
  }
})

it('the ESM bundle imports in plain Node, as SSR without bundling does', () => {
  // Vite SSR externals, Nuxt dev (vite-node) and Nitro load the package with Node's own ESM
  // loader. Run that import in a separate Node process from the library's own directory.
  const script = `const m = await import(${JSON.stringify(pathToFileURL(esEntry).href)}); console.log(typeof m.VueStripeProvider)`
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: dirname(esEntry),
    encoding: 'utf8'
  })
  expect(out.trim()).toBe('object')
})

it('require() in plain Node returns the same exports as import() (#595)', () => {
  // A CommonJS consumer (SSR server bundle built as CJS, ts-node, a Node script) loads the
  // package through its "require" condition. In a "type": "module" package a .js file is ES,
  // so the CJS entry must be a .cjs file, or require() returns an empty namespace.
  const script = `
    const required = require('@vue-stripe/vue-stripe')
    import('@vue-stripe/vue-stripe').then((imported) => console.log(JSON.stringify({
      required: Object.keys(required).sort(),
      imported: Object.keys(imported).sort(),
      provider: typeof required.VueStripeProvider
    })))`
  const out = execFileSync(process.execPath, ['-e', script], {
    cwd: dirname(require.resolve('../package.json')),
    encoding: 'utf8'
  })
  const { required, imported, provider } = JSON.parse(out) as Record<string, unknown>
  expect(provider).toBe('object')
  expect((imported as string[]).length).toBeGreaterThan(50)
  expect(required).toEqual(imported)
})
