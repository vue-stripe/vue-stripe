import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Send the app's /api requests to server.js.
    proxy: { '/api': 'http://localhost:3000' }
  }
})
