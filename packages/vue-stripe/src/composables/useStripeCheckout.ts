import { ref, readonly, type Ref } from 'vue-demi'
import { useStripe } from './useStripe'
import { VueStripeProviderError } from '../utils/errors'

/**
 * Options for URL-based checkout redirect (v8.x compatible)
 */
export interface CheckoutRedirectOptions {
  /** The checkout session URL from your server */
  url: string
}

/**
 * Options for legacy redirectToCheckout (v7.x only)
 * @deprecated Use CheckoutRedirectOptions with URL redirect instead
 */
export interface LegacyCheckoutOptions {
  /** Checkout Session ID */
  sessionId?: string
  /** Line items for client-side session creation */
  lineItems?: Array<{ price: string; quantity: number }>
  /** Checkout mode */
  mode?: 'payment' | 'subscription' | 'setup'
  /** Success redirect URL */
  successUrl?: string
  /** Cancel redirect URL */
  cancelUrl?: string
}

export interface UseStripeCheckoutReturn {
  /**
   * Redirect to Stripe Checkout using session URL (v8.x compatible, recommended)
   */
  redirectToCheckout: (options: CheckoutRedirectOptions | LegacyCheckoutOptions) => Promise<void>
  /**
   * Redirect to checkout using session URL (v8.x compatible)
   */
  redirectToUrl: (url: string) => void
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/**
 * Composable for handling Stripe Checkout redirects.
 *
 * Supports both @stripe/stripe-js v7.x (redirectToCheckout) and v8.x (URL redirect).
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStripeCheckout } from '@vue-stripe/vue-stripe'
 *
 * const { redirectToCheckout, redirectToUrl, loading, error } = useStripeCheckout()
 *
 * // v8.x compatible (recommended)
 * const handleCheckout = async () => {
 *   const response = await fetch('/api/create-checkout-session', {
 *     method: 'POST',
 *     body: JSON.stringify({ priceId: 'price_xxx' })
 *   })
 *   const { url } = await response.json()
 *   redirectToUrl(url)
 * }
 *
 * // Or using redirectToCheckout with URL
 * const handleCheckoutAlt = async () => {
 *   const response = await fetch('/api/create-checkout-session')
 *   const { url } = await response.json()
 *   await redirectToCheckout({ url })
 * }
 * </script>
 * ```
 */
export function useStripeCheckout(): UseStripeCheckoutReturn {
  const { stripe } = useStripe()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if redirectToCheckout is available (stripe-js v7.x)
   */
  const hasRedirectToCheckout = (): boolean => {
    return stripe.value !== null &&
      typeof (stripe.value as any).redirectToCheckout === 'function'
  }

  /**
   * Redirect to checkout using URL (v8.x compatible)
   */
  const redirectToUrl = (url: string): void => {
    loading.value = true
    error.value = null
    window.location.replace(url)
  }

  /**
   * Redirect to Stripe Checkout
   * Supports both URL-based (v8.x) and session-based (v7.x) checkout
   */
  const redirectToCheckout = async (
    options: CheckoutRedirectOptions | LegacyCheckoutOptions
  ): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // v8.x compatible: URL-based redirect
      if ('url' in options && options.url) {
        window.location.replace(options.url)
        return
      }

      // v7.x: Legacy redirectToCheckout
      const legacyOptions = options as LegacyCheckoutOptions

      if (!hasRedirectToCheckout()) {
        throw new VueStripeProviderError(
          'redirectToCheckout is not available. This method was removed in @stripe/stripe-js v8.x. ' +
          'Create a Checkout Session on your server and use redirectToUrl() or pass { url } instead.'
        )
      }

      if (!stripe.value) {
        throw new VueStripeProviderError('Stripe not initialized')
      }

      console.warn(
        '[Vue Stripe] Legacy redirectToCheckout is deprecated in @stripe/stripe-js v8.x. ' +
        'Use redirectToUrl() with a session URL from your server instead.'
      )

      const result = await (stripe.value as any).redirectToCheckout(legacyOptions)

      if (result.error) {
        const errorMessage = result.error.message || 'Checkout redirect failed'
        error.value = errorMessage
        throw new VueStripeProviderError(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout redirect failed'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    redirectToCheckout,
    redirectToUrl,
    loading: readonly(loading),
    error: readonly(error)
  }
}
