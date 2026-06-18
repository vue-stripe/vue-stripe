import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    // Don't auto-open a browser: it errors (spawn xdg-open ENOENT) on headless /
    // SSH / CI machines and is intrusive under the monorepo's parallel `pnpm dev`.
    open: false
  },
  // SSG options
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    crittersOptions: {
      reduceInlineStyles: false
    },
    onFinished() {
      console.log('SSG build complete!')
    }
  }
})
