const babel = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');

module.exports = {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
    },
  ],
  plugins: [
    terser(),
    commonjs(),
    resolve(),
    babel.getBabelOutputPlugin({
      presets: ['@babel/preset-env'],
      plugins: [
        ['@babel/plugin-proposal-optional-chaining'],
      ],
    }),
  ],
};
