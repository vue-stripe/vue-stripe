import { ref, readonly } from 'vue'

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
  url: string
  sessionId: string
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

export function useBackendApi() {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://backend.vuestripe.com'
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all available products from the backend
   */
  async function getProducts(): Promise<Product[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl}/api/products`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      const data = await response.json()
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
  async function createPaymentIntent(options: {
    amount?: number
    currency?: string
    priceId?: string
    description?: string
    metadata?: Record<string, string>
  } = {}): Promise<PaymentIntentResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl}/api/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create payment intent'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create an iDEAL payment intent (EUR only)
   */
  async function createIdealIntent(options: {
    amount?: number
    description?: string
    metadata?: Record<string, string>
  } = {}): Promise<PaymentIntentResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl}/api/ideal-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create iDEAL intent'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a checkout session for Stripe hosted checkout
   */
  async function createCheckoutSession(options: {
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
  } = {}): Promise<CheckoutSessionResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl}/api/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      return await response.json()
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
      const response = await fetch(`${apiUrl}/api/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      return await response.json()
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
  async function createSetupIntent(options: {
    customerId?: string
    description?: string
    metadata?: Record<string, string>
  } = {}): Promise<SetupIntentResult> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${apiUrl}/api/setup-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      return await response.json()
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
      currency: currency.toUpperCase(),
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
    createIdealIntent,
    createCheckoutSession,
    createSubscription,
    createSetupIntent,

    // Helpers
    formatPrice,
  }
}
