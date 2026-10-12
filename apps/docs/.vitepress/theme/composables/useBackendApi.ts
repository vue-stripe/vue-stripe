import { ref, readonly } from 'vue'
import { useStripeConfig } from './useStripeConfig'

// Types
export interface ProductPrice {
  id: string
  amount: number | null
  currency: string
  interval: string | null
  intervalCount: number | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  images: string[]
  type: 'one_time' | 'recurring'
  price: ProductPrice
  metadata: Record<string, string>
}

export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export interface CheckoutSessionResult {
  /** Stripe-hosted page URL (`uiMode: 'hosted'`), otherwise null. */
  url: string | null
  sessionId: string
  /** Client secret for `elements`, `embedded_page` and `form` sessions, otherwise null. */
  clientSecret: string | null
}

export interface SubscriptionResult {
  subscriptionId: string
  clientSecret: string | null
  status: string
  customerId: string
}

export interface SetupIntentResult {
  clientSecret: string
  setupIntentId: string
}

/** Error body returned by the backend on non-2xx responses. */
interface ApiErrorResponse {
  error?: string
}

interface ProductsResponse {
  products?: Product[]
}

/** Parse a JSON response body as the expected backend response shape. */
async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

/** Throw an Error carrying the backend's error message (or the HTTP status). */
async function throwApiError(response: Response): Promise<never> {
  const data = await parseJson<ApiErrorResponse>(response).catch((): ApiErrorResponse => ({}))
  throw new Error(data.error || `API Error: ${response.status}`)
}

export function useBackendApi() {
  const { apiUrl } = useStripeConfig()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all available products from the backend
   */
  async function getProducts(): Promise<Product[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl.value}/api/products`)

      if (!response.ok) {
        await throwApiError(response)
      }

      const data = await parseJson<ProductsResponse>(response)
      return data.products || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch products'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a payment intent for a one-time payment
   */
  async function createPaymentIntent(
    options: {
      /** Amount in cents; null/omitted uses the backend default. */
      amount?: number | null
      currency?: string
      priceId?: string
      description?: string
      metadata?: Record<string, string>
    } = {}
  ): Promise<PaymentIntentResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl.value}/api/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        await throwApiError(response)
      }

      return await parseJson<PaymentIntentResult>(response)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create payment intent'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a regional PaymentIntent (SEPA Direct Debit / BECS).
   * Both backend routes share the same request/response shape.
   */
  async function createRegionalIntent(
    path: 'sepa-debit-intent' | 'becs-intent',
    options: {
      amount?: number
      currency?: string
      description?: string
      metadata?: Record<string, string>
    } = {}
  ): Promise<PaymentIntentResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl.value}/api/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        await throwApiError(response)
      }

      return await parseJson<PaymentIntentResult>(response)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to create ${path}`
      throw err
    } finally {
      loading.value = false
    }
  }

  const createSepaIntent = (options: { amount?: number; metadata?: Record<string, string> } = {}) =>
    createRegionalIntent('sepa-debit-intent', options)
  // BECS Direct Debit (AUD only - Australia)
  const createBecsIntent = (
    options: { amount?: number; description?: string; metadata?: Record<string, string> } = {}
  ) => createRegionalIntent('becs-intent', options)

  /**
   * Create a checkout session for Stripe hosted checkout
   */
  async function createCheckoutSession(
    options: {
      amount?: number
      currency?: string
      priceId?: string
      productName?: string
      productDescription?: string
      quantity?: number
      mode?: 'payment' | 'subscription' | 'setup'
      successUrl?: string
      cancelUrl?: string
      customerEmail?: string
      metadata?: Record<string, string>
      /** `hosted` (default) returns `url`; the other modes return `clientSecret`. */
      uiMode?: 'hosted' | 'elements' | 'embedded_page' | 'form'
      /** Where Stripe sends the customer after a non-hosted session completes. */
      returnUrl?: string
      taxIdCollection?: boolean
    } = {}
  ): Promise<CheckoutSessionResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl.value}/api/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        await throwApiError(response)
      }

      return await parseJson<CheckoutSessionResult>(response)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create checkout session'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a subscription
   */
  async function createSubscription(options: {
    priceId: string
    customerEmail: string
    paymentMethodId?: string
    name?: string
    metadata?: Record<string, string>
  }): Promise<SubscriptionResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl.value}/api/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        await throwApiError(response)
      }

      return await parseJson<SubscriptionResult>(response)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create subscription'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async function createSetupIntent(
    options: {
      customerId?: string
      description?: string
      metadata?: Record<string, string>
    } = {}
  ): Promise<SetupIntentResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl.value}/api/setup-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        await throwApiError(response)
      }

      return await parseJson<SetupIntentResult>(response)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create setup intent'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Format price for display
   */
  function formatPrice(amount: number | null, currency: string): string {
    if (amount === null) return 'Price not available'

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    apiUrl,

    // Methods
    getProducts,
    createPaymentIntent,
    createSepaIntent,
    createBecsIntent,
    createCheckoutSession,
    createSubscription,
    createSetupIntent,

    // Helpers
    formatPrice
  }
}
