// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { build } from 'esbuild'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// size-limit measures tree-shaking with rolldown (the Vite and Rollup case). esbuild is
// stricter about what it may drop: a spread (`[...BASE_EVENTS, 'x']`) in an element
// definition's arguments counts as a possible side effect, so every such definition stayed
// in any esbuild bundle of the published build, even one that imports only `useStripe`.
// These tests bundle the built dist/es/index.js (what apps install; `pnpm test` builds it
// first) with esbuild and check that unused element components are dropped.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const componentsDir = resolve(root, 'src/components')
const dist = resolve(root, 'dist/es/index.js')

/** componentName of every createStripeElement definition, by its export name. */
const ELEMENT_NAMES = readdirSync(componentsDir)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => readFileSync(resolve(componentsDir, f), 'utf8'))
  .filter((source) => /createStripeElement\s*[<(]/.test(source))
  .map((source) => /componentName:\s*'([^']+)'/.exec(source)?.[1])
  .filter((name): name is string => Boolean(name))

async function bundle(names: string[]): Promise<string> {
  if (!existsSync(dist)) throw new Error('Build the library first: pnpm build')
  const result = await build({
    stdin: {
      contents: `export { ${names.join(', ')} } from ${JSON.stringify(dist)}`,
      resolveDir: root,
      loader: 'js'
    },
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    write: false,
    external: ['vue-demi', 'vue', '@stripe/stripe-js'],
    logLevel: 'silent'
  })
  return result.outputFiles[0]!.text
}

/** Element components whose componentName appears as a string in the bundle. */
const elementsIn = (code: string) =>
  ELEMENT_NAMES.filter((name) => code.includes(`"${name}"`) || code.includes(`'${name}'`))

describe('tree-shaking with esbuild', () => {
  it('finds the element definitions to check', () => {
    expect(ELEMENT_NAMES.length).toBeGreaterThan(15)
    expect(ELEMENT_NAMES).toContain('VueStripePaymentElement')
  })

  it.each(['useStripe', 'useConfirmCardPayment', 'usePaymentIntent'])(
    'a bundle of %s alone has no element component',
    async (name) => {
      const code = await bundle([name])
      expect(elementsIn(code)).toEqual([])
    }
  )

  it.each(['VueStripeCardElement', 'VueStripePaymentElement', 'VueStripeAddressElement'])(
    'a bundle of %s keeps no other element component',
    async (name) => {
      const code = await bundle([name])
      expect(elementsIn(code)).toEqual([name])
    }
  )
})
