import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import pkg from './package.json'

export default defineConfig({
  define: {
    __VUE_STRIPE_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue(),
    dts({
      outDir: 'dist/types',
      insertTypesEntry: true,
      skipDiagnostics: true,
      staticImport: true,
      rollupTypes: false,
      exclude: ['**/*.spec.ts', '**/*.test.ts', 'src/**/__tests__/**']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueStripe',
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
      // Note: 'vue' is NOT externalized - it gets aliased to vue-demi
      // This ensures all vue imports become vue-demi imports for Vue 2/3 compatibility
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
      '@': resolve(__dirname, 'src'),
      // Alias vue to vue-demi so compiled SFC templates use vue-demi
      // This is critical for Vue 2 compatibility
      'vue': 'vue-demi'
    }
  }
})