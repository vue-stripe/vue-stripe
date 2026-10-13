import { beforeEach, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { isVue2 } from 'vue-demi'
import { STRIPE_CONFIRMERS } from './stripe-confirmers'
import { clearStripeInstances } from '../src/utils/load-stripe'

// ---------------------------------------------------------------------------
// Canonical, typed Stripe.js mock factories (single source of truth).
//
// The element stub always exposes the FULL Stripe element method set so that
// cleanup/event assertions (.on / .off / .destroy / .unmount / .update) are
// possible in every test. Tests should import these factories and override
// per-case via `mockLoadStripe.mockResolvedValueOnce(makeMockStripe())`.
// ---------------------------------------------------------------------------

type MockFn = ReturnType<typeof vi.fn>

export interface MockStripeElement {
  mount: MockFn
  unmount: MockFn
  destroy: MockFn
  on: MockFn
  off: MockFn
  update: MockFn
  focus: MockFn
  blur: MockFn
  clear: MockFn
  getValue: MockFn
}

export interface MockStripeElements {
  create: MockFn
  submit: MockFn
  getElement: MockFn
  update: MockFn
  fetchUpdates: MockFn
  /** The Elements group only declares `on('update-end')` in Stripe.js 10.0.0 (no `off`). */
  on: MockFn
}

export interface MockStripeCheckoutActions {
  getSession: MockFn
  confirm: MockFn
  applyPromotionCode: MockFn
  removePromotionCode: MockFn
  updateEmail: MockFn
  updatePhoneNumber: MockFn
  updateBillingAddress: MockFn
  updateShippingAddress: MockFn
  updateLineItemQuantity: MockFn
  updateShippingOption: MockFn
  updateTaxIdInfo: MockFn
  runServerUpdate: MockFn
  validateElements: MockFn
  addOptionalLineItem: MockFn
  removeOptionalLineItem: MockFn
}

// Stripe.js 10 Checkout Elements SDK handle (`stripe.initCheckoutElementsSdk()`).
export interface MockStripeCheckout {
  on: MockFn
  loadActions: MockFn
  changeAppearance: MockFn
  loadFonts: MockFn
  createPaymentElement: MockFn
  createBillingAddressElement: MockFn
  createShippingAddressElement: MockFn
  createExpressCheckoutElement: MockFn
  createCurrencySelectorElement: MockFn
  createTaxIdElement: MockFn
  createContactDetailsElement: MockFn
  createTermsElement: MockFn
  createLinkSignupElement: MockFn
  getPaymentElement: MockFn
  getBillingAddressElement: MockFn
  getShippingAddressElement: MockFn
  getExpressCheckoutElement: MockFn
  getCurrencySelectorElement: MockFn
  getTaxIdElement: MockFn
  getTermsElement: MockFn
  getLinkSignupElement: MockFn
}

// Stripe.js 10 Checkout Form SDK handle (`stripe.initCheckoutFormSdk()`, beta).
export interface MockStripeCheckoutForm {
  on: MockFn
  loadActions: MockFn
  changeAppearance: MockFn
  loadFonts: MockFn
  createForm: MockFn
  getForm: MockFn
  createCurrencySelectorElement: MockFn
  getCurrencySelectorElement: MockFn
}

// Form SDK actions: the Elements SDK actions minus the updates the form UI owns.
export type MockStripeCheckoutFormActions = Omit<
  MockStripeCheckoutActions,
  | 'updateEmail'
  | 'updatePhoneNumber'
  | 'updateShippingAddress'
  | 'updateBillingAddress'
  | 'updateTaxIdInfo'
>

export interface MockStripe {
  /** Every method-specific confirmer (`confirmCardPayment`, ...) from STRIPE_CONFIRMERS. */
  [confirmer: string]: MockFn
  elements: MockFn
  confirmPayment: MockFn
  confirmSetup: MockFn
  initCheckoutElementsSdk: MockFn
  initCheckoutFormSdk: MockFn
  createEmbeddedCheckoutPage: MockFn
  registerAppInfo: MockFn
}

// A default Custom Checkout session snapshot.
export function makeMockCheckoutSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_123',
    status: 'open',
    canConfirm: true,
    currency: 'usd',
    email: null,
    phoneNumber: null,
    billingAddress: null,
    shippingAddress: null,
    lineItems: [],
    total: { total: { minorUnitsAmount: 1099, amount: '$10.99' } },
    ...overrides
  }
}

export function makeMockCheckoutActions(): MockStripeCheckoutActions {
  const ok = (session = makeMockCheckoutSession()) => Promise.resolve({ type: 'success', session })
  return {
    getSession: vi.fn(() => makeMockCheckoutSession()),
    confirm: vi.fn(() => ok()),
    applyPromotionCode: vi.fn(() => ok()),
    removePromotionCode: vi.fn(() => ok()),
    updateEmail: vi.fn(() => ok()),
    updatePhoneNumber: vi.fn(() => ok()),
    updateBillingAddress: vi.fn(() => ok()),
    updateShippingAddress: vi.fn(() => ok()),
    updateLineItemQuantity: vi.fn(() => ok()),
    updateShippingOption: vi.fn(() => ok()),
    updateTaxIdInfo: vi.fn(() => ok()),
    runServerUpdate: vi.fn(() => ok()),
    validateElements: vi.fn(() => Promise.resolve({ type: 'success' })),
    addOptionalLineItem: vi.fn(() => ok()),
    removeOptionalLineItem: vi.fn(() => ok())
  }
}

