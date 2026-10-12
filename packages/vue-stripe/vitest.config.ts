import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  define: {
    __VUE_STRIPE_VERSION__: JSON.stringify(pkg.version)
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src')
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
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts', 'src/types/**', 'src/utils/constants.ts'],
      // Ratchet: one point below the totals measured after the render-function
      // rewrite (91.58 / 79.36 / 98.07 / 92.81, #481). Never lower these.
      thresholds: {
        statements: 90,
        branches: 78,
        functions: 97,
        lines: 91
      }
    }
  }
})
