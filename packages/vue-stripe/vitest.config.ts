import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from './package.json'

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_STRIPE_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/index.ts',
        'src/**/index.ts',
        'src/shims-vue.d.ts',
        'src/types/**',
        'src/utils/constants.ts'
      ],
      // Ratchet thresholds: set just below current levels so the suite passes
      // today while preventing regressions. Raise as coverage improves.
      thresholds: {
        statements: 85,
        branches: 72,
        functions: 60,
        lines: 85
      }
    }
  }
})