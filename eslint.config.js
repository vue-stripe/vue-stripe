// Single ESLint flat config for every workspace. ESLint 10 resolves the config
// from each linted file upward, so `eslint .` inside any workspace uses this file.
// CI runs `pnpm lint` (eslint . --max-warnings 0 in every workspace).
import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Product code that gets type-aware rules (tests and config files get the base rules).
const TYPED_SOURCES = [
  'packages/vue-stripe/src/**/*.ts',
  'apps/playground/src/**/*.ts',
  'apps/docs/.vitepress/**/*.ts',
  'apps/backend/src/**/*.{ts,tsx}'
]

// eslint-config-next targets a standalone Next app; scope it to apps/backend.
const BACKEND = 'apps/backend'
const scopeToBackend = (configs) =>
  configs.map((config) => {
    if (Object.keys(config).length === 1 && config.ignores) {
      return { ignores: config.ignores.map((p) => `${BACKEND}/${p}`) }
    }
    const files = config.files
      ? config.files.map((p) => `${BACKEND}/${p}`)
      : [`${BACKEND}/**/*.{js,jsx,mjs,ts,tsx,mts,cts}`]
    return { ...config, files }
  })

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
      '**/*.timestamp-*.mjs',
      'apps/docs/.vitepress/cache/**',
      'apps/docs/.vitepress/dist/**',
      `${BACKEND}/.next/**`,
      // Browser e2e run output (HTML report, traces).
      'tools/browser-e2e/results/**'
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off'
    }
  },

  // Vue SFCs: TypeScript inside <script lang="ts">.
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] }
    }
  },

  // Type-aware rules for product code.
  {
    files: TYPED_SOURCES,
    extends: [tseslint.configs.recommendedTypeCheckedOnly],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    }
  },

  // The library must stay Vue 2.7 / Vue 3 compatible: runtime imports go through vue-demi.
  {
    files: ['packages/vue-stripe/src/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              message: "Import from 'vue-demi' so the library works on Vue 2.7 and Vue 3."
            }
          ]
        }
      ]
    }
  },

  // Tests mock Stripe.js with loosely typed stubs.
  {
    files: ['**/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-console': 'off'
    }
  },

  // Node-side files.
  {
    files: ['**/*.config.{js,ts,mjs,cjs}', 'scripts/**', 'tools/**', `${BACKEND}/**`],
    languageOptions: { globals: { ...globals.node } }
  },

  // Repo scripts (seeding, CI helpers) report progress on stdout.
  { files: ['scripts/**'], rules: { 'no-console': 'off' } },

  ...scopeToBackend(nextVitals),
  // Let @next/eslint-plugin-next find the app when ESLint runs from the repo root (lint-staged).
  { files: [`${BACKEND}/**`], settings: { next: { rootDir: BACKEND } } },

  // eslint-config-next parses plain JS with its Babel parser, whose scope manager makes
  // typescript-eslint's no-unused-vars report every value as type-only; use the core rule.
  {
    files: [`${BACKEND}/**/*.{js,mjs,cjs}`],
    rules: { '@typescript-eslint/no-unused-vars': 'off', 'no-unused-vars': 'error' }
  },

  // Formatting belongs to Prettier (`pnpm format:check`); turn off conflicting stylistic rules.
  prettier
)
