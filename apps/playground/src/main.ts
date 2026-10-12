import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import '@vue-stripe/vue-stripe/style.css'
import './styles/globals.css'

// https://github.com/antfu/vite-ssg
// Head management is provided automatically by vite-ssg via @unhead/vue,
// so useHead() works without any extra setup in the app hook.
export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL
})
