import { useData } from 'vitepress'
import { computed } from 'vue'

interface StripeConfig {
  publishableKey: string
  apiUrl: string
}

/**
 * Access Stripe configuration from VitePress themeConfig
 * This is more reliable than import.meta.env for SSG builds
 */
export function useStripeConfig() {
  const { theme } = useData()

  const config = computed<StripeConfig>(() => {
    const stripeConfig = (theme.value as any)?.stripeConfig
    return {
      publishableKey: stripeConfig?.publishableKey || '',
      apiUrl: stripeConfig?.apiUrl || 'https://backend.vuestripe.com',
    }
  })

  return {
    publishableKey: computed(() => config.value.publishableKey),
    apiUrl: computed(() => config.value.apiUrl),
  }
}
