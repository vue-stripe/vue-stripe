import { computed } from 'vue'

/**
 * Access Stripe configuration from build-time injected environment variables
 * Uses Vite's define feature which replaces import.meta.env.* at build time
 */
export function useStripeConfig() {
  // These values are replaced at build time via vite.define in config.ts
  // This is more reliable than themeConfig for SSG builds
  const publishableKey = computed(() => import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')
  const apiUrl = computed(() => import.meta.env.VITE_API_URL || 'https://backend.vuestripe.com')

  return {
    publishableKey,
    apiUrl,
  }
}
