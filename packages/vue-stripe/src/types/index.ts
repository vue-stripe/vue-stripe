import type { Ref } from 'vue-demi'

// Import specific Stripe types we need
import type {
  Stripe,
  StripeElements,
  StripeElementsOptions,
  StripeElement,
  StripeElementChangeEvent,
  ConfirmPaymentData,
  StripeConstructorOptions
} from '@stripe/stripe-js'

// Re-export commonly used Stripe.js types with their original names
// Since our Vue components now use VueStripe* prefix, there's no conflict
export type {
  Stripe,
  StripeElements,
  StripeElement,
  StripeElementType,
  StripeElementsOptions,
  StripeElementChangeEvent,
  PaymentIntent,
  SetupIntent,
  ConfirmPaymentData,
  ConfirmCardSetupData,
  // Stripe element types
  StripeCardElement,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement,
  StripePaymentElement,
  StripeAddressElement,
  StripeLinkAuthenticationElement,
  StripeExpressCheckoutElement,
  // Event types
  StripeCardElementChangeEvent,
  StripePaymentElementChangeEvent,
  StripeAddressElementChangeEvent,
  StripeLinkAuthenticationElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementClickEvent
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
export interface VueStripeProviderProps {
  publishableKey: string
  stripeAccount?: string
  apiVersion?: string
  locale?: string
}

/**
 * Mode for Payment Element - determines the type of intent
 */
export type ElementsMode = 'payment' | 'setup' | 'subscription'

/**
 * Indicates intent to save payment method for future use
 */
export type SetupFutureUsage = 'off_session' | 'on_session'

/**
 * Controls when to capture funds from customer's account
 */
export type CaptureMethod = 'automatic' | 'automatic_async' | 'manual'

export interface VueStripeElementsProps {
  /**
   * Client secret from PaymentIntent or SetupIntent.
   * When provided, Elements will use the intent-based flow.
   */
  clientSecret?: string | undefined
  /**
   * Mode for deferred intent creation (without clientSecret).
   * Required when clientSecret is not provided.
   */
  mode?: ElementsMode | undefined
  /**
   * Currency code (e.g., 'usd', 'eur') for deferred intent creation.
   * Required when using mode without clientSecret.
   */
  currency?: string | undefined
  /**
   * Amount in smallest currency unit (e.g., cents for USD).
   * Required for 'payment' and 'subscription' modes.
   */
  amount?: number | undefined
  /**
   * Indicates intent to save payment method for future use.
   * When set, displays additional input fields and mandates as needed.
   */
  setupFutureUsage?: SetupFutureUsage | undefined
  /**
   * Controls when to capture funds from customer's account.
   */
  captureMethod?: CaptureMethod | undefined
  /**
   * List of payment method types to display.
   * Omit to use Dashboard payment method settings.
   */
  paymentMethodTypes?: string[] | undefined
  /**
   * Additional options passed to stripe.elements().
   */
  options?: StripeElementsOptions | undefined
}

/**
 * Props for VueStripePricingTable component.
 * Used to embed a Stripe pricing table for subscription products.
 */
export interface VueStripePricingTableProps {
  /**
   * The ID of the pricing table to display.
   * Found in Stripe Dashboard under Product Catalog > Pricing tables.
   */
  pricingTableId: string
  /**
   * Pre-fill the customer's email address in checkout.
   * Useful when you already know the customer's email.
   */
  customerEmail?: string
  /**
   * Client secret from a Customer Session API response.
   * Use this to allow existing customers to access their saved payment methods.
   */
  customerSessionClientSecret?: string
  /**
   * A reference ID for the checkout session.
   * Useful for reconciling checkout sessions with your internal systems.
   */
  clientReferenceId?: string
}

// Event interfaces for Vue components
export interface VueStripeElementEvents {
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

/**
 * Result of elements.submit() call
 * Matches the return type from Stripe's elements.submit()
 */
export type ElementsSubmitResult =
  | { error?: undefined; selectedPaymentMethod?: string }
  | { error: { type?: string; code?: string; message?: string } }

export interface UseStripeElementsReturn {
  elements: Readonly<Ref<StripeElements | null>>
  /**
   * Triggers form validation and collects data required for wallets (Apple Pay, Google Pay).
   * This should be called before confirmPayment/confirmSetup.
   * Note: usePaymentIntent and useSetupIntent call this automatically unless skipSubmit is true.
   */
  submit: () => Promise<ElementsSubmitResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface ConfirmPaymentOptions {
  clientSecret: string
  confirmParams?: ConfirmPaymentData
  redirect?: 'if_required' | 'always'
  elements?: StripeElements
  /** Skip elements.submit() validation (not recommended, defaults to false) */
  skipSubmit?: boolean
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
  /** Skip elements.submit() validation (not recommended, defaults to false) */
  skipSubmit?: boolean
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
export interface VueStripeError {
  type: string
  code?: string
  message: string
  decline_code?: string
  param?: string
}

// Context types for providers
export interface VueStripeContext {
  stripe: Ref<Stripe | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export interface VueStripeElementsContext {
  elements: Ref<StripeElements | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}
