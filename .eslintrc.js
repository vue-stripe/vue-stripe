module.exports = {
  root: true,

  env: {
    node: true,
  },

  extends: ['plugin:vue/vue3-essential', '@vue/standard'],

  parserOptions: {
    parser: '@babel/eslint-parser',
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],

  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    // custom
    semi: [2, 'always'],
    'space-before-function-paren': [2, 'always'],
    'keyword-spacing': [2, { before: true, after: true }],
    'space-before-blocks': [2, 'always'],
    'comma-dangle': [2, 'always-multiline'],
    'no-multi-str': 'off',
    curly: 1,
    'no-undef': 'off',
  },
};
