import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
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
      external: ['vue-demi', '@stripe/stripe-js'],
      output: {
        globals: {
          'vue-demi': 'VueDemi',
          '@stripe/stripe-js': 'Stripe'
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
