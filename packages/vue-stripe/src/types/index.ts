import type { Ref } from 'vue-demi'

// Import specific Stripe types we need
import type {
  Appearance,
  CssFontSource,
  CustomFontSource,
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
  StripeEmbeddedCheckoutOptions,
  StripeCheckoutFormSdk,
  StripeCheckoutFormSdkOptions,
  StripeCheckoutFormLoadActionsSuccess,
  PaymentIntentResult,
  SetupIntentResult,
  PaymentMethodResult,
  PaymentIntentOrSetupIntentResult,
  ConfirmationTokenResult,
  CreateConfirmationToken,
  PaymentRequest,
  PaymentRequestUpdateOptions,
  CanMakePaymentResult,
  PaymentRequestTokenEvent,
  PaymentRequestPaymentMethodEvent,
  PaymentRequestSourceEvent,
  PaymentRequestShippingAddressEvent,
  PaymentRequestShippingOptionEvent
} from '@stripe/stripe-js'

// Stripe.js types that appear in the public signatures of the components and composables
// (element options, element instances, event payloads, provider options). Apps import
// them from '@vue-stripe/vue-stripe' instead of '@stripe/stripe-js'; tests/public-exports
// fails if a type used in src/components or src/composables is not re-exported.
export type {
  Appearance,
  ConfirmSetupData,
  ConfirmationTokenResult,
  CreatePaymentMethodData,
  CreatePaymentMethodFromElements,
  CssFontSource,
  CustomFontSource,
  StripeAddressElementOptions,
  StripeAuBankAccountElement,
  StripeAuBankAccountElementChangeEvent,
  StripeAuBankAccountElementOptions,
  StripeCardCvcElementChangeEvent,
  StripeCardCvcElementOptions,
  StripeCardElementOptions,
  StripeCardExpiryElementChangeEvent,
  StripeCardExpiryElementOptions,
  StripeCardNumberElementChangeEvent,
  StripeCardNumberElementOptions,
  StripeConstructorOptions,
  StripeElementsOptionsClientSecret,
  StripeElementsOptionsMode,
  StripeElementsUpdateOptions,
  StripeError,
  StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
  StripeIbanElement,
  StripeIbanElementChangeEvent,
  StripeIbanElementOptions,
  StripeLinkAuthenticationElementOptions,
  StripePaymentElementAvailablePaymentMethodsChangeEvent,
  StripePaymentElementCardDetailsChangeEvent,
  StripePaymentElementOptions,
  StripePaymentElementSavedPaymentMethodRemoveEvent,
  StripePaymentElementSavedPaymentMethodUpdateEvent,
  StripePaymentMethodMessagingElement,
  StripePaymentMethodMessagingElementOptions
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
  // The Stripe.js release train this @stripe/stripe-js major loads ('endive' for v10)
  ReleaseTrain,
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
  StripeTaxIdElement,
  StripeTaxIdElementOptions,
  StripeCurrencySelectorElement,
  StripeContactDetailsElement,
  StripeContactDetailsElementOptions,
  StripeTermsElement,
  StripeTermsElementOptions,
  StripeLinkSignupElement,
  StripeLinkSignupElementOptions,
  StripeIssuingCardNumberDisplayElement,
  StripeIssuingCardNumberDisplayElementOptions,
  StripeIssuingCardCvcDisplayElement,
  StripeIssuingCardCvcDisplayElementOptions,
  StripeIssuingCardExpiryDisplayElement,
  StripeIssuingCardExpiryDisplayElementOptions,
  StripeIssuingCardPinDisplayElement,
  StripeIssuingCardPinDisplayElementOptions,
  StripeIssuingCardCopyButtonElement,
  StripeIssuingCardCopyButtonElementOptions,
  StripeIssuingAddToWalletButtonElement,
  StripeIssuingAddToWalletButtonElementOptions,
  // Event types
  StripeCardElementChangeEvent,
  StripePaymentElementChangeEvent,
  StripeAddressElementChangeEvent,
  StripeLinkAuthenticationElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementClickEvent,
  StripeTaxIdElementChangeEvent,
  StripeContactDetailsElementChangeEvent,
  // Elements with Checkout Sessions (Checkout Elements SDK) types
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutLoadActionsResult,
  StripeCheckoutSession,
  StripeCheckoutContact,
  StripeCheckoutLineItem,
  StripeCheckoutConfirmResult,
  // Embedded Checkout types
  StripeEmbeddedCheckout,
  StripeEmbeddedCheckoutOptions,
  StripeEmbeddedCheckoutAnalyticsEventUnion,
  StripeEmbeddedCheckoutLineItemsChangeEvent,
  // Financial Connections (pre-collected consent evidence, Stripe.js 9.17+)
  PreCollectedConsent,
  // Checkout Form SDK types (Stripe beta)
  StripeCheckoutFormSdk,
  StripeCheckoutFormSdkOptions,
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutFormLoadActionsResult,
  StripeCheckoutForm,
  StripeCheckoutFormOptions,
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormValue,
  // Payment Request API (stripe.paymentRequest())
  PaymentRequest,
  PaymentRequestOptions,
  PaymentRequestUpdateOptions,
  PaymentRequestItem,
  PaymentRequestShippingOption,
  PaymentRequestShippingAddress,
  PaymentRequestWallet,
  PaymentRequestCompleteStatus,
  PaymentRequestUpdateDetails,
  CanMakePaymentResult,
  PaymentRequestTokenEvent,
  PaymentRequestPaymentMethodEvent,
  PaymentRequestSourceEvent,
  PaymentRequestShippingAddressEvent,
  PaymentRequestShippingOptionEvent
} from '@stripe/stripe-js'

