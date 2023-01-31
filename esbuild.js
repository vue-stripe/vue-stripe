require('esbuild').build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/index.js',
  format: 'cjs',
  bundle: true,
}).then(() => console.log('⚡ Done'))
  .catch(() => process.exit(1));
