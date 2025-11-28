module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:vue/vue3-recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.vue']
  },
  rules: {
    // Vue specific rules
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/block-lang': [
      'error',
      {
        script: {
          lang: 'ts'
        }
      }
    ],
    'vue/block-order': ['error', {
      order: ['script', 'template', 'style']
    }],
    'vue/define-emits-declaration': ['error', 'type-based'],
    'vue/define-props-declaration': ['error', 'type-based'],
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports'
    }],
    
    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-destructuring': ['warn', {
      array: false,
      object: true
    }],
    
    // Import rules (if eslint-plugin-import is added)
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
    }]
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.d.ts',
    'coverage',
    '.vitepress/dist',
    '.vitepress/cache'
  ]
}