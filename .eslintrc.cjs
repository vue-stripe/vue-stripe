/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  globals: {
    __dirname: 'readonly',  // Indicate that __dirname is a global variable
  },
  rules: {
    'semi': ['error', 'always'],  // Require semicolons
    'comma-dangle': ['error', 'always-multiline'],  // Require dangling commas in multi-line statements
    'vue/multi-word-component-names': 'off',  // Allow single-word component names
    'space-before-function-paren': ['error', 'always'],  // Enforce space after parentheses in functions
  },
};
