module.exports = {
  root: true,
  extends: ['@vue-stripe/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};