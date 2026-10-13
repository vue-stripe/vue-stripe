import { defineConfig, type Plugin } from 'vite'
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

export default defineConfig({
  plugins: [esmPureEntry()],
  define: {
    __VUE_STRIPE_VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'VueStripe',
      cssFileName: 'vue-stripe',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'es/index.js'
          case 'cjs':
            return 'cjs/index.js'
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
      external: ['vue-demi', '@stripe/stripe-js', '@stripe/stripe-js/pure'],
      output: {
        globals: {
          'vue-demi': 'VueDemi',
          '@stripe/stripe-js': 'Stripe',
          '@stripe/stripe-js/pure': 'Stripe'
        }
      }
    },
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src')
    }
  }
})
