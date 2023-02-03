const vuePlugin = require('esbuild-plugin-vue3');

require('esbuild').build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/index.js',
  format: 'cjs',
  bundle: true,
  external: ['vue'],
  plugins: [vuePlugin()],
}).then(() => console.log('⚡ Done'))
  .catch(() => process.exit(1));
