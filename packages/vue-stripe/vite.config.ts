import { defineConfig, normalizePath, type Plugin } from 'vite'
import { resolve } from 'path'
import pkg from './package.json' with { type: 'json' }

// @stripe/stripe-js has no "exports" map, so Node's ESM loader (SSR without bundling: Vite SSR
// externals, Nuxt dev, Nitro) rejects the directory import '@stripe/stripe-js/pure'. The ES
// build names the file instead; CJS keeps the directory, which require() resolves itself.
const esmPureEntry = (): Plugin => ({
  name: 'vue-stripe:esm-pure-entry',
  renderChunk(code, _chunk, options) {
    if (options.format !== 'es') return null
    return code.replace(/(['"])@stripe\/stripe-js\/pure\1/g, '$1@stripe/stripe-js/pure/index.mjs$1')
  }
})

// Component styles, emitted as dist/vue-stripe.css (exported as '@vue-stripe/vue-stripe/style.css').
// The build adds the import to the entry, not src/index.ts itself: tsc would copy
// `import './styles.css'` into dist/types/index.d.ts, where no styles.css exists (#622).
const entry = resolve(import.meta.dirname, 'src/index.ts')
const stylesheet = (): Plugin => ({
  name: 'vue-stripe:stylesheet',
  transform(code, id) {
    if (normalizePath(id) !== normalizePath(entry)) return null
    return { code: `import './styles.css'\n${code}`, map: null }
  }
})

// `vite build` emits the ES and CommonJS builds (and the stylesheet); `vite build --mode umd`
// then adds the UMD build to the same dist/. The UMD build is for a <script> tag, where
// @stripe/stripe-js has no global to read (it ships no browser build), so it bundles the
// `pure` loader and needs only the Vue and VueDemi globals (#714). Stripe.js itself still
// loads from js.stripe.com at runtime. Apps with a bundler install @stripe/stripe-js
// themselves, so the ES and CJS builds keep it external.
export default defineConfig(({ mode }) => {
  const umd = mode === 'umd'
  return {
    plugins: umd ? [] : [stylesheet(), esmPureEntry()],
    define: {
      __VUE_STRIPE_VERSION__: JSON.stringify(pkg.version)
    },
    build: {
      lib: {
        entry,
        name: 'VueStripe',
        cssFileName: 'vue-stripe',
        formats: umd ? ['umd'] : ['es', 'cjs'],
        fileName: (format) => {
          switch (format) {
            case 'es':
              return 'es/index.js'
            case 'cjs':
              return 'cjs/index.cjs'
            case 'umd':
              return 'umd/index.js'
            default:
              return 'index.js'
          }
        }
      },
      rollupOptions: {
        // Source imports Vue APIs only from vue-demi (enforced by lint), which picks Vue 2.7 or 3.
        // Stripe.js is loaded through '@stripe/stripe-js/pure' (no <script> on import).
        external: umd ? ['vue-demi'] : ['vue-demi', '@stripe/stripe-js', '@stripe/stripe-js/pure'],
        output: {
          globals: { 'vue-demi': 'VueDemi' },
          postBanner: umd
            ? '/*! Includes the @stripe/stripe-js loader: MIT License, Copyright (c) 2017 Stripe */'
            : undefined
        }
      },
      outDir: 'dist',
      // The second (UMD) build adds to the first one's output.
      emptyOutDir: !umd
    },
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src')
      }
    }
  }
})
