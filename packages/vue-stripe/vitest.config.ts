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
      // json-summary + json feed the PR coverage comment in CI.
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts', 'src/types/**', 'src/utils/constants.ts'],
      // Self-ratcheting: when coverage rises, the run rewrites these numbers upward
      // (rounded down to whole points). Never edit them downward.
      // perFile: every src file must also meet these floors on its own.
      thresholds: {
        autoUpdate: (newThreshold: number) => Math.floor(newThreshold),
        perFile: { statements: 80, branches: 70, functions: 60, lines: 80 },
        statements: 98,
        branches: 90,
        functions: 100,
        lines: 99
      }
    }
  }
})
