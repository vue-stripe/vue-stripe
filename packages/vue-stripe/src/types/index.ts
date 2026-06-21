import type { Ref } from 'vue-demi'

// Import specific Stripe types we need
import type {
  Stripe,
  StripeElements,
  StripeElementsOptions,
  StripeElement,
  StripeElementChangeEvent,
  ConfirmPaymentData,
  StripeConstructorOptions,
  StripeCheckout,
  StripeCheckoutSession,
  StripeCheckoutElementsOptions
} from '@stripe/stripe-js'
import type { StripeCheckoutActions } from '../utils/injection-keys'

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
  StripeExpressCheckoutElementClickEvent,
  // Custom Checkout types
  StripeCheckout,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult,
  // Custom Checkout element types (stripe-js 8.x)
  StripeCurrencySelectorElement,
  StripeTaxIdElement,
  StripeTaxIdElementOptions,
  StripeTaxIdElementChangeEvent
} from '@stripe/stripe-js'

// Session action methods returned by `checkout.loadActions()` (stripe-js 8.x).
export type { StripeCheckoutActions } from '../utils/injection-keys'

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
  /**
   * Opt into prerelease Stripe.js features (forwarded to `loadStripe`). Required
   * by some elements — e.g. the Tax ID element needs `['custom_checkout_tax_id_1']`.
   */
  betas?: string[]
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
   * Appearance API options to theme the Elements.
   * @see https://docs.stripe.com/elements/appearance-api
   */
  appearance?: Record<string, unknown> | undefined
  /**
   * Custom fonts to load into the Elements iframe.
   */
  fonts?: Array<Record<string, unknown>> | undefined
  /**
   * Locale to display the Elements in (e.g. 'en', 'fr', 'auto').
   */
  locale?: string | undefined
  /**
   * Additional options passed to stripe.elements().
   */
  options?: StripeElementsOptions | undefined
}

/**
 * Props for VueStripeCheckoutProvider (Custom Checkout, `ui_mode: 'custom'`).
 */
export interface VueStripeCheckoutProviderProps {
  /**
   * Client secret of a Checkout Session created with `ui_mode: 'custom'`.
   * Provide this OR `fetchClientSecret`.
   */
  clientSecret?: string | undefined
  /**
   * Async function that resolves to the Checkout Session client secret.
   * Takes precedence over `clientSecret`.
   */
  fetchClientSecret?: (() => Promise<string>) | undefined
  /**
   * Appearance / fonts options forwarded to the Checkout Elements.
   */
  elementsOptions?: StripeCheckoutElementsOptions | undefined
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
  /** Retrieve a PaymentIntent's current status from its client secret. */
  retrievePaymentIntent: (clientSecret: string) => Promise<any>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface UseSetupIntentReturn {
  confirmSetup: (options: ConfirmSetupOptions) => Promise<any>
  /** Retrieve a SetupIntent's current status from its client secret. */
  retrieveSetupIntent: (clientSecret: string) => Promise<any>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/**
 * Return value of `useCheckoutSession()`. The session action methods are taken
 * from the object returned by `checkout.loadActions()` (stripe-js 8.x), while
 * `changeAppearance` remains on the `StripeCheckout` instance — both stay in
 * sync with `@stripe/stripe-js`.
 */
export interface UseCheckoutSessionReturn {
  /** The underlying StripeCheckout instance (null until initialized). */
  checkout: Readonly<Ref<StripeCheckout | null>>
  /** Reactive session snapshot, updated on every Stripe `change` event. */
  session: Readonly<Ref<StripeCheckoutSession | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  /** Imperative snapshot of the current session (prefer the reactive `session`). */
  getSession: () => StripeCheckoutSession | null
  confirm: StripeCheckoutActions['confirm']
  applyPromotionCode: StripeCheckoutActions['applyPromotionCode']
  removePromotionCode: StripeCheckoutActions['removePromotionCode']
  updateEmail: StripeCheckoutActions['updateEmail']
  updatePhoneNumber: StripeCheckoutActions['updatePhoneNumber']
  updateBillingAddress: StripeCheckoutActions['updateBillingAddress']
  updateShippingAddress: StripeCheckoutActions['updateShippingAddress']
  updateLineItemQuantity: StripeCheckoutActions['updateLineItemQuantity']
  updateShippingOption: StripeCheckoutActions['updateShippingOption']
  updateTaxIdInfo: StripeCheckoutActions['updateTaxIdInfo']
  runServerUpdate: StripeCheckoutActions['runServerUpdate']
  changeAppearance: StripeCheckout['changeAppearance']
}

/**
 * Options for creating a PaymentMethod. Mirrors Stripe's `createPaymentMethod`
 * params: either `{ elements }` (Payment Element flow) or
 * `{ type, card, billing_details, ... }` (manual flow). When neither `elements`
 * nor `type` is provided, the injected Elements instance is used automatically.
 */
export type CreatePaymentMethodOptions = Record<string, unknown> & {
  elements?: StripeElements
  type?: string
  /**
   * Skip the automatic `elements.submit()` call before createPaymentMethod
   * (only relevant to the Payment Element flow). Defaults to false.
   */
  skipSubmit?: boolean
}

export interface UseCreatePaymentMethodReturn {
  createPaymentMethod: (options?: CreatePaymentMethodOptions) => Promise<any>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface HandleNextActionOptions {
  /** Client secret of the PaymentIntent or SetupIntent requiring an action. */
  clientSecret: string
}

export interface UseHandleNextActionReturn {
  handleNextAction: (options: HandleNextActionOptions) => Promise<any>
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
