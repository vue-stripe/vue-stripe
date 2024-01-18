import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      // eslint-disable-next-line      
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'vue-stripe',
      fileName: (format) => `vue-stripe.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['vue-demi'],
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
