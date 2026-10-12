import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, it } from 'vitest'
// Aliased to vue-demi/lib/v2.7/index.mjs by vitest.config.ts. The allowlist comes
// from vue-demi (not vue) because the bundle legitimately imports vue-demi-only
// names such as isVue2.
import * as VueDemi27 from 'vue-demi'

const require = createRequire(import.meta.url)

it('the published ESM bundle only imports vue-demi names that the Vue 2.7 build exports', () => {
  const entry = require
    .resolve('@vue-stripe/vue-stripe')
    .replace(/cjs[\\/]index\.js$/, 'es/index.js')
  const bundle = readFileSync(entry, 'utf8')
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
  const cjs = require.resolve('@vue-stripe/vue-stripe')
  for (const entry of [cjs, cjs.replace(/cjs[\\/]index\.js$/, 'es/index.js')]) {
    const bundle = readFileSync(entry, 'utf8')
    const specifiers = [
      ...bundle.matchAll(/(?:from\s*|require\()\s*['"](@stripe\/stripe-js[^'"]*)['"]/g)
    ].map((match) => match[1])
    expect(specifiers.length, entry).toBeGreaterThan(0)
    expect(new Set(specifiers), entry).toEqual(new Set(['@stripe/stripe-js/pure']))
  }
})
