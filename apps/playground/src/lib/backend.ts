// Test-data backend (apps/backend). Point it at a local copy with VITE_API_URL,
// e.g. VITE_API_URL=http://localhost:3002 pnpm playground:dev
export const apiUrl = import.meta.env.VITE_API_URL || 'https://backend.vuestripe.com'

export interface CheckoutSessionRequest {
  amount?: number
  currency?: string
  productName?: string
  mode?: 'payment' | 'subscription' | 'setup'
  /** `hosted` (default) returns `url`; the other modes return `clientSecret`. */
  uiMode?: 'hosted' | 'elements' | 'embedded_page' | 'form'
  successUrl?: string
  cancelUrl?: string
  returnUrl?: string
  taxIdCollection?: boolean
}

export interface CheckoutSessionResult {
  url: string | null
  sessionId: string
  clientSecret: string | null
}

/** `POST /api/checkout-session` on the test-data backend. */
export async function createCheckoutSession(
  body: CheckoutSessionRequest
): Promise<CheckoutSessionResult> {
  const response = await fetch(`${apiUrl}/api/checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = (await response.json()) as CheckoutSessionResult & { error?: string }
  if (!response.ok) throw new Error(data.error || `Backend returned ${response.status}`)
  return data
}

export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

/** `POST /api/payment-intent` on the test-data backend (automatic payment methods). */
export async function createPaymentIntent(body: {
  amount?: number
  currency?: string
}): Promise<PaymentIntentResult> {
  const response = await fetch(`${apiUrl}/api/payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = (await response.json()) as PaymentIntentResult & { error?: string }
  if (!response.ok) throw new Error(data.error || `Backend returned ${response.status}`)
  return data
}
