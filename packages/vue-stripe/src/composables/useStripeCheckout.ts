import { ref, readonly, type Ref } from 'vue-demi'
import { VueStripeCheckoutError } from '../utils/errors'

export interface CheckoutRedirectOptions {
  /** Hosted Checkout URL (`session.url`) returned by your server. */
  url: string
}

export interface UseStripeCheckoutReturn {
  /** Redirect to a hosted Checkout Session URL. Rejects with `VueStripeCheckoutError` without one. */
  redirectToCheckout: (options: CheckoutRedirectOptions) => Promise<void>
  /** Redirect to a hosted Checkout Session URL. */
  redirectToUrl: (url: string) => void
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/**
 * Hosted Checkout redirect helper.
 *
 * Stripe.js removed `stripe.redirectToCheckout()` in Clover (8.x): create the
 * Checkout Session on your server and redirect to its `url`. No Stripe instance
 * is needed, so this works with or without `<VueStripeProvider>`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStripeCheckout } from '@vue-stripe/vue-stripe'
 *
 * const { redirectToCheckout, loading, error } = useStripeCheckout()
 *
 * const checkout = async () => {
 *   const res = await fetch('/api/checkout-session', { method: 'POST' })
 *   const { url } = await res.json()
 *   await redirectToCheckout({ url })
 * }
 * </script>
 * ```
 */
export function useStripeCheckout(): UseStripeCheckoutReturn {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const redirectToUrl = (url: string): void => {
    loading.value = true
    error.value = null
    window.location.replace(url)
  }

  const redirectToCheckout = ({ url }: CheckoutRedirectOptions): Promise<void> => {
    if (!url) {
      error.value = 'useStripeCheckout: `url` is required (Checkout Session URL from your server)'
      return Promise.reject(new VueStripeCheckoutError(error.value))
    }
    redirectToUrl(url)
    return Promise.resolve()
  }

  return { redirectToCheckout, redirectToUrl, loading: readonly(loading), error: readonly(error) }
}
