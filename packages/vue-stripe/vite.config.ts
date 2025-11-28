import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
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
      external: ['vue', 'vue-demi', '@stripe/stripe-js'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-demi': 'VueDemi',
          '@stripe/stripe-js': 'Stripe'
        }
      }
    },
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})