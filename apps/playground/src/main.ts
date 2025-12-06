import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import './styles/globals.css'

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL
  },
  ({ app, router, head, isClient, initialState }) => {
    // head is automatically provided by vite-ssg via @unhead/vue
    // No additional setup needed - useHead() works out of the box
  }
)
