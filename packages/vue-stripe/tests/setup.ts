import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { isVue2 } from 'vue-demi'

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
}

export interface MockStripe {
  elements: MockFn
  confirmPayment: MockFn
  confirmCardSetup: MockFn
  confirmSetup: MockFn
  registerAppInfo: MockFn
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
    getValue: vi.fn(() => Promise.resolve({
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
    }))
  }
}

export function makeMockElements(): MockStripeElements {
  return {
    create: vi.fn(() => makeMockElement()),
    submit: vi.fn(() => Promise.resolve({ error: null })),
    getElement: vi.fn(),
    update: vi.fn(),
    fetchUpdates: vi.fn(() => Promise.resolve({ error: null }))
  }
}

export function makeMockStripe(): MockStripe {
  return {
    elements: vi.fn(() => makeMockElements()),
    confirmPayment: vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    })),
    confirmCardSetup: vi.fn(() => Promise.resolve({
      setupIntent: { id: 'seti_test_123', status: 'succeeded' }
    })),
    confirmSetup: vi.fn(() => Promise.resolve({
      setupIntent: { id: 'seti_test_123', status: 'succeeded' }
    })),
    registerAppInfo: vi.fn()
  }
}

// Global default mock for @stripe/stripe-js (happy path), built from the
// canonical factory so it can never drift from the per-test helpers.
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(makeMockStripe()))
}))

// Configure Vue Test Utils (Vue 2 / Vue 3 via vue-demi)
if (isVue2) {
  config.global.stubs = {}
} else {
  config.global.stubs = {}
}

// ---------------------------------------------------------------------------
// Backwards-compatible aliases (kept so existing tests import unchanged).
// ---------------------------------------------------------------------------
export const createMockStripe = makeMockStripe
export const createMockElement = makeMockElement

export const waitForStripeLoad = () => new Promise(resolve => setTimeout(resolve, 100))

// Flush all pending promises - useful for waiting on async operations
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
