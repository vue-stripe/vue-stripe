import vue from 'rollup-plugin-vue';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    exports: 'named',
    name: 'vue-stripe-checkout',
    file: 'dist/index.js',
    format: 'cjs'
  },
  plugins: [
    commonjs(),
    vue(),
  ]
};