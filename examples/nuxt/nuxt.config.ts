export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  css: ['@vue-stripe/vue-stripe/style.css', '~/assets/style.css'],
  // Nuxt maps NUXT_-prefixed env variables onto these keys; only `public` reaches the browser.
  runtimeConfig: {
    stripeSecretKey: '', // NUXT_STRIPE_SECRET_KEY
    public: {
      stripePublishableKey: '', // NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      // NUXT_PUBLIC_API_BASE: empty calls this app's server/api routes; set it to call another
      // server's /api routes, such as the Vue Stripe demo backend.
      apiBase: ''
    }
  }
})