// Vue-specific plugin configuration
export interface VueStripeOptions {
  publishableKey: string
  stripeAccount?: string
  apiVersion?: string
  locale?: StripeConstructorOptions['locale']
  /** Stripe.js developer tooling, e.g. `{ assistant: { enabled: false } }`. */
  developerTools?: StripeConstructorOptions['developerTools']
  /** `false` loads Stripe.js without advanced fraud signals (Radar). Default `true`. */
  advancedFraudSignals?: boolean
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
  betas?: string[]
  developerTools?: StripeConstructorOptions['developerTools']
  advancedFraudSignals?: boolean
  options?: StripeConstructorOptions
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
  appearance?: Appearance | undefined
  /**
   * Custom fonts to load into the Elements iframe.
   */
  fonts?: Array<CssFontSource | CustomFontSource> | undefined
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

/** Props of `VueStripeEmbeddedCheckout` (`stripe.createEmbeddedCheckoutPage()`). */
export interface VueStripeEmbeddedCheckoutProps {
  /** Client secret of a Checkout Session created with `ui_mode: 'embedded_page'`. */
  clientSecret?: string | undefined
  /** Alternative to `clientSecret`: a function resolving to the client secret. */
  fetchClientSecret?: (() => Promise<string>) | undefined
  /**
   * Called when the customer changes line items; resolve `{ type: 'accept' }` or
   * `{ type: 'reject', errorMessage }`. Required when the session sets
   * `permissions.update.line_items: 'server_only'`.
   */
  onLineItemsChange?: StripeEmbeddedCheckoutOptions['onLineItemsChange'] | undefined
}

/** Props of `VueStripeCheckoutFormProvider` (Checkout Form, `ui_mode: 'form'`; Stripe beta). */
export interface VueStripeCheckoutFormProviderProps {
  /** Client secret of a Checkout Session created with `ui_mode: 'form'`, or a Promise resolving to it. */
  clientSecret?: string | Promise<string> | undefined
  /** Alternative to `clientSecret`: a function returning the client secret. */
  fetchClientSecret?: (() => Promise<string>) | undefined
  appearance?: StripeCheckoutFormSdkOptions['appearance'] | undefined
  loader?: StripeCheckoutFormSdkOptions['loader'] | undefined
  fonts?: StripeCheckoutFormSdkOptions['fonts'] | undefined
  savedPaymentMethod?: StripeCheckoutFormSdkOptions['savedPaymentMethod'] | undefined
  defaultValues?: StripeCheckoutFormSdkOptions['defaultValues'] | undefined
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
  /** Re-fetch Elements data after the Intent / Checkout Session changed on the server. */
  fetchUpdates: () => Promise<{ error?: { message: string; status?: string } }>
  /**
   * Looks up the element of a type created on this Elements group, typed through
   * Stripe's `StripeElements['getElement']` overloads. Returns `null` when there is
   * none, or before the group exists.
   */
  getElement: StripeElements['getElement']
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
  financialConnectionsSession?: undefined
  token?: undefined
  verificationSession?: undefined
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
  /** Elements created on the SDK, `null` when absent or before it initializes. */
  getPaymentElement: StripeCheckoutElementsSdk['getPaymentElement']
  getBillingAddressElement: StripeCheckoutElementsSdk['getBillingAddressElement']
  getShippingAddressElement: StripeCheckoutElementsSdk['getShippingAddressElement']
  getExpressCheckoutElement: StripeCheckoutElementsSdk['getExpressCheckoutElement']
  getCurrencySelectorElement: StripeCheckoutElementsSdk['getCurrencySelectorElement']
  getTaxIdElement: StripeCheckoutElementsSdk['getTaxIdElement']
  getTermsElement: StripeCheckoutElementsSdk['getTermsElement']
  getLinkSignupElement: StripeCheckoutElementsSdk['getLinkSignupElement']
}

/**
 * Return value of `useCheckoutForm()`. Action signatures come from Stripe's
 * `StripeCheckoutFormLoadActionsSuccess`: the Checkout Elements actions minus the
 * email / phone / address / tax ID updates, which the form collects itself.
 */
export interface UseCheckoutFormReturn {
  /** Checkout Form SDK handle (null until initialized). */
  checkout: Readonly<Ref<StripeCheckoutFormSdk | null>>
  /** Form SDK actions (null until `loadActions()` resolves). */
  actions: Readonly<Ref<StripeCheckoutFormLoadActionsSuccess | null>>
  /** Reactive session snapshot, updated on every Stripe `change` event. */
  session: Readonly<Ref<StripeCheckoutSession | null>>
  /** True until the actions have loaded. */
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  /** Imperative snapshot of the current session (prefer the reactive `session`). */
  getSession: () => StripeCheckoutSession | null
  /** Confirm; pass the form's `@confirm` event as `{ formConfirmEvent }`. */
  confirm: StripeCheckoutFormLoadActionsSuccess['confirm']
  applyPromotionCode: StripeCheckoutFormLoadActionsSuccess['applyPromotionCode']
  removePromotionCode: StripeCheckoutFormLoadActionsSuccess['removePromotionCode']
  updateLineItemQuantity: StripeCheckoutFormLoadActionsSuccess['updateLineItemQuantity']
  updateShippingOption: StripeCheckoutFormLoadActionsSuccess['updateShippingOption']
  runServerUpdate: StripeCheckoutFormLoadActionsSuccess['runServerUpdate']
  validateElements: StripeCheckoutFormLoadActionsSuccess['validateElements']
  addOptionalLineItem: StripeCheckoutFormLoadActionsSuccess['addOptionalLineItem']
  removeOptionalLineItem: StripeCheckoutFormLoadActionsSuccess['removeOptionalLineItem']
  changeAppearance: StripeCheckoutFormSdk['changeAppearance']
  loadFonts: StripeCheckoutFormSdk['loadFonts']
  /** Elements created on the SDK, `null` when absent or before it initializes. */
  getForm: StripeCheckoutFormSdk['getForm']
  getCurrencySelectorElement: StripeCheckoutFormSdk['getCurrencySelectorElement']
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

/** Options of `useCreateConfirmationToken().createConfirmationToken()`. */
export interface CreateConfirmationTokenOptions {
  /** Elements instance to read from; defaults to the one injected by `<VueStripeElements>`. */
  elements?: StripeElements
  /** ConfirmationToken parameters; values here override what Elements collected. */
  params?: CreateConfirmationToken['params']
  /** Skip the automatic `elements.submit()` before `createConfirmationToken`. Defaults to false. */
  skipSubmit?: boolean
}

export interface UseCreateConfirmationTokenReturn {
  createConfirmationToken: (
    options?: CreateConfirmationTokenOptions
  ) => Promise<ConfirmationTokenResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/**
 * Either the client secret of the PaymentIntent / SetupIntent requiring an action,
 * or the `hashedValue` of a shared payment token (agentic commerce, Stripe.js 9.4+).
 */
export type HandleNextActionOptions =
  | {
      /** Client secret of the PaymentIntent or SetupIntent requiring an action. */
      clientSecret: string
    }
  | {
      /** Hashed value of a shared payment token. */
      hashedValue: string
    }

export interface UseHandleNextActionReturn {
  handleNextAction: (options: HandleNextActionOptions) => Promise<HandleNextActionResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/** Options of `collectFinancialConnectionsAccounts`, taken from `stripe.collectFinancialConnectionsAccounts`. */
export type CollectFinancialConnectionsAccountsOptions = Parameters<
  Stripe['collectFinancialConnectionsAccounts']
>[0]
/** Options of `collectBankAccountForPayment`, taken from `stripe.collectBankAccountForPayment`. */
export type CollectBankAccountForPaymentOptions = Parameters<
  Stripe['collectBankAccountForPayment']
>[0]
/** Options of `collectBankAccountForSetup`, taken from `stripe.collectBankAccountForSetup`. */
export type CollectBankAccountForSetupOptions = Parameters<Stripe['collectBankAccountForSetup']>[0]
/** Options of `collectBankAccountToken`, taken from `stripe.collectBankAccountToken`. */
export type CollectBankAccountTokenOptions = Parameters<Stripe['collectBankAccountToken']>[0]

/** Result of `collectFinancialConnectionsAccounts`: `{ financialConnectionsSession }` or `{ error }`. */
export type CollectFinancialConnectionsAccountsResult =
  Awaited<ReturnType<Stripe['collectFinancialConnectionsAccounts']>> | VueStripeErrorResult
/** Result of `collectBankAccountForPayment`: `{ paymentIntent }` or `{ error }`. */
export type CollectBankAccountForPaymentResult =
  Awaited<ReturnType<Stripe['collectBankAccountForPayment']>> | VueStripeErrorResult
/** Result of `collectBankAccountForSetup`: `{ setupIntent }` or `{ error }`. */
export type CollectBankAccountForSetupResult =
  Awaited<ReturnType<Stripe['collectBankAccountForSetup']>> | VueStripeErrorResult
/**
 * Result of `collectBankAccountToken`: `{ financialConnectionsSession, token }` or `{ error }`.
 * Stripe's own `CollectBankAccountTokenResult`, widened with `VueStripeErrorResult`.
 */
export type CollectBankAccountTokenResult =
  Awaited<ReturnType<Stripe['collectBankAccountToken']>> | VueStripeErrorResult

export interface UseFinancialConnectionsReturn {
  /** Opens the Financial Connections modal for a Financial Connections Session client secret. */
  collectFinancialConnectionsAccounts: (
    options: CollectFinancialConnectionsAccountsOptions
  ) => Promise<CollectFinancialConnectionsAccountsResult>
  /** Collects a US bank account and attaches it to a PaymentIntent (ACH Direct Debit). */
  collectBankAccountForPayment: (
    options: CollectBankAccountForPaymentOptions
  ) => Promise<CollectBankAccountForPaymentResult>
  /** Collects a US bank account and attaches it to a SetupIntent (ACH Direct Debit). */
  collectBankAccountForSetup: (
    options: CollectBankAccountForSetupOptions
  ) => Promise<CollectBankAccountForSetupResult>
  /** Opens the Financial Connections modal and returns a bank account token. */
  collectBankAccountToken: (
    options: CollectBankAccountTokenOptions
  ) => Promise<CollectBankAccountTokenResult>
  /** True while a Financial Connections modal call is in progress. */
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/** Result of `verifyIdentity`: `{ verificationSession }` or `{ error }`. */
export type VerifyIdentityResult =
  Awaited<ReturnType<Stripe['verifyIdentity']>> | VueStripeErrorResult

export interface UseIdentityReturn {
  /** Opens the Stripe Identity modal for a VerificationSession client secret. */
  verifyIdentity: (clientSecret: string) => Promise<VerifyIdentityResult>
  /** True while the Identity modal is open. */
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/** Payload of each `PaymentRequest` event (`cancel` has none). */
export interface PaymentRequestEventMap {
  token: PaymentRequestTokenEvent
  paymentmethod: PaymentRequestPaymentMethodEvent
  source: PaymentRequestSourceEvent
  cancel: undefined
  shippingaddresschange: PaymentRequestShippingAddressEvent
  shippingoptionchange: PaymentRequestShippingOptionEvent
}

/** An event `stripe.paymentRequest()` objects emit. */
export type PaymentRequestEventType = keyof PaymentRequestEventMap

/** Handler for a `PaymentRequest` event. */
export type PaymentRequestEventHandler<K extends PaymentRequestEventType> = (
  event: PaymentRequestEventMap[K]
) => unknown

export interface UsePaymentRequestReturn {
  /** The `PaymentRequest` from `stripe.paymentRequest(options)`, or `null` until Stripe.js loads. */
  paymentRequest: Readonly<Ref<PaymentRequest | null>>
  /** Result of `canMakePayment()`: the available wallets, or `null` while checking or when none is. */
  canMakePayment: Readonly<Ref<CanMakePaymentResult | null>>
  /** Opens the browser's payment interface. Call it from a click handler. */
  show: () => void
  /** Updates the request (total, items, shipping options). Not allowed while the interface shows. */
  update: (options: PaymentRequestUpdateOptions) => void
  /** Closes the browser's payment interface. */
  abort: () => void
  /** True while the browser's payment interface is showing. */
  isShowing: () => boolean
  /**
   * Listens for a `PaymentRequest` event. Handlers registered before Stripe.js loads are
   * attached once the request exists, and all are detached when the calling scope is disposed.
   * Returns a function that removes the handler.
   */
  on: <K extends PaymentRequestEventType>(
    event: K,
    handler: PaymentRequestEventHandler<K>
  ) => () => void
  /** Like `on`, but removes the handler after its first event. Returns a function that removes it. */
  once: <K extends PaymentRequestEventType>(
    event: K,
    handler: PaymentRequestEventHandler<K>
  ) => () => void
  /** Removes a handler registered with `on`, or all of them for `event` when `handler` is omitted. */
  off: <K extends PaymentRequestEventType>(
    event: K,
    handler?: PaymentRequestEventHandler<K>
  ) => void
  /** True while `canMakePayment()` is pending. */
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
