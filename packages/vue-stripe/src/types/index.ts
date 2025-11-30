import type { Ref } from 'vue-demi'

// Re-export Stripe types with enhancements
export * from '@stripe/stripe-js'

// Import specific Stripe types we'll extend
import type {
  Stripe,
  StripeElements,
  StripeElementsOptions,
  StripeElement,
  StripeElementChangeEvent,
  ConfirmPaymentData,
  StripeConstructorOptions
} from '@stripe/stripe-js'

// Vue-specific plugin configuration
export interface VueStripeOptions {
  publishableKey: string
  stripeAccount?: string
  apiVersion?: string
  locale?: StripeConstructorOptions['locale']
}

// Vue-specific element interface
export interface VueStripeElement {
  stripe: Stripe | null
  element: StripeElement | null
  loading: boolean
  error: string | null
}

// Component props interfaces
export interface StripeProviderProps {
  publishableKey: string
  stripeAccount?: string
  apiVersion?: string
  locale?: string
}

export interface StripeElementsProps {
  clientSecret?: string
  options?: StripeElementsOptions
}

// Event interfaces for Vue components
export interface StripeElementEvents {
  ready: (element: StripeElement) => void
  change: (event: StripeElementChangeEvent) => void
}

// Composable return types
export interface UseStripeReturn {
  stripe: Readonly<Ref<Stripe | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  initialize: () => Promise<void>
}

export interface UseStripeElementsReturn {
  elements: Readonly<Ref<StripeElements | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface ConfirmPaymentOptions {
  clientSecret: string
  confirmParams?: ConfirmPaymentData
  redirect?: 'if_required' | 'always'
  elements?: StripeElements
}

export interface UsePaymentIntentReturn {
  confirmPayment: (options: ConfirmPaymentOptions) => Promise<any>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface UseSetupIntentReturn {
  confirmSetup: (options: ConfirmSetupOptions) => Promise<any>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface ConfirmSetupOptions {
  clientSecret: string
  confirmParams?: {
    return_url?: string
    payment_method_data?: {
      billing_details?: {
        name?: string
        email?: string
        phone?: string
        address?: {
          line1?: string
          line2?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
        }
      }
    }
  }
  redirect?: 'if_required' | 'always'
  elements?: StripeElements
}

// Payment method types for modern elements
export type PaymentElementType = 
  | 'card'
  | 'ideal'
  | 'sepa_debit'
  | 'sofort'
  | 'bancontact'
  | 'giropay'
  | 'eps'
  | 'p24'
  | 'alipay'
  | 'wechat_pay'
  | 'afterpay_clearpay'
  | 'klarna'
  | 'affirm'
  | 'zip'

// Express checkout payment methods
export type ExpressCheckoutType =
  | 'apple_pay'
  | 'google_pay'
  | 'paypal'
  | 'amazon_pay'
  | 'link'

// Error types
export interface StripeError {
  type: string
  code?: string
  message: string
  decline_code?: string
  param?: string
}

// Context types for providers
export interface StripeContext {
  stripe: Ref<Stripe | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export interface StripeElementsContext {
  elements: Ref<StripeElements | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}