export function makeMockCheckout(actions = makeMockCheckoutActions()): MockStripeCheckout {
  return {
    on: vi.fn(),
    loadActions: vi.fn(() => Promise.resolve({ type: 'success', actions })),
    changeAppearance: vi.fn(),
    loadFonts: vi.fn(),
    createPaymentElement: vi.fn(() => makeMockElement()),
    createBillingAddressElement: vi.fn(() => makeMockElement()),
    createShippingAddressElement: vi.fn(() => makeMockElement()),
    createExpressCheckoutElement: vi.fn(() => makeMockElement()),
    createCurrencySelectorElement: vi.fn(() => makeMockElement()),
    createTaxIdElement: vi.fn(() => makeMockElement()),
    createContactDetailsElement: vi.fn(() => makeMockElement()),
    createTermsElement: vi.fn(() => makeMockElement()),
    createLinkSignupElement: vi.fn(() => makeMockElement()),
    getPaymentElement: vi.fn(() => null),
    getBillingAddressElement: vi.fn(() => null),
    getShippingAddressElement: vi.fn(() => null),
    getExpressCheckoutElement: vi.fn(() => null),
    getCurrencySelectorElement: vi.fn(() => null),
    getTaxIdElement: vi.fn(() => null),
    getTermsElement: vi.fn(() => null),
    getLinkSignupElement: vi.fn(() => null)
  }
}

export function makeMockCheckoutFormActions(): MockStripeCheckoutFormActions {
  const {
    updateEmail: _email,
    updatePhoneNumber: _phone,
    updateShippingAddress: _shipping,
    updateBillingAddress: _billing,
    updateTaxIdInfo: _taxId,
    ...actions
  } = makeMockCheckoutActions()
  return actions
}

export function makeMockCheckoutForm(
  actions = makeMockCheckoutFormActions()
): MockStripeCheckoutForm {
  return {
    on: vi.fn(),
    loadActions: vi.fn(() => Promise.resolve({ type: 'success', actions })),
    changeAppearance: vi.fn(),
    loadFonts: vi.fn(),
    createForm: vi.fn(() => makeMockElement()),
    getForm: vi.fn(() => null),
    createCurrencySelectorElement: vi.fn(() => makeMockElement()),
    getCurrencySelectorElement: vi.fn(() => null)
  }
}

export function makeMockElement(): MockStripeElement {
  return {
    mount: vi.fn(),
    unmount: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    update: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    clear: vi.fn(),
    // Address element specific
    getValue: vi.fn(() =>
      Promise.resolve({
        complete: true,
        isNewAddress: true,
        value: {
          name: 'John Doe',
          address: {
            line1: '123 Main St',
            line2: null,
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94102',
            country: 'US'
          }
        }
      })
    )
  }
}

export function makeMockElements(): MockStripeElements {
  return {
    create: vi.fn(() => makeMockElement()),
    submit: vi.fn(() => Promise.resolve({ error: null })),
    getElement: vi.fn(),
    update: vi.fn(() => Promise.resolve()),
    fetchUpdates: vi.fn(() => Promise.resolve({ error: null })),
    on: vi.fn()
  }
}

// One mock per method-specific confirmer, resolving Stripe's success shape.
function makeMockConfirmers(): Record<string, MockFn> {
  return Object.fromEntries(
    STRIPE_CONFIRMERS.map((name) => [
      name,
      vi.fn(() =>
        Promise.resolve(
          name.endsWith('Setup')
            ? { setupIntent: { id: 'seti_test_123', status: 'succeeded' } }
            : { paymentIntent: { id: 'pi_test_123', status: 'succeeded' } }
        )
      )
    ])
  )
}

export function makeMockStripe(): MockStripe {
  return {
    ...makeMockConfirmers(),
    elements: vi.fn(() => makeMockElements()),
    confirmPayment: vi.fn(() =>
      Promise.resolve({
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
      })
    ),
    confirmSetup: vi.fn(() =>
      Promise.resolve({
        setupIntent: { id: 'seti_test_123', status: 'succeeded' }
      })
    ),
    initCheckoutElementsSdk: vi.fn(() => makeMockCheckout()),
    initCheckoutFormSdk: vi.fn(() => makeMockCheckoutForm()),
    createEmbeddedCheckoutPage: vi.fn(() =>
      Promise.resolve({ mount: vi.fn(), unmount: vi.fn(), destroy: vi.fn() })
    ),
    registerAppInfo: vi.fn()
  }
}

// Global default mock for the loader (happy path), built from the canonical
// factory so it can never drift from the per-test helpers. The library loads
// Stripe.js only through the side-effect-free `@stripe/stripe-js/pure` entry;
// the default entry shares the same mock so nothing can inject a real script.
vi.mock('@stripe/stripe-js/pure', () => ({
  loadStripe: Object.assign(
    vi.fn(() => Promise.resolve(makeMockStripe())),
    { setLoadParameters: vi.fn() }
  )
}))
vi.mock('@stripe/stripe-js', () => import('@stripe/stripe-js/pure'))

// loadStripeInstance() reuses an instance per arguments for the page's lifetime; each
// test is a new page, so every test gets its own mocked loadStripe() result.
beforeEach(() => clearStripeInstances())

// Configure Vue Test Utils (Vue 2 / Vue 3 via vue-demi)
if (isVue2) {
  config.global.stubs = {}
} else {
  config.global.stubs = {}
}

export const waitForStripeLoad = () => new Promise((resolve) => setTimeout(resolve, 100))

// Flush all pending promises - useful for waiting on async operations
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))
