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
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession,
  StripeCheckoutElementsOptions,
  PaymentIntentResult,
  SetupIntentResult,
  PaymentMethodResult,
  PaymentIntentOrSetupIntentResult
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
  StripeExpressCheckoutElementClickEvent,
  // Elements with Checkout Sessions (Checkout Elements SDK) types
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutLoadActionsResult,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult
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
   * Client secret of a Checkout Session created with `ui_mode: 'elements'`,
   * or a Promise resolving to it.
   */
  clientSecret?: string | Promise<string> | undefined
  /** Alternative to `clientSecret`: a function returning the client secret (v5 compatible). */
  fetchClientSecret?: (() => Promise<string>) | undefined
  /** Appearance, fonts, loader, saved payment methods and address sync for the Checkout elements. */
  elementsOptions?: StripeCheckoutElementsOptions | undefined
  adaptivePricing?: StripeCheckoutElementsSdkOptions['adaptivePricing'] | undefined
  defaultValues?: StripeCheckoutElementsSdkOptions['defaultValues'] | undefined
}

/** Props of `VueStripeCheckoutElementsProvider` (same as the deprecated `VueStripeCheckoutProvider`). */
export type VueStripeCheckoutElementsProviderProps = VueStripeCheckoutProviderProps

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

/**
 * Returned by the composables without a Stripe result: when Stripe.js has not
 * loaded yet, or when the Stripe call threw. It has the same `{ error }` shape as
 * Stripe's own error results, so callers can handle both the same way.
 */
export interface VueStripeErrorResult {
  error: { message: string }
  paymentIntent?: undefined
  setupIntent?: undefined
  paymentMethod?: undefined
}

/** Result of `confirmPayment` (with `redirect: 'always'` a success navigates away). */
export type ConfirmPaymentResult = PaymentIntentResult | VueStripeErrorResult
/** Result of `confirmSetup` (with `redirect: 'always'` a success navigates away). */
export type ConfirmSetupResult = SetupIntentResult | VueStripeErrorResult
export type CreatePaymentMethodResult = PaymentMethodResult | VueStripeErrorResult
export type HandleNextActionResult = PaymentIntentOrSetupIntentResult | VueStripeErrorResult

export interface ConfirmPaymentOptions {
  clientSecret: string
  confirmParams?: ConfirmPaymentData
  redirect?: 'if_required' | 'always'
  elements?: StripeElements
  /** Skip elements.submit() validation (not recommended, defaults to false) */
  skipSubmit?: boolean
}

export interface UsePaymentIntentReturn {
  confirmPayment: (options: ConfirmPaymentOptions) => Promise<ConfirmPaymentResult>
  /** Retrieve a PaymentIntent's current status from its client secret. */
  retrievePaymentIntent: (clientSecret: string) => Promise<ConfirmPaymentResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface UseSetupIntentReturn {
  confirmSetup: (options: ConfirmSetupOptions) => Promise<ConfirmSetupResult>
  /** Retrieve a SetupIntent's current status from its client secret. */
  retrieveSetupIntent: (clientSecret: string) => Promise<ConfirmSetupResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/**
 * Return value of `useCheckoutSession()`. Action signatures are taken directly
 * from Stripe's `StripeCheckoutLoadActionsSuccess` so they stay in sync with `@stripe/stripe-js`.
 */
export interface UseCheckoutSessionReturn {
  /** Checkout Elements SDK handle (null until initialized). */
  checkout: Readonly<Ref<StripeCheckoutElementsSdk | null>>
  /** Session actions (null until `loadActions()` resolves). */
  actions: Readonly<Ref<StripeCheckoutLoadActionsSuccess | null>>
  /** Reactive session snapshot, updated on every Stripe `change` event. */
  session: Readonly<Ref<StripeCheckoutSession | null>>
  /** True until the session actions have loaded. */
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  /** Imperative snapshot of the current session (prefer the reactive `session`). */
  getSession: () => StripeCheckoutSession | null
  confirm: StripeCheckoutLoadActionsSuccess['confirm']
  applyPromotionCode: StripeCheckoutLoadActionsSuccess['applyPromotionCode']
  removePromotionCode: StripeCheckoutLoadActionsSuccess['removePromotionCode']
  updateEmail: StripeCheckoutLoadActionsSuccess['updateEmail']
  updatePhoneNumber: StripeCheckoutLoadActionsSuccess['updatePhoneNumber']
  updateBillingAddress: StripeCheckoutLoadActionsSuccess['updateBillingAddress']
  updateShippingAddress: StripeCheckoutLoadActionsSuccess['updateShippingAddress']
  updateLineItemQuantity: StripeCheckoutLoadActionsSuccess['updateLineItemQuantity']
  updateShippingOption: StripeCheckoutLoadActionsSuccess['updateShippingOption']
  updateTaxIdInfo: StripeCheckoutLoadActionsSuccess['updateTaxIdInfo']
  runServerUpdate: StripeCheckoutLoadActionsSuccess['runServerUpdate']
  validateElements: StripeCheckoutLoadActionsSuccess['validateElements']
  addOptionalLineItem: StripeCheckoutLoadActionsSuccess['addOptionalLineItem']
  removeOptionalLineItem: StripeCheckoutLoadActionsSuccess['removeOptionalLineItem']
  changeAppearance: StripeCheckoutElementsSdk['changeAppearance']
  loadFonts: StripeCheckoutElementsSdk['loadFonts']
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
  createPaymentMethod: (options?: CreatePaymentMethodOptions) => Promise<CreatePaymentMethodResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export interface HandleNextActionOptions {
  /** Client secret of the PaymentIntent or SetupIntent requiring an action. */
  clientSecret: string
}

export interface UseHandleNextActionReturn {
  handleNextAction: (options: HandleNextActionOptions) => Promise<HandleNextActionResult>
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
export type ExpressCheckoutType = 'apple_pay' | 'google_pay' | 'paypal' | 'amazon_pay' | 'link'

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
